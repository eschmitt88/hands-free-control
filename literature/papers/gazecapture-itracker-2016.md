---
kind: paper
title: "Eye Tracking for Everyone (GazeCapture / iTracker)"
authors: [Kyle Krafka, Aditya Khosla, Petr Kellnhofer, Harini Kannan, Suchendra Bhandarkar, Wojciech Matusik, Antonio Torralba]
institutions: ["MIT CSAIL", "University of Georgia"]
year: 2016
venue: "CVPR"
peer_reviewed: true
url: https://arxiv.org/abs/1606.05814
code_url: http://gazecapture.csail.mit.edu
citations: null
source: "raw/papers/gazecapture-itracker-2016.md"
added: "2026-07-01"
relevance: 4
credibility: 5
status: skimmed
related_experiments: []
related_concepts: [appearance-based-gaze-estimation, webcam-gaze-tracking, gaze-calibration, gaze-angular-accuracy]
tags: [gaze, cnn, dataset, mobile, calibration]
---

# Eye Tracking for Everyone (GazeCapture / iTracker)

## TL;DR

Landmark CNN paper showing appearance-based gaze estimation can run on
commodity phones/tablets without extra sensors. Contributes the large
crowdsourced GazeCapture dataset (~1,450 subjects, ~2.5M frames) and the
iTracker CNN, hitting ~1.7cm uncalibrated / ~1.3cm calibrated error on phones.

## Claims

- Eye tracking is feasible on unmodified consumer devices using only the
  front camera.
- A single end-to-end CNN (iTracker) beats prior appearance-based methods.
- A large, diverse dataset is the main lever; scaling data drives accuracy.

## Methods

- **iTracker:** CNN taking four inputs — left eye crop, right eye crop, full
  face crop, and a binary face-grid encoding face position within the frame.
- Runs 10-15 fps on mobile.
- **GazeCapture:** crowdsourced via mobile app; >1,450 subjects, ~2.5M frames,
  across varied phones/tablets, poses, and lighting.

## Results

- Without calibration: 1.71 cm (phones), 2.53 cm (tablets).
- With calibration: 1.34 cm (phones), 2.12 cm (tablets).
- Error reported in cm on-screen (device/mobile setting), not degrees.

## Critique / open questions

- Mobile front-camera geometry differs from a desktop webcam at ~50-70 cm; cm
  error doesn't translate directly to desktop cursor accuracy.
- 2016-era architecture; modern backbones (see L2CS-Net, ETH-XGaze) supersede
  raw accuracy, but iTracker's multi-crop + face-grid design is still a strong
  template.
- Face-grid assumes reliable face detection/framing.

## Trust signals

- **Credibility:** 5 — CVPR 2016, MIT CSAIL / Torralba group, dataset + code +
  models publicly released, heavily cited foundational work.

## Follow-up

- Reuse the multi-crop + face-grid input design as a baseline for a desktop
  webcam gaze model.
- Evaluate whether GazeCapture generalizes to desktop viewing distance or needs
  desktop-specific data.
