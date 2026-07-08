---
kind: concept
name: "Closed-loop Control"
status: seedling
added: "2026-07-08"
sources: ["camera-mouse", "eviacam"]
related_concepts: ["head-pose-pointing", "gain-calibration", "gaze-head-pointing", "dwell-click"]
tags: ["control", "pointing"]
---
# Closed-loop Control
## Definition
A control scheme in which the user continuously sees the cursor and corrects in real time, so the input→cursor mapping need not be accurate — errors are absorbed by ongoing feedback rather than by calibration.
## Why it matters here
The head-pointing experiment (`experiments/2026-07-08-head-pointing-closed-loop`) acquired 100% of targets across a ±40% gain sweep, empirically confirming that a rough head-cursor calibration suffices when the loop is closed. This is the load-bearing reason head pointing needs only a coarse [[gain-calibration]], and why the fusion design can trust the head for precision.
## Connections
- [[head-pose-pointing]] — the channel this makes viable with only a rough calibration
- [[gain-calibration]] — the single parameter closed-loop control still requires
- [[gaze-head-pointing]] — the combined channel that layers coarse gaze + fine head
- [[dwell-click]] — the selection method whose false-activation the loop must still manage
