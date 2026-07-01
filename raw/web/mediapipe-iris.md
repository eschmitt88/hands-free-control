source: https://research.google/blog/mediapipe-iris-real-time-iris-tracking-depth-estimation/
fetched: 2026-07-01
title: MediaPipe Iris — Real-time Iris Tracking & Depth Estimation

# MediaPipe Iris (captured blog post)

**Title:** MediaPipe Iris: Real-time Iris Tracking & Depth Estimation

**Authors/Team:** Andrey Vakunov and Dmitry Lagun, Research Engineers,
Google Research

**Publication Date:** August 6, 2020

## What MediaPipe Iris Does
A machine-learning system that tracks eye features using standard RGB cameras
without specialized hardware. It identifies iris, pupil, and eyelid landmarks in
real-time on mobile devices, desktops, and web browsers.

## Technical Approach
Two stages:
1. **Face Mesh Foundation:** Built on MediaPipe Face Mesh; the pipeline first
   generates 3D facial geometry to isolate the eye region from full-face images.
2. **Iris Tracking Model:** A multi-task neural network with a shared encoder and
   task-specific components separately estimates eye contours and iris position.
   Trained on "approximately 50k manually annotated images" spanning diverse
   lighting conditions and head poses.

## Depth Estimation
Calculates distance using a physiological constant: "the horizontal iris
diameter of the human eye remains roughly constant at 11.7±0.5 mm across a wide
population." Using camera focal length (from EXIF metadata or APIs) and geometry,
the algorithm determines subject-to-camera distance without depth sensors.

**Accuracy Claims:**
- Mean relative error: 4.3% (std dev 2.4%)
- With eyeglasses: 4.8% mean error (std dev 3.1%)
- Tested on 200+ participants

## Limitations and Usage Notes
Developers state: "iris tracking does not infer the location at which people are
looking, nor does it provide any form of identity recognition." Surveillance and
identification applications are out of scope. Testing excluded participants with
eye diseases (arcus senilis, pannus). Runs locally via WebAssembly, sending no
data to cloud servers.
