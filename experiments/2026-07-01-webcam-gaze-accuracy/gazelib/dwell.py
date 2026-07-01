"""Dwell-selection simulation: coarse decoy-cell false-activation metric.

Headless-safe: imports only stdlib.

A "false activation" models dwell-to-select: if the estimated gaze point falls
in a decoy grid cell other than the intended target's cell, a dwell selector
would (wrongly) select that cell. The rate is a proxy for how impractical
dwell-only selection is at this accuracy.
"""

from __future__ import annotations

from typing import Sequence, Tuple


def decoy_cell(px_xy: Sequence[float], cfg: dict) -> Tuple[int, int]:
    """Return (col, row) of the decoy grid cell containing screen pixel (x, y)."""
    s = cfg["screen"]
    cols, rows = cfg["dwell"]["decoy_grid"]
    w_px, h_px = float(s["width_px"]), float(s["height_px"])

    col = int(float(px_xy[0]) / w_px * int(cols))
    row = int(float(px_xy[1]) / h_px * int(rows))
    col = max(0, min(int(cols) - 1, col))
    row = max(0, min(int(rows) - 1, row))
    return col, row


def false_activation_rate(
    true_px_list: Sequence[Sequence[float]],
    pred_px_list: Sequence[Sequence[float]],
    cfg: dict,
) -> float:
    """Fraction of samples whose predicted point lands in a decoy cell != the true cell."""
    n = len(true_px_list)
    if n == 0:
        return 0.0
    wrong = 0
    for true_px, pred_px in zip(true_px_list, pred_px_list):
        if decoy_cell(pred_px, cfg) != decoy_cell(true_px, cfg):
            wrong += 1
    return wrong / n
