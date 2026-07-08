---
kind: concept
name: "Gain Calibration"
status: seedling
added: "2026-07-08"
sources: ["camera-mouse", "eviacam"]
related_concepts: ["closed-loop-control", "head-pose-pointing", "gaze-head-pointing"]
tags: ["control", "calibration"]
---
# Gain Calibration
## Definition
Setting the scale factor (pixels of cursor displacement per unit of input motion, e.g. per radian of head rotation) that maps an input channel to cursor movement — the "size" of the control.
## Why it matters here
Under [[closed-loop-control]] this is the *only* calibration head pointing needs: a slider the user eyeballs, not a precise per-user fit. The user settled on a low gain (~1000 px/rad), consistent with using the head as a short-range fine-adjuster on top of coarse gaze rather than a full-screen pointer.
## Connections
- [[closed-loop-control]] — the reason a rough gain is enough
- [[head-pose-pointing]] — the channel being scaled
- [[gaze-head-pointing]] — low head gain suits head-as-fine-tuner in the fused controller
