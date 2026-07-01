"""Screen / visual-angle geometry.

Headless-safe: imports only numpy + stdlib.

Coordinate conventions
----------------------
- Screen pixels: origin top-left, x right, y down (matches pygame / splits.yaml).
- The eye is assumed to sit on the perpendicular through the screen CENTRE at
  ``viewing_distance_mm``. A screen pixel maps to a 3D vector (in cm) pointing
  from the eye to that on-screen point; the visual-angle error between two
  targets is the angle between their eye-vectors.

``cfg`` is the parsed ``config.yaml`` dict; it must contain a ``screen`` block
(``width_px``, ``height_px``, ``width_mm``, ``height_mm``) and
``viewing_distance_mm``.
"""

from __future__ import annotations

from typing import Sequence, Tuple

import numpy as np


def mm_per_px(cfg: dict) -> Tuple[float, float]:
    """Return (mx, my) millimetres-per-pixel for x and y from the screen block."""
    s = cfg["screen"]
    mx = float(s["width_mm"]) / float(s["width_px"])
    my = float(s["height_mm"]) / float(s["height_px"])
    return mx, my


def screen_point_to_eye_vector(px_xy: Sequence[float], cfg: dict) -> np.ndarray:
    """Convert a screen pixel (x, y) to a 3D eye->point vector in centimetres.

    x_cm = (px_x - width_px/2) * mx / 10
    y_cm = (px_y - height_px/2) * my / 10
    z_cm = viewing_distance_mm / 10
    """
    s = cfg["screen"]
    mx, my = mm_per_px(cfg)
    px_x, px_y = float(px_xy[0]), float(px_xy[1])
    x_cm = (px_x - float(s["width_px"]) / 2.0) * mx / 10.0
    y_cm = (px_y - float(s["height_px"]) / 2.0) * my / 10.0
    z_cm = float(cfg["viewing_distance_mm"]) / 10.0
    return np.array([x_cm, y_cm, z_cm], dtype=float)


def angular_error_deg(true_px: Sequence[float], pred_px: Sequence[float], cfg: dict) -> float:
    """Visual-angle error (degrees) between the eye-vectors to true and pred points."""
    a = screen_point_to_eye_vector(true_px, cfg)
    b = screen_point_to_eye_vector(pred_px, cfg)
    na = float(np.linalg.norm(a))
    nb = float(np.linalg.norm(b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    cos = float(np.dot(a, b) / (na * nb))
    cos = max(-1.0, min(1.0, cos))
    return float(np.degrees(np.arccos(cos)))


def euclidean_px(a_px: Sequence[float], b_px: Sequence[float]) -> float:
    """Euclidean pixel distance between two screen points."""
    a = np.asarray(a_px, dtype=float)
    b = np.asarray(b_px, dtype=float)
    return float(np.linalg.norm(a - b))


def px_to_cm(err_px: float, cfg: dict) -> float:
    """Convert a pixel distance to centimetres using the mean of (mx, my)."""
    mx, my = mm_per_px(cfg)
    mean_mm_per_px = (mx + my) / 2.0
    return float(err_px) * mean_mm_per_px / 10.0
