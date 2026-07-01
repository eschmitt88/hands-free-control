---
kind: concept
name: "Gaze Calibration"
status: seedling
added: "2026-07-01"
sources: ["webgazer", "gazecapture-itracker-2016", "emc-gaze-2026", "webcam-iris-recalibration-2024", "pygaze"]
related_concepts: ["interaction-based-calibration", "per-session-recalibration", "meta-learned-calibration"]
tags: ["gaze", "calibration"]
---
# Gaze Calibration
## Definition
Fitting a per-user mapping from gaze features or angles to screen coordinates in order to remove systematic pointing error.
## Why it matters here
Calibration quality directly bounds how usable gaze pointing is; a lightweight, low-friction procedure is essential for a practical hands-free setup.
## Connections
- [[interaction-based-calibration]] — one way to calibrate without an explicit grid
- [[per-session-recalibration]] — addresses drift that degrades a one-time calibration
- [[meta-learned-calibration]] — learns a calibrator that generalizes from few points
