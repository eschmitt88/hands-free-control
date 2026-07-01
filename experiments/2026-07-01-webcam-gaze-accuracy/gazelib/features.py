"""MediaPipe Face-Mesh feature extraction (WORKSTATION ONLY).

This module imports mediapipe + cv2 and is the ONLY gazelib module allowed to.
It runs on the collection workstation (needs a webcam); it must never be
imported by the headless analysis path (analyze.py / synth.py).

Two feature channels are produced per frame:

gaze_features  (length 6) — appearance-ish landmark features for eye gaze:
    [ r_iris_off_x, r_iris_off_y, r_openness,
      l_iris_off_x, l_iris_off_y, l_openness ]
    Each iris offset is the iris-centre position relative to the midpoint of
    that eye's inner/outer corners, and each openness is the vertical
    eyelid gap. All are normalized by the inter-ocular distance (distance
    between the two outer eye corners) so the features are scale-invariant to
    how close the face is to the camera.

headpose_features (length 5) — rigid head orientation + position:
    [ yaw_deg, pitch_deg, roll_deg, centroid_x_norm, centroid_y_norm ]
    yaw/pitch/roll come from cv2.solvePnP against a canonical 3D face-model
    subset; the centroid is the mean landmark position normalized to the
    frame ([0,1], [0,1]) and captures translational head pointing.
"""

from __future__ import annotations

from typing import Dict, List, Optional

import cv2
import mediapipe as mp
import numpy as np

# --- MediaPipe Face-Mesh landmark indices (refine_landmarks=True) ------------
# Right eye (subject's right = image left)
_R_OUTER, _R_INNER = 33, 133
_R_TOP, _R_BOTTOM = 159, 145
_R_IRIS = (469, 470, 471, 472)  # ring; centre = mean
# Left eye
_L_INNER, _L_OUTER = 362, 263
_L_TOP, _L_BOTTOM = 386, 374
_L_IRIS = (474, 475, 476, 477)

# Canonical 3D face-model subset (approx, mm) for solvePnP, paired with the
# corresponding landmark indices below. Coordinates: x right, y up, z toward cam.
_PNP_MODEL = np.array(
    [
        (0.0, 0.0, 0.0),        # nose tip        (1)
        (0.0, -63.6, -12.5),    # chin            (152)
        (-43.3, 32.7, -26.0),   # right eye outer (33)
        (43.3, 32.7, -26.0),    # left eye outer  (263)
        (-28.9, -28.9, -24.1),  # right mouth     (61)
        (28.9, -28.9, -24.1),   # left mouth      (291)
    ],
    dtype=np.float64,
)
_PNP_IDX = (1, 152, 33, 263, 61, 291)

_GAZE_LEN = 6
_HEADPOSE_LEN = 5

# Single shared FaceMesh instance (lazily created).
_face_mesh = None


def _get_face_mesh():
    global _face_mesh
    if _face_mesh is None:
        _face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
    return _face_mesh


def _iris_center(pts: np.ndarray, ring: tuple) -> np.ndarray:
    return pts[list(ring)].mean(axis=0)


def extract_features(frame_bgr: np.ndarray) -> Optional[Dict[str, np.ndarray]]:
    """Extract gaze + head-pose features from a BGR frame.

    Returns ``{"gaze_features": np.ndarray(6,), "headpose_features": np.ndarray(5,)}``
    or ``None`` if no face is detected / extraction fails.
    """
    if frame_bgr is None:
        return None
    h, w = frame_bgr.shape[:2]
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    result = _get_face_mesh().process(rgb)
    if not result.multi_face_landmarks:
        return None

    lms = result.multi_face_landmarks[0].landmark
    # Pixel-space landmark array (N, 2).
    pts = np.array([(lm.x * w, lm.y * h) for lm in lms], dtype=np.float64)
    if pts.shape[0] < 478:
        return None

    # --- Inter-ocular scale (outer corner to outer corner) -------------------
    iod = float(np.linalg.norm(pts[_R_OUTER] - pts[_L_OUTER]))
    if iod < 1e-6:
        return None

    def eye_feats(outer, inner, top, bottom, iris_ring):
        center = (pts[outer] + pts[inner]) / 2.0
        iris = _iris_center(pts, iris_ring)
        off = (iris - center) / iod
        openness = float(np.linalg.norm(pts[top] - pts[bottom])) / iod
        return [float(off[0]), float(off[1]), openness]

    gaze = (
        eye_feats(_R_OUTER, _R_INNER, _R_TOP, _R_BOTTOM, _R_IRIS)
        + eye_feats(_L_OUTER, _L_INNER, _L_TOP, _L_BOTTOM, _L_IRIS)
    )
    gaze_features = np.asarray(gaze, dtype=float)

    # --- Head pose via solvePnP ---------------------------------------------
    image_pts = np.array([pts[i] for i in _PNP_IDX], dtype=np.float64)
    focal = float(w)
    cam_matrix = np.array(
        [[focal, 0, w / 2.0], [0, focal, h / 2.0], [0, 0, 1]], dtype=np.float64
    )
    dist = np.zeros((4, 1), dtype=np.float64)
    ok, rvec, _tvec = cv2.solvePnP(
        _PNP_MODEL, image_pts, cam_matrix, dist, flags=cv2.SOLVEPNP_ITERATIVE
    )
    if not ok:
        return None
    rot, _ = cv2.Rodrigues(rvec)
    yaw, pitch, roll = _rotation_to_euler(rot)

    centroid = pts.mean(axis=0)
    centroid_norm = np.array([centroid[0] / w, centroid[1] / h], dtype=float)

    headpose_features = np.array(
        [yaw, pitch, roll, float(centroid_norm[0]), float(centroid_norm[1])],
        dtype=float,
    )
    return {"gaze_features": gaze_features, "headpose_features": headpose_features}


def _rotation_to_euler(R: np.ndarray) -> tuple:
    """Convert a 3x3 rotation matrix to (yaw, pitch, roll) degrees."""
    sy = float(np.sqrt(R[0, 0] ** 2 + R[1, 0] ** 2))
    if sy > 1e-6:
        pitch = np.arctan2(-R[2, 0], sy)
        yaw = np.arctan2(R[1, 0], R[0, 0])
        roll = np.arctan2(R[2, 1], R[2, 2])
    else:  # gimbal lock
        pitch = np.arctan2(-R[2, 0], sy)
        yaw = 0.0
        roll = np.arctan2(-R[1, 2], R[1, 1])
    return float(np.degrees(yaw)), float(np.degrees(pitch)), float(np.degrees(roll))


def aggregate(list_of_feature_dicts: List[Optional[Dict[str, np.ndarray]]]) -> Optional[Dict[str, np.ndarray]]:
    """Average each feature vector across frames, dropping ``None`` entries.

    Returns ``None`` if no frame yielded a face.
    """
    valid = [d for d in list_of_feature_dicts if d is not None]
    if not valid:
        return None
    gaze = np.mean([d["gaze_features"] for d in valid], axis=0)
    head = np.mean([d["headpose_features"] for d in valid], axis=0)
    return {"gaze_features": np.asarray(gaze, dtype=float),
            "headpose_features": np.asarray(head, dtype=float)}
