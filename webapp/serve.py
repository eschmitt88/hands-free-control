#!/usr/bin/env python3
"""FastAPI service for the in-browser webcam gaze/head-pose calibration collector.

The browser (see ``static/``) runs MediaPipe FaceLandmarker entirely client-side,
collects one aggregated sample per calibration/validation/test dot, and POSTs the
samples here. This service writes them into the experiment's ``results/`` dir in
the EXACT jsonl format ``analyze.py`` already consumes, then scores the session by
running ``analyze.py`` in a SUBPROCESS (default mode: calibration + validation ->
metrics.json). Test samples are stored on disk for a later manual final pass but
NEVER read server-side (HCE rule, ~/.claude/rules/evaluation.md).

Serves over HTTPS on :8104 (getUserMedia requires a secure context). Mirrors the
user's other aiserver FastAPI viewers.
"""

from __future__ import annotations

import datetime as _dt
import json
import mimetypes
import os
import shutil
import subprocess
import sys
from typing import Dict, List, Optional

# Ensure ES modules (.mjs) are served with a JS MIME so the browser will import them.
mimetypes.add_type("text/javascript", ".mjs")

import yaml
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# --- Paths (resolved relative to this file so it works under systemd) --------
HERE = os.path.dirname(os.path.abspath(__file__))          # ROOT/webapp
ROOT = os.path.dirname(HERE)                               # ROOT
EXP = os.path.join(ROOT, "experiments", "2026-07-01-webcam-gaze-accuracy")
RESULTS_DIR = os.path.join(EXP, "results")
STATIC_DIR = os.path.join(HERE, "static")
CERT_FILE = os.path.join(HERE, "certs", "gaze.pem")
KEY_FILE = os.path.join(HERE, "certs", "gaze-key.pem")

# Resolve `uv` by absolute path: systemd --user services get a minimal PATH that
# excludes ~/.local/bin, so a bare "uv" in subprocess fails (FileNotFoundError).
UV_BIN = shutil.which("uv") or next(
    (p for p in (
        os.path.expanduser("~/.local/bin/uv"),
        "/usr/local/bin/uv",
        "/usr/bin/uv",
    ) if os.path.exists(p)),
    "uv",
)

CONFIG_YAML = os.path.join(EXP, "config.yaml")
SPLITS_YAML = os.path.join(EXP, "splits.yaml")
ANALYZE_PY = os.path.join(EXP, "analyze.py")
METRICS_JSON = os.path.join(EXP, "metrics.json")

# --- Second experiment: closed-loop head-pointing (2026-07-08) ---------------
EXP2 = os.path.join(ROOT, "experiments", "2026-07-08-head-pointing-closed-loop")
RESULTS2_DIR = os.path.join(EXP2, "results")
CONFIG2_YAML = os.path.join(EXP2, "config.yaml")
ANALYZE2_PY = os.path.join(EXP2, "analyze_headpoint.py")
METRICS2_JSON = os.path.join(EXP2, "metrics.json")

# --- Third experiment: gaze + head fusion (2026-07-08) -----------------------
EXP3 = os.path.join(ROOT, "experiments", "2026-07-08-gaze-head-fusion")
RESULTS3_DIR = os.path.join(EXP3, "results")
CONFIG3_YAML = os.path.join(EXP3, "config.yaml")

_VALID_PHASES = ("calibration", "validation", "test")

app = FastAPI(title="hfc-webcam-gaze-collector")


# --- Helpers -----------------------------------------------------------------
def _load_yaml(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


# --- Request models ----------------------------------------------------------
class SessionMeta(BaseModel):
    screen_px: List[float]
    screen_mm: List[float]
    viewing_distance_mm: float
    camera: List[float]
    user_agent: str = ""


class Sample(BaseModel):
    phase: str
    target_norm: List[float]
    gaze_features: List[float]
    headpose_features: List[float]


class SessionBody(BaseModel):
    meta: SessionMeta
    samples: List[Sample]


class AnalyzeBody(BaseModel):
    session_id: str


# --- Head-pointing (closed-loop) request models ------------------------------
class HeadpointMeta(BaseModel):
    screen_px: List[float]
    screen_mm: List[float]
    viewing_distance_mm: float
    camera: List[float]
    chosen_gain_px_per_rad: float
    smoothing_alpha: float = 0.5
    invert_pitch: bool = False
    neutral: Dict[str, float] = {}
    tune: dict = {}
    user_agent: str = ""


class Trial(BaseModel):
    gain_mult: float
    gain_px_per_rad: float
    target_norm: List[float]
    target_radius_px: float
    prev_norm: Optional[List[float]] = None
    outcome: str
    t_appear_ms: float
    t_acquire_ms: Optional[float] = None
    samples: List[List[float]]


class HeadpointSessionBody(BaseModel):
    meta: HeadpointMeta
    trials: List[Trial]


class HeadpointAnalyzeBody(BaseModel):
    session_id: str


# --- Fusion request models ---------------------------------------------------
class FusionSessionBody(BaseModel):
    meta: dict
    samples: List[list]
    events: List[dict] = []


# --- Endpoints ---------------------------------------------------------------
@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True}


@app.get("/")
def index() -> FileResponse:
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/api/config")
def api_config() -> dict:
    """Splits (target positions), screen defaults, and capture params for the UI."""
    splits = _load_yaml(SPLITS_YAML)
    cfg = _load_yaml(CONFIG_YAML)
    screen = cfg.get("screen", {})
    cap = cfg.get("capture", {})
    return {
        "splits": {p: splits.get(p, []) for p in _VALID_PHASES},
        "screen_defaults": {
            "width_mm": screen.get("width_mm"),
            "height_mm": screen.get("height_mm"),
            "viewing_distance_mm": cfg.get("viewing_distance_mm"),
        },
        "frames_per_target": int(cap.get("frames_per_target", 30)),
        "warmup_frames": int(cap.get("warmup_frames", 10)),
        "target_radius_px": int(cap.get("target_radius_px", 20)),
    }


@app.post("/api/session")
def api_session(body: SessionBody) -> dict:
    """Persist a collected session into results/session_web_<ts>/ (jsonl per phase)."""
    if not body.samples:
        raise HTTPException(status_code=400, detail="no samples in session")

    # Validate phases up front.
    for smp in body.samples:
        if smp.phase not in _VALID_PHASES:
            raise HTTPException(status_code=400, detail=f"bad phase: {smp.phase!r}")

    ts = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    session_id = f"session_web_{ts}"
    session_dir = os.path.join(RESULTS_DIR, session_id)
    # Avoid clobbering an existing dir in the (unlikely) same-second case.
    suffix = 0
    while os.path.exists(session_dir):
        suffix += 1
        session_id = f"session_web_{ts}-{suffix}"
        session_dir = os.path.join(RESULTS_DIR, session_id)
    os.makedirs(session_dir, exist_ok=False)

    # Group samples by phase; always write all three files (possibly empty).
    grouped: Dict[str, List[dict]] = {p: [] for p in _VALID_PHASES}
    for smp in body.samples:
        grouped[smp.phase].append(
            {
                "phase": smp.phase,
                "target_norm": [float(smp.target_norm[0]), float(smp.target_norm[1])],
                "gaze_features": [float(v) for v in smp.gaze_features],
                "headpose_features": [float(v) for v in smp.headpose_features],
            }
        )

    counts: Dict[str, int] = {}
    for phase in _VALID_PHASES:
        rows = grouped[phase]
        counts[phase] = len(rows)
        path = os.path.join(session_dir, f"{phase}.jsonl")
        with open(path, "w", encoding="utf-8") as fh:
            for row in rows:
                fh.write(json.dumps(row) + "\n")

    meta_out = {
        "screen_px": [float(body.meta.screen_px[0]), float(body.meta.screen_px[1])],
        "screen_mm": [float(body.meta.screen_mm[0]), float(body.meta.screen_mm[1])],
        "viewing_distance_mm": float(body.meta.viewing_distance_mm),
        "camera": [float(body.meta.camera[0]), float(body.meta.camera[1])],
        "user_agent": body.meta.user_agent,
        "generated": _dt.datetime.now().isoformat(timespec="seconds"),
        "source": "webapp",
    }
    with open(os.path.join(session_dir, "meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta_out, fh, indent=2)
        fh.write("\n")

    return {"session_id": session_id, "counts": counts}


@app.post("/api/analyze")
def api_analyze(body: AnalyzeBody) -> JSONResponse:
    """Score a stored session via analyze.py (DEFAULT mode; no --final, no test read)."""
    session_id = body.session_id
    # Guard against path traversal and confirm the session exists.
    if not session_id or os.path.basename(session_id) != session_id:
        raise HTTPException(status_code=400, detail="invalid session_id")
    session_dir = os.path.join(RESULTS_DIR, session_id)
    if not os.path.isdir(session_dir):
        raise HTTPException(status_code=404, detail=f"session not found: {session_id}")

    # Subprocess keeps the validated analysis env (numpy/sklearn/pyyaml only)
    # isolated from the webapp env. DEFAULT mode only -> metrics.json.
    cmd = [
        UV_BIN, "run", "--project", EXP,
        "python", ANALYZE_PY,
        "--session", session_dir,
    ]
    try:
        proc = subprocess.run(
            cmd, cwd=EXP, capture_output=True, text=True, timeout=180
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="analyze.py timed out")
    if proc.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"analyze.py failed (rc={proc.returncode}): "
            f"{(proc.stderr or proc.stdout)[-800:]}",
        )

    if not os.path.isfile(METRICS_JSON):
        raise HTTPException(status_code=500, detail="metrics.json not produced")
    with open(METRICS_JSON, "r", encoding="utf-8") as fh:
        metrics = json.load(fh)
    return JSONResponse(metrics)


# --- Head-pointing (closed-loop) endpoints -----------------------------------
@app.get("/headpoint")
def headpoint_index() -> FileResponse:
    return FileResponse(os.path.join(STATIC_DIR, "headpoint.html"))


@app.get("/api/headpoint_config")
def api_headpoint_config() -> dict:
    """Task params (targets, dwell, control, gain sweep) + screen defaults for the UI."""
    cfg = _load_yaml(CONFIG2_YAML)
    screen = cfg.get("screen", {})
    return {
        "targets": cfg.get("task", {}).get("targets", []),
        "timeout_ms": cfg.get("task", {}).get("timeout_ms", 8000),
        "dwell_ms": cfg.get("dwell", {}).get("dwell_ms", 600),
        "control": cfg.get("control", {}),
        "gain_multipliers": cfg.get("robustness", {}).get("gain_multipliers", [1.0]),
        "screen_defaults": {
            "width_mm": screen.get("width_mm"),
            "height_mm": screen.get("height_mm"),
            "viewing_distance_mm": cfg.get("viewing_distance_mm"),
        },
    }


@app.post("/api/headpoint_session")
def api_headpoint_session(body: HeadpointSessionBody) -> dict:
    """Persist a closed-loop head-pointing session -> results/hpsession_web_<ts>/trials.jsonl."""
    if not body.trials:
        raise HTTPException(status_code=400, detail="no trials in session")

    ts = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    session_id = f"hpsession_web_{ts}"
    session_dir = os.path.join(RESULTS2_DIR, session_id)
    suffix = 0
    while os.path.exists(session_dir):
        suffix += 1
        session_id = f"hpsession_web_{ts}-{suffix}"
        session_dir = os.path.join(RESULTS2_DIR, session_id)
    os.makedirs(session_dir, exist_ok=False)

    with open(os.path.join(session_dir, "trials.jsonl"), "w", encoding="utf-8") as fh:
        for tr in body.trials:
            fh.write(json.dumps(tr.model_dump()) + "\n")

    meta_out = {
        "screen_px": [float(body.meta.screen_px[0]), float(body.meta.screen_px[1])],
        "screen_mm": [float(body.meta.screen_mm[0]), float(body.meta.screen_mm[1])],
        "viewing_distance_mm": float(body.meta.viewing_distance_mm),
        "camera": [float(body.meta.camera[0]), float(body.meta.camera[1])],
        "chosen_gain_px_per_rad": float(body.meta.chosen_gain_px_per_rad),
        "smoothing_alpha": float(body.meta.smoothing_alpha),
        "invert_pitch": bool(body.meta.invert_pitch),
        "neutral": {k: float(v) for k, v in body.meta.neutral.items()},
        "tune": body.meta.tune,
        "user_agent": body.meta.user_agent,
        "generated": _dt.datetime.now().isoformat(timespec="seconds"),
        "source": "webapp",
    }
    with open(os.path.join(session_dir, "meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta_out, fh, indent=2)
        fh.write("\n")

    return {"session_id": session_id, "n_trials": len(body.trials)}


@app.post("/api/headpoint_analyze")
def api_headpoint_analyze(body: HeadpointAnalyzeBody) -> JSONResponse:
    """Score a stored head-pointing session via analyze_headpoint.py."""
    session_id = body.session_id
    if not session_id or os.path.basename(session_id) != session_id:
        raise HTTPException(status_code=400, detail="invalid session_id")
    session_dir = os.path.join(RESULTS2_DIR, session_id)
    if not os.path.isdir(session_dir):
        raise HTTPException(status_code=404, detail=f"session not found: {session_id}")

    cmd = [
        UV_BIN, "run", "--project", EXP2,
        "python", ANALYZE2_PY,
        "--session", session_dir,
    ]
    try:
        proc = subprocess.run(cmd, cwd=EXP2, capture_output=True, text=True, timeout=180)
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="analyze_headpoint.py timed out")
    if proc.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"analyze_headpoint.py failed (rc={proc.returncode}): "
            f"{(proc.stderr or proc.stdout)[-800:]}",
        )
    if not os.path.isfile(METRICS2_JSON):
        raise HTTPException(status_code=500, detail="metrics.json not produced")
    with open(METRICS2_JSON, "r", encoding="utf-8") as fh:
        metrics = json.load(fh)
    return JSONResponse(metrics)


# --- Fusion (gaze + head) endpoints ------------------------------------------
@app.get("/fusion")
def fusion_index() -> FileResponse:
    return FileResponse(os.path.join(STATIC_DIR, "fusion.html"))


@app.get("/api/fusion_config")
def api_fusion_config() -> dict:
    cfg = _load_yaml(CONFIG3_YAML)
    screen = cfg.get("screen", {})
    return {
        "gaze_calibration": cfg.get("gaze_calibration", {}),
        "fusion": cfg.get("fusion", {}),
        "control": cfg.get("control", {}),
        "practice_targets": cfg.get("practice_targets", []),
        "screen_defaults": {
            "width_mm": screen.get("width_mm"),
            "height_mm": screen.get("height_mm"),
            "viewing_distance_mm": cfg.get("viewing_distance_mm"),
        },
    }


@app.post("/api/fusion_session")
def api_fusion_session(body: FusionSessionBody) -> dict:
    """Persist a fused free-play session -> results/fusion_web_<ts>/ (trajectory + events + meta)."""
    ts = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    session_id = f"fusion_web_{ts}"
    session_dir = os.path.join(RESULTS3_DIR, session_id)
    suffix = 0
    while os.path.exists(session_dir):
        suffix += 1
        session_id = f"fusion_web_{ts}-{suffix}"
        session_dir = os.path.join(RESULTS3_DIR, session_id)
    os.makedirs(session_dir, exist_ok=False)

    with open(os.path.join(session_dir, "trajectory.json"), "w", encoding="utf-8") as fh:
        json.dump(body.samples, fh)
    with open(os.path.join(session_dir, "events.json"), "w", encoding="utf-8") as fh:
        json.dump(body.events, fh, indent=2)
    meta_out = dict(body.meta)
    meta_out["generated"] = _dt.datetime.now().isoformat(timespec="seconds")
    meta_out["source"] = "webapp"
    with open(os.path.join(session_dir, "meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta_out, fh, indent=2)
        fh.write("\n")
    return {"session_id": session_id, "n_samples": len(body.samples), "n_events": len(body.events)}


# Static mount (js/css/vendor). Kept after routes so explicit paths win.
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def main() -> int:
    import uvicorn

    if not (os.path.isfile(CERT_FILE) and os.path.isfile(KEY_FILE)):
        sys.stderr.write(
            "ERROR: TLS cert/key not found.\n"
            f"  expected cert: {CERT_FILE}\n"
            f"  expected key:  {KEY_FILE}\n"
            "getUserMedia requires HTTPS; generate a cert (e.g. mkcert) first.\n"
        )
        return 1

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8104,
        ssl_certfile=CERT_FILE,
        ssl_keyfile=KEY_FILE,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
