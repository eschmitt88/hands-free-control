---
kind: concept
name: "Feature Tracking"
status: seedling
added: "2026-07-01"
sources: ["camera-mouse"]
related_concepts: ["head-pose-pointing"]
tags: ["pointing", "vision"]
---
# Feature Tracking
## Definition
Locking onto a small chosen image region such as a nostril or eyebrow and tracking it frame-to-frame to derive motion.
## Why it matters here
It is the simple, low-compute mechanism behind head-pose pointing, useful as a fallback when full landmark or gaze models are unavailable.
## Connections
- [[head-pose-pointing]] — the pointing channel built on tracked feature motion
