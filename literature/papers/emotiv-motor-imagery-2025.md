---
kind: paper
title: Motor imagery-based BCIs - multiclass motor imagery control for Emotiv EPOC X
authors: [Paulina Tarara, Iwona Przybyl, Julius Schoning, Artur Gunia]
institutions: [Academy of Fine Arts and Design in Katowice, Business Service Galop, Osnabrueck University of Applied Sciences, Jagiellonian University Krakow]
year: 2025
venue: Frontiers in Neuroinformatics
peer_reviewed: true
url: https://www.frontiersin.org/journals/neuroinformatics/articles/10.3389/fninf.2025.1625279/full
code_url:
citations:
source: raw/papers/emotiv-motor-imagery-2025.md
added: 2026-07-01
relevance: 3
credibility: 4
status: ingested
related_concepts: [motor-imagery-bci, consumer-bci-hardware, common-spatial-pattern, inter-subject-variability, dry-electrode-eeg]
related_experiments: []
tags: [motor-imagery, emotiv, consumer-eeg, bci, csp]
---

## TL;DR
Six-class motor-imagery control on the 14-channel consumer Emotiv EPOC X
(CSP + SVC, 7 subjects) barely beats chance: test accuracy 0.17-0.36 vs
0.167 chance, heavy overfitting (train 0.48-0.62). A useful, honest negative
result on the ceiling of consumer-grade MI BCI.

## Claims
- Consumer 14-ch EEG lacking central (C3/C4) electrodes cannot reliably support
  multiclass motor imagery.
- Body-awareness training modestly improves subjective MI proficiency but not
  classification.

## Methods
Emotiv EPOC X, 14 electrodes @128 Hz. 6 classes (rest + 5 imagined movements).
CSP feature extraction + RBF-kernel SVC. 7 subjects, 12 trials/class. No ICA
(kept out for ecological realism).

## Results
- Test accuracy 0.17-0.36; train 0.48-0.62 (overfit).
- Cohen's Kappa ~0 in most cases -> near-chance.

## Critique / open questions
- Tiny sample (7 subjects, 12 trials/class) makes results noisy and overfit-prone.
- Missing C3/C4 is a fundamental sensor-placement problem for MI, not just a
  tuning issue - result is somewhat pre-determined by hardware.
- Honest about failure modes; commercial viability of consumer-MI control looks
  poor from this evidence.
- Open: would a different paradigm (SSVEP/P300) on the same hardware do better?
  Would adding gel/central electrodes recover MI performance?

## Trust signals
Peer-reviewed (Frontiers in Neuroinformatics); transparent negative result;
standard CSP+SVC pipeline; explicit limitation accounting. Small-N caveat.

## Follow-up
- Contrast with dry-SSVEP (high-speed-dry-ssvep) as a better hands-free paradigm
  for consumer hardware.
- Note as evidence that motor imagery on consumer headsets is low-yield.
