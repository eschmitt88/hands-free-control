---
kind: paper
title: "Consumer-grade EEG devices: are they usable for control tasks?"
authors: ["Rytis Maskeliunas", "Robertas Damasevicius", "Ignas Martisius", "Mindaugas Vasiljevas"]
institutions: ["Kaunas University of Technology"]
year: 2016
venue: "PeerJ"
peer_reviewed: true
url: https://pmc.ncbi.nlm.nih.gov/articles/PMC4806709/
code_url: null
citations: null
source: "raw/papers/consumer-eeg-usability-2016.md"
added: "2026-07-01"
relevance: 3
credibility: 4
status: read
related_experiments: []
related_concepts: [consumer-grade-eeg, bci-illiteracy, non-invasive-bci, multimodal-input-fusion]
tags: [bci, eeg, consumer-hardware, emotiv, neurosky, control, cautionary]
---

# Consumer-grade EEG devices: are they usable for control tasks?

## TL;DR

Empirical PeerJ study (10 subjects) testing Emotiv EPOC and NeuroSky MindWave for
attention and blink-based control. Verdict: consumer EEG is at best "beginner
level" — Emotiv ~60% attention / >75% blink, NeuroSky near chance; up to ~50% of
users are effectively BCI-illiterate. Recommends multimodal fallback (gaze was
faster and more accurate). The core cautionary datapoint for parking EEG in a
hands-free-control project.

## Claims

- Consumer EEG signals are highly variable and non-normally distributed, making
  reliable control hard.
- Emotiv EPOC clearly outperforms NeuroSky MindWave.
- Up to ~50% of users may be BCI-illiterate with low-cost EEG.
- Devices are usable for "beginner level" research only; other command-recognition
  modalities are "much more viable"; recommends combining EEG with other inputs.

## Methods

- 10 subjects; two tasks: concentration/relaxation (attention) and blinking.
- Compared Emotiv EPOC vs NeuroSky MindWave; reported recognition accuracies.
- Small n, but a real controlled comparison.

## Results

- Emotiv EPOC: attention ~60.5%; blinking >75%.
- NeuroSky MindWave: attention ~22.2% (near/below chance); blinking <50%.
- Gaze-tracking baseline "faster and more accurate" than EEG.

## Critique / open questions

- n=10, single lab, 2016 hardware — generations of consumer EEG have shipped
  since (Muse, OpenBCI, newer dry-electrode headsets), so absolute numbers are
  dated. But the *direction* (low, variable, illiteracy-prone) is corroborated by
  the 2025 dry-electrode review's motion-artifact / subject-independence findings.
- Blink detection >75% is really an EOG artifact, not cortical control — worth
  separating "EEG control" from "EOG/artifact control" when reasoning about this.
- For our project: strong evidence that EEG-as-primary desktop control is a poor
  bet vs gaze/voice; supports parking EEG and preferring multimodal fusion.

## Trust signals

- **Credibility:** 4 — peer-reviewed (PeerJ), empirical, transparent metrics,
  independent lab, and its skepticism aligns with later literature. Docked one
  point for small n and dated hardware.

## Follow-up

- Contrast against a modern (2023+) consumer/dry-electrode control study if one
  turns up in digest.
- Feeds a possible "why not EEG" decision record for the project.
