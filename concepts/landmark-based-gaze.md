---
kind: concept
name: "Landmark-based Gaze"
status: seedling
added: "2026-07-01"
sources: ["emc-gaze-2026", "webcam-iris-recalibration-2024"]
related_concepts: ["appearance-based-gaze-estimation", "iris-landmark-tracking", "mediapipe-face-mesh"]
tags: ["gaze", "vision"]
---
# Landmark-based Gaze
## Definition
Estimating gaze from facial landmark coordinates alone, without raw image appearance, which enables small and fast models.
## Why it matters here
Its low compute cost makes gaze pointing feasible in-browser and on modest hardware, keeping the hands-free stack responsive alongside voice.
## Connections
- [[appearance-based-gaze-estimation]] — the heavier alternative it trades accuracy against for speed
- [[iris-landmark-tracking]] — supplies the eye landmarks these models consume
- [[mediapipe-face-mesh]] — a common landmark source feeding this approach
