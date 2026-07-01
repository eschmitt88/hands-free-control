---
kind: post
title: "MediaPipe Iris: Real-time Iris Tracking & Depth Estimation"
author: "Andrey Vakunov, Dmitry Lagun (Google Research)"
url: https://research.google/blog/mediapipe-iris-real-time-iris-tracking-depth-estimation/
source: "raw/web/mediapipe-iris.md"
added: "2026-07-01"
relevance: 5
related_experiments: []
related_concepts: [iris-landmark-tracking, webcam-gaze-tracking, monocular-depth-from-iris, appearance-based-gaze-estimation]
tags: [gaze, iris, mediapipe, landmarks, browser, real-time, google]
---

# MediaPipe Iris: Real-time Iris Tracking & Depth Estimation

## TL;DR

Google's MediaPipe Iris tracks iris, pupil, and eyelid landmarks in real time
from a single RGB camera (browser/desktop/mobile), built on top of MediaPipe
Face Mesh. It also estimates camera-to-subject depth from the near-constant
physical iris diameter (11.7 mm). A production-grade, on-device landmark
front-end for a hands-free gaze pipeline.

## Key points

- **Two-stage pipeline:** MediaPipe Face Mesh produces 3D facial geometry to
  crop the eye region; a multi-task net (shared encoder + task-specific heads)
  then estimates eye contour and iris landmarks.
- Trained on ~50k manually annotated images across diverse lighting and head
  poses.
- **Depth from iris:** uses the horizontal iris diameter (11.7 ± 0.5 mm, roughly
  constant across people) plus camera focal length (EXIF/API) and geometry to
  infer subject distance without a depth sensor. Mean relative error 4.3%
  (2.4% std); 4.8% with eyeglasses; tested on 200+ participants.
- Runs locally via WebAssembly in-browser — no data leaves the device, matching
  WebGazer's privacy posture.
- **Explicit scope limit:** iris tracking does NOT infer gaze point-of-regard or
  identity by itself; it is a landmark/geometry primitive, not a gaze estimator.
  A downstream mapping (calibration or a gaze model) is required to get a cursor.

## Follow-up

- Use MediaPipe Iris landmarks as robust, low-latency features feeding a gaze-
  to-screen regressor (e.g. replace/augment WebGazer's eye detector).
- Its depth estimate could correct for user distance in screen-coordinate
  mapping.
- Verify the current MediaPipe / MediaPipe Tasks (FaceLandmarker) API is the
  supported path in 2026 vs. the 2020 blog's legacy pipeline.
