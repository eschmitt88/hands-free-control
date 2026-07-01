#!/usr/bin/env python3
"""Interactive full-screen calibration/validation/test collector (WORKSTATION ONLY).

Imports pygame + cv2 + gazelib.features (mediapipe) — needs a webcam and a
display. For each phase (calibration -> validation -> test) it walks the target
positions from splits.yaml, draws a dot, discards ``warmup_frames`` while the
eye settles, then captures ``frames_per_target`` frames, extracts + aggregates
MediaPipe features, and appends one sample line per target to
``results/session_<host>_<timestamp>/<phase>.jsonl``.

Controls:
  SPACE  advance to the next dot (capture the current one first)
  ESC    abort gracefully, flushing whatever has been collected.

The produced jsonl is consumed headlessly by analyze.py.
"""

from __future__ import annotations

import datetime as _dt
import json
import os
import socket
from typing import List, Optional

import cv2
import numpy as np
import pygame
import yaml

from gazelib.features import aggregate, extract_features

DIR = os.path.dirname(os.path.abspath(__file__))

_PHASES = ("calibration", "validation", "test")
_BG = (18, 18, 18)
_DOT = (235, 70, 70)
_DOT_INNER = (255, 255, 255)
_TEXT = (200, 200, 200)


def load_yaml(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _norm_to_px(target, screen_w: int, screen_h: int):
    return int(round(float(target[0]) * screen_w)), int(round(float(target[1]) * screen_h))


def _draw_target(surface, px_x: int, px_y: int, radius: int, label: str, font) -> None:
    surface.fill(_BG)
    txt = font.render(label, True, _TEXT)
    surface.blit(txt, (30, 30))
    pygame.draw.circle(surface, _DOT, (px_x, px_y), radius)
    pygame.draw.circle(surface, _DOT_INNER, (px_x, px_y), max(3, radius // 4))
    pygame.display.flip()


def _capture_target(cap, cfg: dict) -> Optional[dict]:
    """Discard warmups then aggregate features over frames_per_target frames."""
    cap_cfg = cfg["capture"]
    for _ in range(int(cap_cfg["warmup_frames"])):
        cap.read()
    frames: List[Optional[dict]] = []
    for _ in range(int(cap_cfg["frames_per_target"])):
        ok, frame = cap.read()
        if not ok:
            continue
        frames.append(extract_features(frame))
    return aggregate(frames)


def _flush(fh, sample: dict) -> None:
    fh.write(json.dumps(sample) + "\n")
    fh.flush()


def main() -> int:
    cfg = load_yaml(os.path.join(DIR, "config.yaml"))
    splits = load_yaml(os.path.join(DIR, "splits.yaml"))

    cap = cv2.VideoCapture(int(cfg["capture"]["camera_index"]))
    if not cap.isOpened():
        raise SystemExit(f"could not open camera index {cfg['capture']['camera_index']}")
    cam_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    cam_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    pygame.init()
    pygame.mouse.set_visible(False)
    info = pygame.display.Info()
    screen = pygame.display.set_mode((0, 0), pygame.FULLSCREEN)
    screen_w, screen_h = info.current_w, info.current_h
    font = pygame.font.SysFont(None, 36)

    ts = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    host = socket.gethostname()
    session_dir = os.path.join(DIR, "results", f"session_{host}_{ts}")
    os.makedirs(session_dir, exist_ok=True)

    meta = {
        "hostname": host,
        "timestamp": ts,
        "screen_px": [screen_w, screen_h],
        "camera_resolution": [cam_w, cam_h],
        "config": cfg,
        "generated": _dt.datetime.now().isoformat(timespec="seconds"),
    }
    with open(os.path.join(session_dir, "meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=2)
        fh.write("\n")

    radius = int(cfg["capture"]["target_radius_px"])
    aborted = False

    try:
        for phase in _PHASES:
            targets = splits[phase]
            path = os.path.join(session_dir, f"{phase}.jsonl")
            with open(path, "w", encoding="utf-8") as fh:
                for i, target in enumerate(targets, start=1):
                    if aborted:
                        break
                    px_x, px_y = _norm_to_px(target, screen_w, screen_h)
                    label = f"{phase} {i}/{len(targets)}  (SPACE=capture, ESC=abort)"
                    _draw_target(screen, px_x, px_y, radius, label, font)

                    # Wait for SPACE (capture) or ESC (abort).
                    waiting = True
                    while waiting:
                        for event in pygame.event.get():
                            if event.type == pygame.KEYDOWN:
                                if event.key == pygame.K_ESCAPE:
                                    aborted = True
                                    waiting = False
                                elif event.key == pygame.K_SPACE:
                                    waiting = False
                            elif event.type == pygame.QUIT:
                                aborted = True
                                waiting = False
                        pygame.time.wait(10)
                    if aborted:
                        break

                    agg = _capture_target(cap, cfg)
                    if agg is None:
                        # No face detected across the whole burst; record nothing but warn.
                        print(f"WARN: no face for {phase} target {i} ({target}); skipped")
                        continue
                    sample = {
                        "phase": phase,
                        "target_norm": [float(target[0]), float(target[1])],
                        "gaze_features": [float(v) for v in agg["gaze_features"]],
                        "headpose_features": [float(v) for v in agg["headpose_features"]],
                    }
                    _flush(fh, sample)
            if aborted:
                break
    finally:
        cap.release()
        pygame.quit()

    status = "aborted (flushed collected samples)" if aborted else "complete"
    print(f"session {status}: {session_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
