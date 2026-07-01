---
kind: paper
title: "ETH-XGaze: A Large Scale Dataset for Gaze Estimation under Extreme Head Pose and Gaze Variation"
authors: [Xucong Zhang, Seonwook Park, Thabo Beeler, Derek Bradley, Siyu Tang, Otmar Hilliges]
institutions: ["ETH Zurich", "DisneyResearch|Studios"]
year: 2020
venue: "ECCV"
peer_reviewed: true
url: https://arxiv.org/abs/2007.15837
code_url: https://ait.ethz.ch/projects/2020/ETH-XGaze
citations: null
source: "raw/papers/eth-xgaze-2020.md"
added: "2026-07-01"
relevance: 4
credibility: 5
status: skimmed
related_experiments: []
related_concepts: [appearance-based-gaze-estimation, gaze-angular-accuracy, gaze-estimation-benchmark, webcam-gaze-tracking]
tags: [gaze, dataset, benchmark, head-pose, cnn]
---

# ETH-XGaze: A Large Scale Dataset for Gaze Estimation under Extreme Head Pose and Gaze Variation

## TL;DR

A high-quality, large-scale gaze dataset (>1M high-res images, 110 subjects, 18
calibrated cameras) covering extreme head poses and illumination, plus a
standardized benchmark and baseline CNN. The de-facto training/eval standard for
robust appearance-based gaze estimation.

## Claims

- Existing datasets lack head-pose and gaze-angle diversity; ETH-XGaze fills the
  gap with controlled extreme-pose, multi-illumination capture.
- A standardized protocol + leaderboard improves comparability across methods.
- A ResNet baseline trained on it generalizes better under pose/illumination
  variation.

## Methods

- 18 synchronized DSLR cameras with calibrated ground-truth gaze; adjustable
  lighting; 110 subjects; >1M high-resolution images.
- Defines unified train/test splits and evaluation metrics (a held-out test set
  scored via submission).
- Provides a baseline gaze-regression CNN and normalized-image preprocessing.

## Results

- Establishes the benchmark rather than chasing a single number; the baseline
  CNN sets a reference angular error (single-digit degrees) under the protocol.
- Widely adopted as pretraining/eval for later gaze models.

## Critique / open questions

- Dataset is lab-captured with DSLRs — excellent ground truth, but a domain gap
  to noisy consumer webcams remains.
- Value here is the data + protocol; the baseline model is not SOTA on its own.
- Test set is held-out via submission — relevant to any HCE-style evaluation
  discipline (don't train on the eval split).

## Trust signals

- **Credibility:** 5 — ECCV 2020 Spotlight, ETH Zurich AIT + Disney Research
  authors, dataset + code + benchmark publicly released and heavily cited.

## Follow-up

- Use as a pretraining corpus and as a robustness benchmark for any gaze model
  targeting head-pose variation at a desk.
- Adopt its normalized-eye/face preprocessing convention for consistency with
  the literature.
