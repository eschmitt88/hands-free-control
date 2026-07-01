#!/usr/bin/env python3
"""Synthetic session generator — validates the metric math with NO webcam.

Generates calibration / validation / test jsonl files whose features are an
(approximate) identity map to the normalized targets plus gaussian noise sized
so the on-screen residual subtends ~``--inject-deg`` of visual angle. A ridge
calibrator therefore recovers the targets and the residual error should match
the injected angle — which ``--selfcheck`` asserts against the analyze pipeline.

Headless-safe: imports only numpy / pyyaml / stdlib (+ analyze/gazelib, which
are themselves headless-safe).
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import tempfile
from typing import Dict, List

import numpy as np
import yaml

import analyze
from gazelib import geometry

DIR = os.path.dirname(os.path.abspath(__file__))


def _mean_val_angle(std_px: float, val_targets_px: List[List[float]], cfg: dict,
                    n_rep: int, seed: int) -> float:
    """Mean angular error (deg) of isotropic per-axis gaussian pixel noise.

    For each validation target pixel, draw ``n_rep`` noise samples of per-axis
    std ``std_px`` and measure the EXACT ``geometry.angular_error_deg`` used by
    analyze.py, then average over all targets and replicates. The RNG is
    reseeded per call so the mapping std_px -> mean-angle is a smooth monotonic
    function (suitable for bisection).
    """
    rng = np.random.default_rng(int(seed))
    errs: List[float] = []
    for px, py in val_targets_px:
        nx = rng.normal(0.0, std_px, size=n_rep)
        ny = rng.normal(0.0, std_px, size=n_rep)
        for k in range(n_rep):
            errs.append(geometry.angular_error_deg((px, py), (px + nx[k], py + ny[k]), cfg))
    return float(np.mean(errs))


def _calibrate_std_px(inject_deg: float, cfg: dict, splits: dict, seed: int = 0,
                      n_rep: int = 400, max_iter: int = 40, tol: float = 0.02) -> float:
    """Bisect the per-axis pixel std so the produced mean angular error ~= inject_deg.

    This makes the injected degree self-consistent with the exact metric used by
    analyze.py (accounting for the 2D radial-vs-per-axis factor AND for off-centre
    validation targets, where a given pixel error subtends a different angle).
    """
    s = cfg["screen"]
    w_px, h_px = float(s["width_px"]), float(s["height_px"])
    val_targets_px = [[float(t[0]) * w_px, float(t[1]) * h_px] for t in splits["validation"]]

    lo, hi = 0.1, 1000.0
    mid = (lo + hi) / 2.0
    for _ in range(int(max_iter)):
        mid = (lo + hi) / 2.0
        mean_ang = _mean_val_angle(mid, val_targets_px, cfg, n_rep, seed)
        if abs(mean_ang - inject_deg) <= tol * inject_deg:
            return mid
        if mean_ang < inject_deg:
            lo = mid
        else:
            hi = mid
    return mid


# Aggregated samples generated per target. A real collect.py session has one
# sample per target; synth replicates each target so the recovered mean
# converges to the bisection's expectation (16 validation targets * 1 draw is
# too noisy to assert tight recovery bounds).
_REPS_PER_TARGET = 25


def generate_session(out_dir: str, inject_deg: float, cfg: dict, splits: dict, seed: int,
                     reps: int = _REPS_PER_TARGET) -> str:
    """Write calibration/validation/test jsonl + meta.json to ``out_dir``; return it."""
    os.makedirs(out_dir, exist_ok=True)
    rng = np.random.default_rng(int(seed))

    s = cfg["screen"]
    w_px, h_px = float(s["width_px"]), float(s["height_px"])
    # Empirically calibrate the per-axis pixel std against the exact metric so
    # recovered ~= injected (fixed bisection seed -> reproducible sizing).
    sigma_px = _calibrate_std_px(inject_deg, cfg, splits, seed=0)

    # Features live on the PIXEL scale (target_px + isotropic per-axis noise of
    # std sigma_px). This is deliberate: Ridge(alpha) shrinks coefficients
    # relative to the feature energy XtX, so normalized features (range ~[0,1],
    # XtX ~ alpha) would be halved by alpha=1.0 and corrupt recovery. On the
    # pixel scale the identity map needs coefficients ~1 with XtX >> alpha, so
    # shrinkage is negligible.
    #
    # CALIBRATION is generated noise-free so the fitted map is the exact
    # identity (no errors-in-variables attenuation, which otherwise shrinks the
    # coefficients by var_signal/(var_signal+var_noise) and biases recovery
    # downward, growing with the injected angle). VALIDATION and TEST carry the
    # injected noise, so the recovered residual equals that noise and is
    # self-consistent with the pure-noise bisection above.
    for phase in ("calibration", "validation", "test"):
        noisy = phase != "calibration"
        n_rep = int(reps) if noisy else 1
        lines: List[str] = []
        for target in splits[phase]:
            tx, ty = float(target[0]), float(target[1])
            for _ in range(n_rep):
                nx = rng.normal(0.0, sigma_px) if noisy else 0.0
                ny = rng.normal(0.0, sigma_px) if noisy else 0.0
                # Features ~= identity map to the target pixel (+ noise), both channels.
                feat = [tx * w_px + nx, ty * h_px + ny]
                sample = {
                    "phase": phase,
                    "target_norm": [tx, ty],
                    "gaze_features": feat,
                    "headpose_features": list(feat),
                }
                lines.append(json.dumps(sample))
        with open(os.path.join(out_dir, f"{phase}.jsonl"), "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines) + ("\n" if lines else ""))

    meta = {
        "synthetic": True,
        "inject_deg": float(inject_deg),
        "sigma_px": float(sigma_px),
        "reps_per_target": int(reps),
        "seed": int(seed),
        "screen_px": [int(w_px), int(h_px)],
        "viewing_distance_mm": cfg["viewing_distance_mm"],
        "generated": _dt.datetime.now().isoformat(timespec="seconds"),
    }
    with open(os.path.join(out_dir, "meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=2)
        fh.write("\n")
    return out_dir


def _selfcheck(inject_deg: float, cfg: dict, splits: dict, seed: int) -> None:
    """Generate a synthetic session and assert analyze recovers ~inject_deg."""
    with tempfile.TemporaryDirectory(prefix="gaze_synth_") as tmp:
        out = generate_session(tmp, inject_deg, cfg, splits, seed)
        cal = analyze.load_session_jsonl(os.path.join(out, "calibration.jsonl"))
        val = analyze.load_session_jsonl(os.path.join(out, "validation.jsonl"))
        metrics = analyze.compute_metrics(cal, val, cfg)
        recovered = metrics["method_gaze"]["mean_error_deg"]

        lo, hi = 0.8 * inject_deg, 1.25 * inject_deg
        if not (lo <= recovered <= hi):
            raise SystemExit(
                f"SELFCHECK FAIL: recovered method_gaze.mean_error_deg={recovered:.3f} "
                f"not in [{lo:.3f}, {hi:.3f}] for inject={inject_deg}"
            )
        print(
            f"SELFCHECK PASS  inject={inject_deg:.2f} deg -> recovered "
            f"{recovered:.3f} deg (bounds [{lo:.3f}, {hi:.3f}]); "
            f"headpose={metrics['method_headpose']['mean_error_deg']:.3f} deg"
        )


def main() -> int:
    cfg = analyze.load_yaml(os.path.join(DIR, "config.yaml"))
    splits = analyze.load_yaml(os.path.join(DIR, "splits.yaml"))
    default_seed = int(cfg.get("seed", splits.get("seed", 42)))

    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--inject-deg", type=float, default=4.0, help="injected mean angular error (deg)")
    ap.add_argument("--out", default=os.path.join(DIR, "results", "session_synth"), help="output session dir")
    ap.add_argument("--selfcheck", action="store_true", help="generate to a temp dir and assert recovery")
    ap.add_argument("--seed", type=int, default=default_seed, help="RNG seed")
    args = ap.parse_args()

    if args.selfcheck:
        _selfcheck(args.inject_deg, cfg, splits, args.seed)
        return 0

    out = generate_session(args.out, args.inject_deg, cfg, splits, args.seed)
    print(f"wrote synthetic session (inject={args.inject_deg} deg, seed={args.seed}) to {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
