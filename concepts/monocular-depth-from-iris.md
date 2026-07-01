---
kind: concept
name: "Monocular Depth from Iris"
status: seedling
added: "2026-07-01"
sources: ["mediapipe-iris"]
related_concepts: ["iris-landmark-tracking"]
tags: ["gaze", "vision"]
---
# Monocular Depth from Iris
## Definition
Estimating camera-to-subject distance from a single RGB frame by exploiting the near-constant iris diameter of about 11.7 mm.
## Why it matters here
A distance estimate lets webcam gaze scale screen mapping correctly as the user leans in or back, stabilizing the pointing channel without extra sensors.
## Connections
- [[iris-landmark-tracking]] — supplies the iris measurement this depth cue relies on
