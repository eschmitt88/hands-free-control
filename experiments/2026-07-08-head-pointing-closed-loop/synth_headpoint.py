#!/usr/bin/env python3
"""Headless validator for the closed-loop head-pointing metrics.

Simulates a human closed-loop pointer — a proportional controller with reaction
delay and motor noise — driving the configured target sequence at given gain
multipliers, writes a synthetic ``trials.jsonl`` in the exact schema the webapp
produces, and runs ``analyze_headpoint.py`` on it. ``--selfcheck`` asserts the
metric math responds correctly to KNOWN inputs (a perfect controller scores
success=1 / settle≈0 / overshoot=0 / path_eff≈1; a sloppy one scores higher
overshoot and settle) — the head-pointing analogue of the gaze experiment's
``synth.py --selfcheck``. No webcam / MediaPipe needed.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
from typing import List, Optional

import numpy as np

import analyze_headpoint as A

DIR = os.path.dirname(os.path.abspath(__file__))
DT_MS = 16.0  # ~60 fps


def simulate_trial(
    rng: np.random.Generator,
    start_px: np.ndarray,
    target_px: np.ndarray,
    radius: float,
    gain_mult: float,
    gain_px_per_rad: float,
    W: float,
    H: float,
    *,
    base_kp: float,
    delay_steps: int,
    noise_px: float,
    dwell_ms: float,
    timeout_ms: float,
    prev_norm: Optional[list],
    target_norm: list,
) -> dict:
    """One closed-loop acquisition. Effective loop gain scales with gain_mult."""
    kp = base_kp * gain_mult
    cursor = start_px.astype(float).copy()
    hist: List[np.ndarray] = [cursor.copy()]
    samples = []
    t = 0.0
    inside_since: Optional[float] = None
    t_acquire: Optional[float] = None

    center = np.array([W / 2.0, H / 2.0])
    while t <= timeout_ms:
        # head angles implied by cursor offset from center (schema completeness)
        yaw = (cursor[0] - center[0]) / gain_px_per_rad
        pitch = (cursor[1] - center[1]) / gain_px_per_rad
        samples.append([round(t, 1), round(float(cursor[0]), 2), round(float(cursor[1]), 2),
                        round(float(yaw), 5), round(float(pitch), 5)])

        dist = float(np.hypot(cursor[0] - target_px[0], cursor[1] - target_px[1]))
        if dist <= radius:
            if inside_since is None:
                inside_since = t
            elif t - inside_since >= dwell_ms:
                t_acquire = t
                break
        else:
            inside_since = None

        # proportional correction toward target as perceived `delay_steps` ago
        delayed = hist[max(0, len(hist) - 1 - delay_steps)]
        cursor = cursor + kp * (target_px - delayed)
        if noise_px > 0:
            cursor = cursor + rng.normal(0.0, noise_px, size=2)
        cursor = np.array([np.clip(cursor[0], 0, W), np.clip(cursor[1], 0, H)])
        hist.append(cursor.copy())
        t += DT_MS

    hit = t_acquire is not None
    return {
        "gain_mult": gain_mult,
        "gain_px_per_rad": gain_px_per_rad,
        "target_norm": target_norm,
        "target_radius_px": radius,
        "prev_norm": prev_norm,
        "outcome": "hit" if hit else "miss",
        "t_appear_ms": 0.0,
        "t_acquire_ms": t_acquire,
        "samples": samples,
    }


def gen_session(
    cfg: dict, tag: str, *, base_kp: float, delay_steps: int, noise_px: float,
    seed: int = 42, mults: Optional[list] = None
) -> str:
    rng = np.random.default_rng(seed)
    W = float(cfg["screen"]["width_px"])
    H = float(cfg["screen"]["height_px"])
    dwell_ms = float(cfg["dwell"]["dwell_ms"])
    timeout_ms = float(cfg["task"]["timeout_ms"])
    targets = cfg["task"]["targets"]
    gain0 = float(cfg["control"]["default_gain_px_per_rad"])
    # Default: the config robustness sweep. The self-check pins a single x1.0 so
    # the "perfect" controller's effective gain (base_kp * mult) isn't scaled down.
    mults = [float(m) for m in (mults if mults is not None else cfg["robustness"]["gain_multipliers"])]

    session = os.path.join(DIR, "results", f"hpsession_synth_{tag}")
    os.makedirs(session, exist_ok=True)
    rows = []
    for mult in mults:
        prev_norm = None
        prev_px = np.array([W / 2.0, H / 2.0])
        for tg in targets:
            tnorm = [float(tg["pos"][0]), float(tg["pos"][1])]
            tpx = np.array([tnorm[0] * W, tnorm[1] * H])
            row = simulate_trial(
                rng, prev_px, tpx, float(tg["radius_px"]), mult, gain0 * mult, W, H,
                base_kp=base_kp, delay_steps=delay_steps, noise_px=noise_px,
                dwell_ms=dwell_ms, timeout_ms=timeout_ms,
                prev_norm=prev_norm, target_norm=tnorm,
            )
            rows.append(row)
            prev_norm, prev_px = tnorm, tpx

    with open(os.path.join(session, "trials.jsonl"), "w", encoding="utf-8") as fh:
        for r in rows:
            fh.write(json.dumps(r) + "\n")
    meta = {
        "screen_px": [W, H],
        "screen_mm": [cfg["screen"]["width_mm"], cfg["screen"]["height_mm"]],
        "viewing_distance_mm": cfg["viewing_distance_mm"],
        "camera": [1280, 720],
        "chosen_gain_px_per_rad": gain0,
        "smoothing_alpha": cfg["control"]["smoothing_alpha"],
        "invert_pitch": cfg["control"]["invert_pitch"],
        "source": "synth",
        "controller": {"base_kp": base_kp, "delay_steps": delay_steps, "noise_px": noise_px},
        "generated": _dt.datetime.now().isoformat(timespec="seconds"),
    }
    with open(os.path.join(session, "meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=2)
        fh.write("\n")
    return session


def selfcheck(cfg: dict) -> int:
    # A perfect controller at x1.0 gain: one-step snap (kp=1.0), no delay, no noise.
    perfect_dir = gen_session(cfg, "perfect", base_kp=1.0, delay_steps=0, noise_px=0.0, mults=[1.0])
    perfect = A.analyze_session(perfect_dir, cfg)["overall"]
    # A sloppy controller at x1.0 gain: reaction delay + motor noise -> jitter/overshoot,
    # but still mostly acquires (so the contrast is overshoot/settle, not mass failure).
    sloppy_dir = gen_session(cfg, "sloppy", base_kp=0.4, delay_steps=1, noise_px=4.0, mults=[1.0])
    sloppy = A.analyze_session(sloppy_dir, cfg)["overall"]

    print("perfect:", json.dumps(perfect))
    print("sloppy :", json.dumps(sloppy))

    # Use explicit None guards, not truthiness (0.0 is a valid, falsy metric).
    def g(d, k, default):
        v = d.get(k)
        return default if v is None else v

    checks = [
        ("perfect success == 1.0", perfect["success_rate"] == 1.0),
        ("perfect settle < 0.5 px", g(perfect, "median_settle_px", 9) < 0.5),
        ("perfect overshoot == 0", g(perfect, "mean_overshoot", 1) == 0),
        ("perfect path_eff > 0.95", g(perfect, "median_path_eff", 0) > 0.95),
        ("sloppy overshoot > perfect", g(sloppy, "mean_overshoot", 0) > g(perfect, "mean_overshoot", 0)),
        ("sloppy settle > perfect", g(sloppy, "median_settle_px", 0) > g(perfect, "median_settle_px", 0)),
        ("sloppy throughput finite", sloppy["median_throughput_bps"] is not None),
    ]
    ok = True
    for name, passed in checks:
        print(f"  [{'PASS' if passed else 'FAIL'}] {name}")
        ok = ok and passed
    print("\nSELFCHECK:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--selfcheck", action="store_true", help="validate metric math on known controllers")
    ap.add_argument("--tag", default="manual", help="session tag when not self-checking")
    ap.add_argument("--base-kp", type=float, default=0.6)
    ap.add_argument("--delay-steps", type=int, default=3)
    ap.add_argument("--noise-px", type=float, default=6.0)
    args = ap.parse_args()

    cfg = A.load_yaml(os.path.join(DIR, "config.yaml"))
    if args.selfcheck:
        return selfcheck(cfg)
    session = gen_session(cfg, args.tag, base_kp=args.base_kp,
                          delay_steps=args.delay_steps, noise_px=args.noise_px)
    metrics = A.analyze_session(session, cfg)
    A._print(metrics)
    print(f"\n(synthetic session at {session})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
