#!/usr/bin/env python3
"""Headless analysis of a webcam gaze/head-pose session.

Fit a per-user ridge calibration on the CALIBRATION targets, score it on the
VALIDATION targets, and write ``metrics.json`` (the search signal). With
``--final`` it additionally scores the held-out TEST targets into
``final_metrics.json`` — this is the ONLY code path that reads ``test.jsonl``
(HCE rule, ~/.claude/rules/evaluation.md).

Headless-safe: imports only numpy / sklearn (via gazelib) / pyyaml / stdlib.
Never imports mediapipe / cv2 / pygame.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import glob
import json
import os
from typing import Dict, List, Optional

import numpy as np
import yaml

from gazelib import geometry
from gazelib.calibrate import RidgeCalibrator, load_session_jsonl, stack_features
from gazelib.dwell import false_activation_rate

DIR = os.path.dirname(os.path.abspath(__file__))

# method name -> feature key
_METHOD_KEYS = {"gaze": "gaze_features", "headpose": "headpose_features"}


def load_yaml(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def apply_session_geometry(cfg: dict, session: str) -> dict:
    """Override screen geometry from the session's ``meta.json`` when present.

    The real monitor geometry (physical size + eye-to-screen distance) is
    measured in the browser collector, not ``config.yaml``. When a session dir
    carries a ``meta.json`` that supplies ``screen_px`` + ``screen_mm`` +
    ``viewing_distance_mm``, those OVERRIDE the cfg ``screen`` block and
    ``viewing_distance_mm`` for the geometry / visual-angle math. Falls back to
    ``config.yaml`` when the file or any of those keys is absent — so synthetic
    sessions (whose meta.json has no ``screen_mm``) still use config.yaml, and
    the metric math is unchanged for the headless self-check. Returns a new cfg
    dict (the input is not mutated).
    """
    meta_path = os.path.join(session, "meta.json")
    if not os.path.isfile(meta_path):
        return cfg
    try:
        with open(meta_path, "r", encoding="utf-8") as fh:
            meta = json.load(fh)
    except (OSError, ValueError):
        return cfg
    spx = meta.get("screen_px")
    smm = meta.get("screen_mm")
    vdist = meta.get("viewing_distance_mm")
    # Require all three (and well-formed px/mm pairs); otherwise keep config.yaml.
    if not (spx and smm and vdist):
        return cfg
    try:
        w_px, h_px = float(spx[0]), float(spx[1])
        w_mm, h_mm = float(smm[0]), float(smm[1])
        vdist = float(vdist)
    except (TypeError, ValueError, IndexError):
        return cfg
    cfg = dict(cfg)
    cfg["screen"] = dict(cfg.get("screen", {}))
    cfg["screen"].update(
        {"width_px": w_px, "height_px": h_px, "width_mm": w_mm, "height_mm": h_mm}
    )
    cfg["viewing_distance_mm"] = vdist
    return cfg


def latest_session(results_dir: str) -> Optional[str]:
    """Return the most recently modified results/session_* dir, or None."""
    candidates = [
        p for p in glob.glob(os.path.join(results_dir, "session_*")) if os.path.isdir(p)
    ]
    if not candidates:
        return None
    return max(candidates, key=os.path.getmtime)


def _round(x: float, n: int = 3) -> float:
    return round(float(x), n)


def method_metrics(
    cal_samples: List[dict], eval_samples: List[dict], key: str, cfg: dict
) -> Dict[str, float]:
    """Fit a calibrator on ``cal_samples`` for feature ``key`` and score ``eval_samples``."""
    alpha = float(cfg["estimator"]["ridge_alpha"])
    X_cal, Y_cal_px, _ = stack_features(cal_samples, key, cfg)
    X_ev, Y_ev_px, _ = stack_features(eval_samples, key, cfg)

    calib = RidgeCalibrator(alpha=alpha).fit(X_cal, Y_cal_px)
    pred_px = calib.predict(X_ev)

    deg = np.array(
        [geometry.angular_error_deg(Y_ev_px[i], pred_px[i], cfg) for i in range(len(Y_ev_px))]
    )
    err_px = np.array([geometry.euclidean_px(Y_ev_px[i], pred_px[i]) for i in range(len(Y_ev_px))])
    err_cm = np.array([geometry.px_to_cm(e, cfg) for e in err_px])

    far = false_activation_rate(list(Y_ev_px), list(pred_px), cfg)

    return {
        "mean_error_deg": _round(np.mean(deg)),
        "median_error_deg": _round(np.median(deg)),
        "p95_error_deg": _round(np.percentile(deg, 95)),
        "mean_error_cm": _round(np.mean(err_cm)),
        "false_activation_rate": _round(far),
    }


def compute_metrics(cal_samples: List[dict], eval_samples: List[dict], cfg: dict) -> Dict[str, dict]:
    """Compute per-method metrics for every configured method.

    Returns ``{"method_gaze": {...}, "method_headpose": {...}}`` (only for the
    methods listed in ``cfg['estimator']['methods']``).
    """
    out: Dict[str, dict] = {}
    for method in cfg["estimator"]["methods"]:
        key = _METHOD_KEYS[method]
        out[f"method_{method}"] = method_metrics(cal_samples, eval_samples, key, cfg)
    return out


def _print_table(title: str, metrics: Dict[str, dict]) -> None:
    print(f"\n{title}")
    header = f"  {'method':<10} {'mean_deg':>9} {'med_deg':>9} {'p95_deg':>9} {'mean_cm':>8} {'false_act':>10}"
    print(header)
    print("  " + "-" * (len(header) - 2))
    for name, m in metrics.items():
        if not name.startswith("method_"):
            continue
        method = name.replace("method_", "")
        print(
            f"  {method:<10} {m['mean_error_deg']:>9} {m['median_error_deg']:>9} "
            f"{m['p95_error_deg']:>9} {m['mean_error_cm']:>8} {m['false_activation_rate']:>10}"
        )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--session", default=None, help="session dir (default: latest results/session_*)")
    ap.add_argument("--final", action="store_true", help="also score the held-out test split")
    args = ap.parse_args()

    cfg = load_yaml(os.path.join(DIR, "config.yaml"))
    # splits.yaml is loaded for provenance only; targets come from the session files.
    _ = load_yaml(os.path.join(DIR, "splits.yaml"))

    results_dir = os.path.join(DIR, "results")
    session = args.session or latest_session(results_dir)
    if session is None:
        raise SystemExit(f"no session found under {results_dir} (run collect.py or synth.py first)")
    session = os.path.abspath(session)

    # Per-session monitor geometry (browser-collected) overrides config.yaml.
    cfg = apply_session_geometry(cfg, session)

    cal_samples = load_session_jsonl(os.path.join(session, "calibration.jsonl"))
    val_samples = load_session_jsonl(os.path.join(session, "validation.jsonl"))

    metrics = compute_metrics(cal_samples, val_samples, cfg)
    metrics["meta"] = {
        "n_calibration": len(cal_samples),
        "n_validation": len(val_samples),
        "session": os.path.basename(session),
        "viewing_distance_mm": cfg["viewing_distance_mm"],
        "generated": _dt.datetime.now().isoformat(timespec="seconds"),
    }

    out_path = os.path.join(DIR, "metrics.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2)
        fh.write("\n")
    _print_table(f"VALIDATION metrics  (session: {os.path.basename(session)})", metrics)
    print(f"\nwrote {out_path}")

    if args.final:
        # --- FINAL SCORING PASS (the only reader of test.jsonl) --------------
        test_samples = load_session_jsonl(os.path.join(session, "test.jsonl"))
        final = compute_metrics(cal_samples, test_samples, cfg)
        final["meta"] = {
            "n_calibration": len(cal_samples),
            "n_test": len(test_samples),
            "session": os.path.basename(session),
            "viewing_distance_mm": cfg["viewing_distance_mm"],
            "generated": _dt.datetime.now().isoformat(timespec="seconds"),
        }
        final_path = os.path.join(DIR, "final_metrics.json")
        with open(final_path, "w", encoding="utf-8") as fh:
            json.dump(final, fh, indent=2)
            fh.write("\n")
        _print_table("HELD-OUT TEST metrics", final)
        print(f"\nwrote held-out scores to {final_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
