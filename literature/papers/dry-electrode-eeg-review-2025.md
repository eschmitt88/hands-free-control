---
kind: paper
title: "Recent Advances in Portable Dry Electrode EEG: Architecture and Applications in Brain-Computer Interfaces"
authors: ["Meihong Zhang", "Bocheng Qian", "Jianming Gao", "Shaokai Zhao", "Yibo Cui", "Zhiguo Luo", "Kecheng Shi", "Erwei Yin"]
institutions: ["University of Electronic Science and Technology of China", "Academy of Military Sciences (Defense Innovation Institute)", "Tianjin University"]
year: 2025
venue: "Sensors (Basel) 25(16):5215"
peer_reviewed: true
url: https://www.mdpi.com/1424-8220/25/16/5215
code_url: null
citations: null
source: "raw/papers/dry-electrode-eeg-review-2025.md"
added: "2026-07-01"
relevance: 2
credibility: 4
status: read
related_concepts: [dry-electrode-eeg, electrode-contact-impedance, ssvep, motor-imagery-bci, information-transfer-rate, consumer-grade-eeg]
related_experiments: []
tags: [bci, eeg, dry-electrode, hardware, review, ssvep, motor-imagery]
---

# Recent Advances in Portable Dry Electrode EEG: Architecture and Applications in Brain-Computer Interfaces

## TL;DR

2025 Sensors review of gel-free (dry) EEG electrodes: a taxonomy (MEMS/microneedle,
capacitive non-contact, dry-contact) plus material innovations, and an
application survey across emotion, fatigue, motor imagery, and SSVEP. Useful as a
hardware-limits reference: dry electrodes trade prep-time for >100 kΩ impedance,
motion-artifact susceptibility, and a persistent 10–15% subject-independent
accuracy penalty. Low relevance to our control loop except as evidence that the
sensing front-end is still fragile.

## Claims

- Dry electrodes are a viable gel-free alternative but structurally rigid; three
  architecture families each trade off impedance, comfort, and stability.
- Across applications, accuracy spans widely and is dominated by subject-dependent
  results; robust cross-subject / online performance remains unsolved.
- Hardware and decoding algorithm must be co-optimized; needs a standardized
  evaluation framework.

## Methods

- Systematic literature review, Jan 2019 – Jul 2025, four databases (Google
  Scholar, SpringerLink, MDPI, ScienceDirect). No new experiments.

## Results (captured accuracy/ITR ranges)

- Emotion 58–99%; fatigue/drowsiness 71–99%; motor imagery 35–96.5% (reach-grasp
  56.4 ± 8%).
- **SSVEP 70–99.6% acc; ITR 39–346.8 bits/min** (24-ch Neuracle 90.18% @
  117 bits/min on 60-char speller; 10-ch Avertus H10C 87.5% @ 346.8 bits/min).
- Limits: dry impedance >100 kΩ vs <10 kΩ wet; <4 Hz attenuation; 30–40% more
  50/60 Hz line noise under motion; subject-independent 10–15% below
  subject-dependent; most results still offline.

## Critique / open questions

- Review, not primary evidence — accuracy ranges are cherry-pickable best cases
  from heterogeneous devices/tasks; the wide floors (MI down to 35%) matter more
  for a reliability argument than the 99% ceilings.
- No battery/power quantification despite "portable" framing — a real gap for
  anyone estimating a wearable control budget.
- SSVEP ITR ceiling (hundreds of bits/min) here looks better than the embedded
  single-headset numbers (see embedded-ssvep-decoding-2026, ~28 bits/min); the
  high figures come from many-channel, tightly-controlled speller setups, not
  out-of-lab dry rigs. Read the range, not the peak.

## Trust signals

- **Credibility:** 4 — peer-reviewed Sensors review, reputable institutions,
  broad and current sourcing, honest limitations section. Docked one for being
  secondary and for the power/battery omission. (Note: MDPI page 403'd; content
  recovered via PMC mirror PMC12389868.)

## Follow-up

- Mine for a specific dry-electrode headset spec if we ever prototype an EEG arm.
- Pair with consumer-eeg-usability-2016 for the "sensing front-end is the
  bottleneck" argument.
