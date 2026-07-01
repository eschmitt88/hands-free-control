---
kind: concept
name: "Per-session Recalibration"
status: seedling
added: "2026-07-01"
sources: ["emc-gaze-2026", "webcam-iris-recalibration-2024"]
related_concepts: ["gaze-calibration", "meta-learned-calibration"]
tags: ["gaze", "calibration"]
---
# Per-session Recalibration
## Definition
Re-fitting the gaze calibration during or at the start of each session to counter head and posture drift and accuracy decay.
## Why it matters here
Webcam gaze degrades as the user shifts position; cheap recalibration keeps the coarse pointing channel trustworthy over a long work session.
## Connections
- [[gaze-calibration]] — the base procedure being periodically refreshed
- [[meta-learned-calibration]] — a way to make each recalibration fast and few-shot
