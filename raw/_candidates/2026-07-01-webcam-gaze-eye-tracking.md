---
kind: candidates
topic: "webcam-based eye/gaze tracking for cursor control (WebGazer, appearance-based gaze, head-pose alternatives)"
discovered: 2026-07-01
source: discover
n_requested: 10
n_returned: 10
---

## 1. WebGazer.js: Scalable Webcam Eye Tracking Using User Interactions

- url: https://github.com/brownhci/WebGazer
- type: repo
- summary: Pure-JavaScript browser library that infers on-screen gaze from a commodity webcam in real time, self-calibrating by watching the user click and interact with the page, with all video processed client-side.
- reason: The de-facto reference implementation for webcam gaze-to-cursor control on the web, and its interaction-based self-calibration is the canonical trick for avoiding tedious calibration grids.

## 2. Eye Tracking for Everyone (GazeCapture / iTracker)

- url: https://arxiv.org/abs/1606.05814
- type: paper
- summary: Introduces the 2.5M-frame crowdsourced GazeCapture dataset and the iTracker CNN (left-eye, right-eye, face, and face-grid inputs), achieving 1.71 cm / 2.53 cm error on phones/tablets without calibration at 10-15 fps.
- reason: The seminal proof that appearance-based deep learning makes accurate gaze estimation feasible on ordinary consumer cameras with no IR hardware.

## 3. L2CS-Net: Fine-Grained Gaze Estimation in Unconstrained Environments

- url: https://arxiv.org/abs/2203.03339
- type: paper
- summary: A two-branch multi-loss CNN that regresses each gaze angle separately, reaching 3.92 deg on MPIIGaze and 10.41 deg on Gaze360 with a released real-time PyTorch implementation.
- reason: A strong, still-cited off-the-shelf appearance-based model with pretrained weights that runs live on a single RGB webcam, a practical backbone for a gaze-control pipeline.

## 4. ETH-XGaze: Large-Scale Dataset for Gaze Estimation under Extreme Head Pose

- url: https://arxiv.org/abs/2007.15837
- type: paper
- summary: Over one million high-resolution images from 110 subjects captured with 18 SLR cameras spanning extreme head poses and gaze angles, plus a standardized benchmark and baseline code.
- reason: The training set and evaluation protocol most webcam-gaze models rely on for robustness to the off-axis head poses typical of a monitor-mounted camera.

## 5. MediaPipe Iris: Real-Time Iris Tracking and Depth Estimation

- url: https://research.google/blog/mediapipe-iris-real-time-iris-tracking-depth-estimation/
- type: post
- summary: Google's single-RGB-camera pipeline extends Face Mesh to 478 landmarks including 10 iris points, tracking pupil/iris/eyelid in real time on phones, desktops, and browsers with sub-10% metric-distance error.
- reason: A production-grade, free building block for extracting the eye/iris features and head geometry that a custom webcam gaze-cursor system needs, deployable in the browser.

## 6. Enable Viacam (eViacam)

- url: https://eviacam.crea-si.com/index.php
- type: docs
- summary: Free open-source webcam mouse-replacement that moves the pointer by tracking head motion, with adjustable speed/acceleration/smoothing and dwell-time clicking, no extra hardware required.
- reason: The leading example of head-pose control as the more reliable commodity-webcam alternative to gaze, with a mature dwell-click UX directly applicable to hands-free control.

## 7. Camera Mouse

- url: http://www.cameramouse.org/
- type: docs
- summary: Boston College's free Windows program (3M+ downloads) that lets users with severe motor disabilities drive the mouse pointer via head movement tracked by any webcam, with dwell-based clicking.
- reason: The seminal, widely-deployed accessibility tool establishing webcam head-tracking + dwell selection as a viable hands-free interface for people who cannot use a mouse.

## 8. EMC-Gaze: Deployment-Oriented Session-wise Meta-Calibration for Landmark-Based Webcam Gaze Tracking

- url: https://arxiv.org/abs/2603.12388
- type: paper
- summary: A landmark-only, E(3)-equivariant encoder with meta-trained ridge calibration reaching 5.79 deg RMSE after a 9-point per-session calibration, exported as a 4.76 MB model running ~12.6 ms/sample in-browser.
- reason: Recent (2026) work targeting exactly the practical webcam-control problem, quick per-session calibration and lightweight browser deployment on landmarks alone.

## 9. Revolutionizing Gaze-Based HCI Using Iris Tracking: A Webcam-Based Low-Cost Approach with Calibration and Real-Time Re-Calibration

- url: https://ui.adsabs.harvard.edu/abs/2024IEEEA..12p8256C/abstract
- type: paper
- summary: An IEEE Access 2024 system combining webcam iris tracking with regression-based calibration and real-time re-calibration to sustain gaze-cursor accuracy as head position drifts.
- reason: A recent HCI-focused pipeline addressing the core commodity-webcam failure mode, calibration decay from head movement, which is central to usable gaze control.

## 10. PyGaze: Open-Source Toolbox for Eye-Tracking Experiments

- url: https://github.com/esdalmaijer/PyGaze
- type: repo
- summary: Cross-platform Python library for programming eye-tracking experiments with online event detection and a unified API across EyeLink, SMI, Tobii, and GazePoint/OpenGaze devices.
- reason: A useful integration/experiment-harness layer and a baseline reference against dedicated IR trackers when validating webcam-gaze accuracy for control tasks.
