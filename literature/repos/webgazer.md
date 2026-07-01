---
kind: repo
name: "WebGazer.js"
url: https://github.com/brownhci/WebGazer
commit: v3.5.3 (2026-02-24)
source: "raw/repos/webgazer.md"
added: "2026-07-01"
relevance: 5
status: scanned
related_experiments: []
related_concepts: [webcam-gaze-tracking, interaction-based-calibration, gaze-calibration, iris-landmark-tracking]
tags: [gaze, webcam, javascript, browser, cursor-control, hands-free]
---

# WebGazer.js

## Purpose

Pure-JavaScript library that turns a commodity webcam into a real-time
gaze-to-screen predictor entirely in the browser. Directly on-target for
hands-free desktop control: it maps eye features to on-screen coordinates with
no specialized hardware and no server round-trip (video never leaves the
client). This is arguably the most deployable baseline for a webcam gaze cursor.

## Shape

- Client-side JS; usable via `<script>` tag or `require('webgazer')` (NPM).
- Works across Chrome, Edge, Firefox, Opera, Safari.
- Swappable components: pluggable eye-detection front-ends and multiple gaze
  prediction/regression models behind a common API.
- Provides optional on-screen video feedback for the user.
- License: GPLv3 (LGPLv3 offered for companies valued under $1M).

## Useful bits

- **Interaction-based self-calibration:** trains a mapping from eye features to
  screen position by watching the user click and move the cursor — no explicit
  calibration grid required. This is the key idea to borrow for a low-friction
  hands-free setup.
- Real-time inference on ordinary hardware; a concrete reference implementation
  rather than a paper-only method.
- Modular regression backends make it a good scaffold to swap in a stronger
  gaze model (e.g. L2CS-Net / MediaPipe Iris landmarks) while keeping the
  calibration + cursor plumbing.

## Follow-up

- Note: official maintenance ended 2026-02-24; v3.5.3 works but is frozen and
  "no longer matches the original peer-reviewed publications from 2016-2018."
  Treat as a stable but unmaintained baseline.
- Measure real-world cursor accuracy/latency on a desktop webcam; compare click-
  calibration vs. an explicit 9-point calibration.
- Consider whether its regression layer can consume MediaPipe Iris landmarks for
  better robustness.
