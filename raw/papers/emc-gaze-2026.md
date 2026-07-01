source: https://arxiv.org/abs/2603.12388
fetched: 2026-07-01
title: "Deployment-Oriented Session-wise Meta-Calibration for Landmark-Based Webcam Gaze Tracking (EMC-Gaze)"

# EMC-Gaze — captured summary

## Bibliographic
- Title: Deployment-Oriented Session-wise Meta-Calibration for Landmark-Based
  Webcam Gaze Tracking
- Author: Chenkai Zhang (as listed on arXiv abstract page)
- Institution: not stated in the fetched excerpt
- Submitted: 2026-03-12 (arXiv 2603.12388)
- Venue: arXiv preprint (peer-review status unknown)

## Method
- E(3)-equivariant landmark-graph encoder (landmark-only; no appearance/image
  features required at inference).
- Closed-form ridge calibrator differentiated through episodic meta-training
  ("meta-trained ridge calibration") — designed so a short per-session
  calibration fits well.
- Two-view canonicalization consistency loss to reduce pose-related error.
- Binocular emphasis + auxiliary 3D gaze-direction supervision.

## Reported results
- 5.79 ± 1.81 deg RMSE after 9-point session calibration at 100 cm.
- Still-head: 2.92 ± 0.75 deg vs 4.45 ± 0.30 deg for the comparison baseline.
- Cross-subject (3 holdouts): 5.66 ± 0.19 deg.
- MPIIFaceGaze: 8.82 ± 1.21 deg at 16-shot calibration.

## Technical specs
- 944,423 parameters; 4.76 MB in ONNX format.
- Runtime 12.58 / 12.58 / 12.90 ms per sample (mean/median/p90) in Chromium 145
  — i.e. runs in-browser on device.

## Positioning / claims
Authors frame the method as "calibration-friendly" for practical deployment
rather than claiming to beat heavier appearance-based systems on raw accuracy.

## Code
No code-availability statement found in the fetched excerpt.
