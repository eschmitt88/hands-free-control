#!/usr/bin/env python3
"""Idempotently vendor the MediaPipe Tasks-Vision runtime + FaceLandmarker model.

Downloads into ``static/vendor/`` so the collector can run offline after a first
fetch. Skips any file already present. Uses only stdlib (urllib). If the network
is blocked, the frontend falls back to the jsDelivr CDN at runtime, so a failure
here is non-fatal for development.

Run once:  python fetch_assets.py
Force:     python fetch_assets.py --force
"""

from __future__ import annotations

import argparse
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
VENDOR = os.path.join(HERE, "static", "vendor")

TASKS_VISION_VERSION = "0.10.20"
CDN = f"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@{TASKS_VISION_VERSION}"
WASM = f"{CDN}/wasm"
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
    "face_landmarker/float16/1/face_landmarker.task"
)

# (url, local relative path under VENDOR)
ASSETS = [
    # ES-module entry used by app.js (import from /static/vendor/tasks-vision/…).
    (f"{CDN}/vision_bundle.mjs", "tasks-vision/vision_bundle.mjs"),
    # WASM loader glue + binaries (both SIMD/threaded variants MediaPipe probes).
    (f"{WASM}/vision_wasm_internal.js", "tasks-vision/wasm/vision_wasm_internal.js"),
    (f"{WASM}/vision_wasm_internal.wasm", "tasks-vision/wasm/vision_wasm_internal.wasm"),
    (f"{WASM}/vision_wasm_nosimd_internal.js", "tasks-vision/wasm/vision_wasm_nosimd_internal.js"),
    (f"{WASM}/vision_wasm_nosimd_internal.wasm", "tasks-vision/wasm/vision_wasm_nosimd_internal.wasm"),
    # The FaceLandmarker model bundle.
    (MODEL_URL, "models/face_landmarker.task"),
]


def _download(url: str, dest: str, force: bool) -> str:
    if os.path.isfile(dest) and not force:
        return "skip"
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "hfc-webapp/0.1"})
    tmp = dest + ".part"
    with urllib.request.urlopen(req, timeout=60) as resp, open(tmp, "wb") as fh:
        fh.write(resp.read())
    os.replace(tmp, dest)
    return "ok"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--force", action="store_true", help="re-download even if present")
    args = ap.parse_args()

    failures = 0
    for url, rel in ASSETS:
        dest = os.path.join(VENDOR, rel)
        try:
            status = _download(url, dest, args.force)
            print(f"[{status:4}] {rel}")
        except Exception as exc:  # noqa: BLE001 — best-effort vendoring
            failures += 1
            print(f"[FAIL] {rel}: {exc}", file=sys.stderr)

    if failures:
        print(
            f"\n{failures} asset(s) failed; the app will use the jsDelivr CDN at "
            "runtime instead.",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
