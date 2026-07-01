---
kind: concept
name: "Iris Landmark Tracking"
status: seedling
added: "2026-07-01"
sources: ["mediapipe-iris", "webgazer", "webcam-iris-recalibration-2024"]
related_concepts: ["mediapipe-face-mesh", "monocular-depth-from-iris", "landmark-based-gaze"]
tags: ["gaze", "vision"]
---
# Iris Landmark Tracking
## Definition
Real-time detection of iris, pupil, and eyelid landmarks from RGB frames, serving as a primitive for downstream eye analysis.
## Why it matters here
Reliable iris landmarks are the raw signal that gaze mapping and distance estimation build on in a webcam-only hands-free pipeline.
## Connections
- [[mediapipe-face-mesh]] — provides the iris landmark model in practice
- [[monocular-depth-from-iris]] — uses the tracked iris to recover camera distance
- [[landmark-based-gaze]] — consumes these landmarks to predict gaze
