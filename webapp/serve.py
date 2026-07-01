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
import os
import shutil
import subprocess
import sys
from typing import Dict, List, Optional

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
