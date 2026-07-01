---
kind: post
title: P300 with the Muse
author: Alexandre Barachant
url: https://alexandre.barachant.org/blog/2017/02/05/P300-with-muse.html
source: raw/web/muse-p300.md
added: 2026-07-01
relevance: 3
related_experiments: []
related_concepts: [p300-speller, consumer-bci-hardware, dry-electrode-eeg, riemannian-geometry-bci, event-related-potential]
tags: [p300, muse, consumer-eeg, erp, riemannian]
---

## TL;DR
A credible DIY writeup showing a detectable P300 ERP on the 4-channel dry Muse
headband. Best classifier (Riemannian ERPCov + MDM) reached ~0.8 AUC in an
oddball task — usable but modest, with the author explicitly warning against
expecting "outstanding results."

## Key points
- Hardware: Muse 2016, 4 dry electrodes (TP9, TP10, AF7, AF8); placement not
  ideal for P300.
- Task: visual oddball, 960 non-target / 184 target, 6x 2-min runs.
- Pipeline: 1-30 Hz bandpass, -100..800 ms epochs, >100 uV artifact reject;
  compared LogReg, regularized LDA, and two Riemannian pipelines.
- Result: clear temporal-electrode P300; ERPCov+MDM ~0.8 AUC vs 0.5 chance.
- Author is a domain expert (pyriemann/MNE) — high credibility for a blog, but
  it is a single-subject informal demo, not a controlled study.

## Follow-up
- Riemannian ERPCov+MDM is a strong, low-data pipeline worth reusing for any
  consumer-headset ERP control loop.
- ~0.8 AUC single-trial is far from speller-grade; realistic hands-free P300
  control needs trial averaging, lowering effective bandwidth (ITR).
- Compare consumer P300 (this) vs consumer SSVEP vs consumer MI for the best
  hands-free paradigm/hardware trade-off.
