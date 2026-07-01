---
kind: paper
title: "Revolutionizing Gaze-Based Human-Computer Interaction Using Iris Tracking: A Webcam-Based Low-Cost Approach With Calibration, Regression and Real-Time Re-Calibration"
authors: []
institutions: []
year: 2024
venue: "IEEE Access, vol. 12"
peer_reviewed: true
url: https://ieeexplore.ieee.org/document/10752957/
code_url: null
citations: null
source: "raw/papers/webcam-iris-recalibration-2024.md"
added: "2026-07-01"
relevance: 5
credibility: 3
status: skimmed
related_concepts: [webcam-gaze-estimation, gaze-calibration, per-session-recalibration, iris-tracking, mediapipe-face-mesh, regression-gaze-mapping]
related_experiments: []
tags: [gaze, webcam, iris-tracking, calibration, recalibration, mediapipe, low-cost]
---

# Revolutionizing Gaze-Based HCI Using Iris Tracking (IEEE Access 2024)

## TL;DR
A low-cost (<$25 commodity webcam) gaze-based HCI system that extracts iris/face
features with MediaPipe face mesh, maps them to screen coordinates via a 5-point
user calibration plus regression, and uses z-index (depth) real-time
re-calibration to fight accuracy decay from head/posture drift.

## Claims
- Commodity webcam (<$25) can drive usable gaze-based interaction.
- 5-point calibration + regression suffices to map iris features to gaze point.
- Real-time re-calibration via z-index/depth tracking maintains accuracy across
  changes in body position and posture — directly addressing head-drift decay.

## Methods
- MediaPipe face mesh for real-time facial/iris feature extraction.
- 5-point user-specific calibration.
- Multiple regression techniques for feature -> screen-point mapping.
- Real-time re-calibration keyed on z-index (depth) tracking.
- Evaluated with multiple participants.

## Results
- ABSTRACT-ONLY ingest: specific accuracy numbers (degrees/pixels) were NOT
  retrieved. Full text is behind IEEE Xplore; a PDF is listed on ResearchGate
  (publication 385844890). Re-fetch to fill in the metrics table.

## Critique / open questions
- Could not verify quantitative accuracy or participant count from the fetched
  sources; claims of maintained accuracy under drift are unquantified here.
- Author/institution not confirmed (ADS bibcode 2024IEEEA..12p8256C, initial C).
- "z-index re-calibration" mechanism needs the full text to assess rigor.

## Trust signals
- **Credibility:** 3 — peer-reviewed IEEE Access journal article with a DOI
  (10.1109/ACCESS.2024.3498441), but ingested abstract-only, so results are
  unverified and authorship is unconfirmed in this note.

## Follow-up
- Retrieve full text (ResearchGate PDF or IEEE Xplore) to record accuracy,
  regression variants tested, and the exact z-index re-calibration procedure.
- The real-time re-calibration idea is the load-bearing contribution for a
  drift-robust gaze control channel — compare against EMC-Gaze's session-wise
  meta-calibration.
