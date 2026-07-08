#!/usr/bin/env python3
"""Headless analysis of a closed-loop head-pointing session.

Reads a session dir's ``trials.jsonl`` (one row per target: target position +
acceptance radius, per-sample cursor trajectory, outcome) and computes the
CLOSED-LOOP metrics that matter for head pointing — acquisition time, settling
steadiness, overshoot, path efficiency, Fitts throughput, and a per-gain
breakdown for the gain-robustness test — then writes ``metrics.json``.

This is a behavioral characterization, not a fitted model: there is no
train/test split and no leakage surface. Imports only numpy / pyyaml / stdlib
(never mediapipe / cv2).

trials.jsonl row schema (written by the webapp, or by synth_headpoint.py):
  {
    "gain_mult": 1.0,                 # multiplier applied to the user's gain
    "gain_px_per_rad": 4000.0,        # effective gain for this trial
    "target_norm": [0.85, 0.50],      # target center, normalized to screen
    "target_radius_px": 40.0,         # acceptance radius
    "prev_norm": [0.50, 0.50],        # previous target (amplitude source); may be null
    "outcome": "hit" | "miss",
    "t_appear_ms": 0.0,
    "t_acquire_ms": 1234.0,           # null on miss
    "samples": [[t_ms, cx, cy, yaw, pitch], ...]   # cursor px + head angles
  }
"""

from __future__ import annotations

import argparse
import datetime as _dt
import glob
import json
import math
import os
from typing import Dict, List, Optional

import numpy as np
import yaml

DIR = os.path.dirname(os.path.abspath(__file__))


def load_yaml(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _round(x: float, n: int = 3) -> float:
    return round(float(x), n)


# --- geometry ----------------------------------------------------------------
def mm_per_px(cfg: dict) -> float:
    s = cfg["screen"]
    return 0.5 * (s["width_mm"] / s["width_px"] + s["height_mm"] / s["height_px"])


def px_to_cm(px: float, cfg: dict) -> float:
    return px * mm_per_px(cfg) / 10.0


def px_to_deg(px: float, cfg: dict) -> float:
    """On-screen pixel distance -> visual angle in degrees at the viewing distance."""
    mm = px * mm_per_px(cfg)
    return math.degrees(math.atan2(mm, cfg["viewing_distance_mm"]))


def apply_session_geometry(cfg: dict, session: str) -> dict:
    """Override screen geometry from the session meta.json when present (see gaze exp)."""
    meta_path = os.path.join(session, "meta.json")
    if not os.path.isfile(meta_path):
        return cfg
    try:
        with open(meta_path, "r", encoding="utf-8") as fh:
            meta = json.load(fh)
    except (OSError, ValueError):
        return cfg
    spx, smm, vdist = meta.get("screen_px"), meta.get("screen_mm"), meta.get("viewing_distance_mm")
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


# --- per-trial metrics -------------------------------------------------------
def _target_px(t: dict, W: float, H: float):
    return np.array([t["target_norm"][0] * W, t["target_norm"][1] * H])


def _amplitude_px(t: dict, W: float, H: float):
    """Distance from the previous target (or screen center) to this target."""
    prev = t.get("prev_norm")
    src = np.array([prev[0] * W, prev[1] * H]) if prev else np.array([W / 2.0, H / 2.0])
    return float(np.linalg.norm(_target_px(t, W, H) - src))


def trial_metrics(t: dict, cfg: dict, W: float, H: float) -> Optional[dict]:
    samples = t.get("samples") or []
    if len(samples) < 2:
        return None
    arr = np.array([[s[0], s[1], s[2]] for s in samples], dtype=float)  # t_ms, cx, cy
    ts, cx, cy = arr[:, 0], arr[:, 1], arr[:, 2]
    tgt = _target_px(t, W, H)
    radius = float(t["target_radius_px"])
    dwell_ms = float(cfg["dwell"]["dwell_ms"])

    dist = np.hypot(cx - tgt[0], cy - tgt[1])
    inside = dist <= radius

    # overshoot: number of inside->outside transitions before the trial ends
    # (entered the target, then drifted back out — an oscillation/instability proxy)
    trans_out = int(np.sum((inside[:-1]) & (~inside[1:])))

    # path efficiency: straight-line (start->target) over actual traversed path
    path_len = float(np.sum(np.hypot(np.diff(cx), np.diff(cy)))) or 1e-9
    straight = float(np.hypot(cx[0] - tgt[0], cy[0] - tgt[1]))
    path_eff = min(1.0, straight / path_len) if path_len > 0 else 0.0

    hit = t.get("outcome") == "hit" and t.get("t_acquire_ms") is not None
    mt_ms = (float(t["t_acquire_ms"]) - float(t["t_appear_ms"])) if hit else None

    # settling: cursor steadiness during the final dwell window (last dwell_ms
    # before acquisition). RMS distance from the window's own mean position.
    settle_px = None
    if hit:
        t_acq = float(t["t_acquire_ms"])
        win = (ts >= t_acq - dwell_ms) & (ts <= t_acq)
        if np.sum(win) >= 2:
            wx, wy = cx[win], cy[win]
            mean = np.array([wx.mean(), wy.mean()])
            settle_px = float(np.sqrt(np.mean((wx - mean[0]) ** 2 + (wy - mean[1]) ** 2)))

    # Fitts index of difficulty + throughput (bits/s)
    amp = _amplitude_px(t, W, H)
    idx = math.log2(amp / (2.0 * radius) + 1.0)
    tput = (idx / (mt_ms / 1000.0)) if (hit and mt_ms and mt_ms > 0) else None

    return {
        "gain_mult": float(t.get("gain_mult", 1.0)),
        "hit": hit,
        "acquire_ms": mt_ms,
        "settle_px": settle_px,
        "settle_deg": px_to_deg(settle_px, cfg) if settle_px is not None else None,
        "overshoot": trans_out,
        "path_eff": path_eff,
        "id_bits": idx,
        "throughput": tput,
    }


def _agg(values: List[float], f) -> Optional[float]:
    vals = [v for v in values if v is not None]
    return _round(f(vals)) if vals else None


def summarize(rows: List[dict], cfg: dict) -> dict:
    n = len(rows)
    hits = [r for r in rows if r["hit"]]
    out = {
        "n_trials": n,
        "success_rate": _round(len(hits) / n) if n else None,
        "median_acquire_ms": _agg([r["acquire_ms"] for r in hits], np.median),
        "median_settle_px": _agg([r["settle_px"] for r in hits], np.median),
        "median_settle_deg": _agg([r["settle_deg"] for r in hits], np.median),
        "median_settle_cm": _round(px_to_cm(_agg([r["settle_px"] for r in hits], np.median), cfg))
        if hits else None,
        "mean_overshoot": _agg([r["overshoot"] for r in rows], np.mean),
        "median_path_eff": _agg([r["path_eff"] for r in rows], np.median),
        "median_throughput_bps": _agg([r["throughput"] for r in hits], np.median),
    }
    return out


def by_gain(rows: List[dict], cfg: dict) -> Dict[str, dict]:
    """Per gain-multiplier breakdown — the gain-robustness signal."""
    out: Dict[str, dict] = {}
    mults = sorted({r["gain_mult"] for r in rows})
    for m in mults:
        sub = [r for r in rows if r["gain_mult"] == m]
        out[f"gain_x{m:g}"] = summarize(sub, cfg)
    return out


def latest_session(results_dir: str) -> Optional[str]:
    cands = [p for p in glob.glob(os.path.join(results_dir, "hpsession_*")) if os.path.isdir(p)]
    return max(cands, key=os.path.getmtime) if cands else None


def load_trials(path: str) -> List[dict]:
    rows = []
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def analyze_session(session: str, cfg: dict) -> dict:
    cfg = apply_session_geometry(cfg, session)
    W = float(cfg["screen"]["width_px"])
    H = float(cfg["screen"]["height_px"])
    trials = load_trials(os.path.join(session, "trials.jsonl"))
    rows = [m for m in (trial_metrics(t, cfg, W, H) for t in trials) if m is not None]
    metrics = {
        "overall": summarize(rows, cfg),
        "by_gain": by_gain(rows, cfg),
        "meta": {
            "session": os.path.basename(session),
            "n_trials_raw": len(trials),
            "viewing_distance_mm": cfg["viewing_distance_mm"],
            "dwell_ms": cfg["dwell"]["dwell_ms"],
            "generated": _dt.datetime.now().isoformat(timespec="seconds"),
        },
    }
    return metrics


def _print(metrics: dict) -> None:
    o = metrics["overall"]
    print(f"\nCLOSED-LOOP HEAD-POINTING  (session: {metrics['meta']['session']})")
    print(f"  trials={o['n_trials']}  success={o['success_rate']}  "
          f"acquire_med={o['median_acquire_ms']} ms  settle_med={o['median_settle_deg']}°"
          f" ({o['median_settle_cm']} cm)  overshoot={o['mean_overshoot']}  "
          f"path_eff={o['median_path_eff']}  throughput={o['median_throughput_bps']} bits/s")
    print("  gain robustness:")
    for k, v in metrics["by_gain"].items():
        print(f"    {k:<10} success={v['success_rate']}  acquire={v['median_acquire_ms']} ms  "
              f"settle={v['median_settle_deg']}°")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--session", default=None, help="session dir (default: latest results/hpsession_*)")
    ap.add_argument("--out", default=None, help="metrics output path (default: metrics.json)")
    args = ap.parse_args()

    cfg = load_yaml(os.path.join(DIR, "config.yaml"))
    results_dir = os.path.join(DIR, "results")
    session = args.session or latest_session(results_dir)
    if session is None:
        raise SystemExit(f"no session under {results_dir} (run the webapp task or synth_headpoint.py)")
    session = os.path.abspath(session)

    metrics = analyze_session(session, cfg)
    out_path = args.out or os.path.join(DIR, "metrics.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2)
        fh.write("\n")
    _print(metrics)
    print(f"\nwrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
