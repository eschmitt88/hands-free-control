"""Per-user calibration: map feature vectors to on-screen pixel targets.

Headless-safe: imports only numpy / sklearn / json / stdlib.
"""

from __future__ import annotations

import json
from typing import List, Tuple

import numpy as np
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


class RidgeCalibrator:
    """Multi-output ridge regression mapping features X (n, d) -> pixels Y (n, 2).

    Features are standardized (zero mean, unit variance per column) before the
    ridge, so ``alpha`` regularizes on a common scale rather than being coupled
    to each feature's natural magnitude. This matters: the raw gaze/head-pose
    features have small, heterogeneous scales (normalized iris offsets ~0.01-0.1,
    angles in degrees, ...), and a fixed ``alpha`` on un-standardized features
    would shrink the large coefficients needed to reach pixel scale by a
    scale-dependent (and per-feature-uneven) amount, biasing the per-user
    calibration. StandardScaler makes ``alpha`` meaningful and scale-invariant.

    A single multi-output ``Ridge`` handles both the x and y screen coordinates
    independently (equivalent to two decoupled ridges).
    """

    def __init__(self, alpha: float = 1.0) -> None:
        self.alpha = float(alpha)
        self._model = Pipeline(
            [
                ("scaler", StandardScaler()),
                ("ridge", Ridge(alpha=self.alpha, fit_intercept=True)),
            ]
        )

    def fit(self, X: np.ndarray, Y_px: np.ndarray) -> "RidgeCalibrator":
        X = np.asarray(X, dtype=float)
        Y_px = np.asarray(Y_px, dtype=float)
        self._model.fit(X, Y_px)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=float)
        pred = self._model.predict(X)
        return np.asarray(pred, dtype=float).reshape(-1, 2)


def load_session_jsonl(path: str) -> List[dict]:
    """Load a phase jsonl file (one aggregated sample per line) into a list of dicts."""
    samples: List[dict] = []
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            samples.append(json.loads(line))
    return samples


def stack_features(
    samples: List[dict], key: str, cfg: dict
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Stack a feature key across samples into design matrices.

    Parameters
    ----------
    samples : list of dict
        Each has ``target_norm`` ([x, y] in [0, 1]) and the feature key.
    key : {"gaze_features", "headpose_features"}
        Which feature vector to stack.
    cfg : dict
        Parsed config; used to convert normalized targets to pixels.

    Returns
    -------
    X : (n, d) float array of feature vectors.
    Y_px : (n, 2) float array of pixel targets (target_norm * screen px).
    targets_norm : (n, 2) float array of the normalized targets.
    """
    if key not in ("gaze_features", "headpose_features"):
        raise ValueError(f"unknown feature key: {key!r}")
    s = cfg["screen"]
    w_px, h_px = float(s["width_px"]), float(s["height_px"])

    X_rows: List[List[float]] = []
    Y_rows: List[List[float]] = []
    T_rows: List[List[float]] = []
    for smp in samples:
        feat = smp.get(key)
        if feat is None:
            continue
        tn = smp["target_norm"]
        X_rows.append([float(v) for v in feat])
        T_rows.append([float(tn[0]), float(tn[1])])
        Y_rows.append([float(tn[0]) * w_px, float(tn[1]) * h_px])

    X = np.asarray(X_rows, dtype=float)
    Y_px = np.asarray(Y_rows, dtype=float)
    targets_norm = np.asarray(T_rows, dtype=float)
    return X, Y_px, targets_norm
