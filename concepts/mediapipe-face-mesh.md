---
kind: concept
name: "MediaPipe Face Mesh"
status: seedling
added: "2026-07-01"
sources: ["mediapipe-iris", "webcam-iris-recalibration-2024"]
related_concepts: ["iris-landmark-tracking", "landmark-based-gaze"]
tags: ["gaze", "vision", "tooling"]
---
# MediaPipe Face Mesh
## Definition
Google's 478-landmark face and iris model that yields real-time facial features usable for gaze mapping.
## Why it matters here
It is a ready-made, browser-capable landmark source, letting the project prototype gaze pointing without training a detector from scratch.
## Connections
- [[iris-landmark-tracking]] — Face Mesh includes the iris landmarks this depends on
- [[landmark-based-gaze]] — its landmark output feeds landmark-only gaze models
