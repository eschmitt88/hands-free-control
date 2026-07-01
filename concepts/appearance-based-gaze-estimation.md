---
kind: concept
name: "Appearance-based Gaze Estimation"
status: seedling
added: "2026-07-01"
sources: ["gazecapture-itracker-2016", "l2cs-net-2022", "eth-xgaze-2020", "mediapipe-iris"]
related_concepts: ["webcam-gaze-tracking", "landmark-based-gaze", "gaze-angular-accuracy"]
tags: ["gaze", "vision"]
---
# Appearance-based Gaze Estimation
## Definition
Predicting gaze direction from the raw appearance of eye or face images via learned CNNs, rather than from a geometric model of the eye.
## Why it matters here
It is the accuracy workhorse for commodity-camera gaze, setting how precisely gaze alone can point before voice must take over for fine targeting.
## Connections
- [[webcam-gaze-tracking]] — the deployment setting where these models run on commodity cameras
- [[landmark-based-gaze]] — the lighter-weight counterpart that trades appearance for landmarks
- [[gaze-angular-accuracy]] — the metric these models are trained and compared on
