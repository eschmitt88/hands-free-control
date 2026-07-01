---
kind: paper
title: A High-Speed SSVEP-Based BCI Using Dry EEG Electrodes
authors: [Xiao Xing, Yijun Wang, Weihua Pei, Xuhong Guo, Zhiduo Liu, Fei Wang, Gege Ming, Hongze Zhao, Qiang Gui, Hongda Chen]
institutions: [Institute of Semiconductors CAS, University of Chinese Academy of Sciences, CAS Center for Excellence in Brain Science and Intelligence Technology]
year: 2018
venue: Scientific Reports
peer_reviewed: true
url: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6168577/
code_url:
citations:
source: raw/papers/high-speed-dry-ssvep.md
added: 2026-07-01
relevance: 3
credibility: 5
status: ingested
related_experiments: []
related_concepts: [ssvep, dry-electrode-eeg, information-transfer-rate, visual-evoked-potential, task-related-component-analysis]
tags: [ssvep, dry-electrode, bci, eeg, itr]
---

## TL;DR
Dry claw-electrode SSVEP BCI (8 occipital channels, 12 targets, TRCA) hits
93.2% accuracy / 92.35 bits/min ITR over 11 subjects with 1 s epochs, ~102
bits/min best offline. Approaches but stays below wet-electrode performance
(97.4% / 101 bits/min). A credible, lab-condition upper bound for dry SSVEP.

## Claims
- Dry electrodes can support high-speed SSVEP BCI close to wet-electrode levels.
- TRCA + filter-bank analysis substantially beats calibration-free CCA.
- Dry-electrode ITR ~90-102 bits/min is achievable with short epochs.

## Methods
Claw-like flexible dry electrodes (TPU + silver ink), 8 occipital/parietal
channels. 12-class 3x4 SSVEP matrix, 9.25-14.75 Hz. Filter-bank analysis (5
sub-bands) + task-related component analysis. ~4 min per-user calibration.
11 healthy subjects.

## Results
- Accuracy: dry 93.2 +/- 5.74% vs wet 97.35 +/- 4.33% (1 s epochs).
- ITR: dry 92.35 +/- 12.08 vs wet 101.28 +/- 9.46 bits/min.
- Best offline ITR: 102.37 +/- 26.92 bits/min (dry, 500 ms).
- SNR: dry 12.83 dB vs wet 14.1 dB. Impedance dry ~39 kOhm vs wet ~8 kOhm.

## Critique / open questions
- Constant-flicker SSVEP is fatiguing and visually intrusive; not truly
  "hands-free ambient" so much as gaze-dependent selection.
- Requires calibration and controlled 60 Hz display; ecological validity limited.
- Dry electrodes still significantly noisier (0-5 Hz, 50 Hz) and worse SNR.
- IMPORTANT: the source candidate brief cited 325/199 bits/min figures that are
  NOT in this paper (those are Chen et al. PNAS 2015, wet electrodes). Real
  numbers here are ~90-102 bits/min. Treat the higher figures as belonging to a
  different, wet-electrode study.
- Open: how much does the dry-electrode advantage erode outside the lab
  (motion, sweat, hair, ambient light)?

## Trust signals
Peer-reviewed Scientific Reports; well-established SSVEP lab (Yijun Wang / CAS);
concrete dry-vs-wet controls; 11 subjects; standard TRCA methodology.

## Follow-up
- Cross-check the 319/199 bits/min claim against Chen et al. PNAS 2015.
- Assess whether SSVEP flicker is acceptable for a hands-free control use case
  vs. less intrusive paradigms (P300, motor imagery).
