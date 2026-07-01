---
kind: concept
name: "Webcam Gaze Tracking"
status: seedling
added: "2026-07-01"
sources: ["webgazer", "gazecapture-itracker-2016", "l2cs-net-2022", "eth-xgaze-2020", "mediapipe-iris", "emc-gaze-2026", "webcam-iris-recalibration-2024"]
related_concepts: ["appearance-based-gaze-estimation", "landmark-based-gaze", "gaze-calibration"]
tags: ["gaze", "vision"]
---
# Webcam Gaze Tracking
## Definition
Estimating on-screen gaze from an ordinary RGB webcam, using no dedicated eye-tracker hardware.
## Why it matters here
It is the cheapest path to a coarse pointing channel on any desktop, letting gaze roughly place the cursor while voice handles precise selection and commands.
## Connections
- [[appearance-based-gaze-estimation]] — one core method family for turning webcam frames into gaze
- [[landmark-based-gaze]] — the lighter alternative that runs from facial landmarks alone
- [[gaze-calibration]] — required to map raw webcam gaze onto a specific user's screen
