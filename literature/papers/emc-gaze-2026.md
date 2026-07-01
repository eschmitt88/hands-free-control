---
kind: paper
title: "Deployment-Oriented Session-wise Meta-Calibration for Landmark-Based Webcam Gaze Tracking (EMC-Gaze)"
authors: ["Chenkai Zhang"]
institutions: []
year: 2026
venue: "arXiv preprint (2603.12388)"
peer_reviewed: false
url: https://arxiv.org/abs/2603.12388
code_url: null
citations: null
source: "raw/papers/emc-gaze-2026.md"
added: "2026-07-01"
relevance: 5
credibility: 3
status: skimmed
related_experiments: []
related_concepts: [webcam-gaze-estimation, gaze-calibration, per-session-recalibration, in-browser-inference, landmark-based-gaze, meta-learned-calibration]
tags: [gaze, webcam, calibration, meta-learning, equivariant, on-device]
---

# Deployment-Oriented Session-wise Meta-Calibration for Landmark-Based Webcam Gaze Tracking (EMC-Gaze)

## TL;DR
A landmark-only webcam gaze model that pairs an E(3)-equivariant landmark-graph
encoder with a closed-form ridge calibrator meta-trained so a short per-session
calibration fits well. Reaches 5.79 deg RMSE after 9-point calibration at 100 cm,
in a 4.76 MB ONNX model running ~13 ms/sample in-browser.

## Claims
- Landmark-only (no appearance/image features) gaze estimation is viable and
  deployment-friendly.
- Meta-training a closed-form ridge calibrator makes short per-session
  calibration effective ("calibration-friendly").
- Small enough (4.76 MB, ~13 ms) to run fully in-browser on device.
- Not claiming to beat heavier appearance-based systems on raw accuracy.

## Methods
- E(3)-equivariant landmark-graph encoder over facial landmarks.
- Closed-form ridge calibrator differentiated through episodic meta-training.
- Two-view canonicalization consistency loss to cut pose-related error.
- Binocular emphasis + auxiliary 3D gaze-direction supervision.

## Results
- 5.79 ± 1.81 deg RMSE, 9-point session calibration at 100 cm.
- Still-head: 2.92 ± 0.75 deg vs baseline 4.45 ± 0.30 deg.
- Cross-subject (3 holdouts): 5.66 ± 0.19 deg.
- MPIIFaceGaze: 8.82 ± 1.21 deg at 16-shot calibration.
- 944,423 params; 4.76 MB ONNX; 12.58/12.58/12.90 ms mean/median/p90 (Chromium 145).

## Critique / open questions
- Single-author arXiv preprint, not peer-reviewed; no code statement found.
- 5.79 deg RMSE under head motion is coarse for fine pointing — usable for
  region/dwell selection, likely too imprecise for small targets alone.
- Institution unstated; independent reproduction unverified.
- 9-point per-session calibration is a real UX cost for the target population.

## Trust signals
- **Credibility:** 3 — coherent, quantified, in-browser deployment story with
  concrete params/latency, but a single-author non-peer-reviewed preprint with
  no released code and no stated affiliation.

## Follow-up
- Watch for a code release; the meta-trained closed-form ridge calibrator is the
  reusable idea for a per-session-recalibration control channel.
- Compare its landmark-only approach against the MediaPipe-mesh + regression
  approach in webcam-iris-recalibration-2024.
- Candidate for an experiment: session-wise meta-calibration as the gaze channel
  in a hands-free control stack.
