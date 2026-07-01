---
kind: paper
title: "Advancing Boggle - Taking BCI Web-Browsing Out of the Lab"
authors: []
institutions: []
year: 2025
venue: "CHItaly 2025 (16th Biannual Conf. of the Italian SIGCHI Chapter), ACM"
peer_reviewed: true
url: https://dl.acm.org/doi/10.1145/3750069.3757721
code_url: null
citations: null
source: "raw/papers/boggle-bci-browser-2025.md"
added: "2026-07-01"
relevance: 3
credibility: 3
status: skimmed
related_concepts: [ssvep, canonical-correlation-analysis, information-transfer-rate, dry-electrode-eeg, assistive-hands-free-control]
related_experiments: []
tags: [bci, ssvep, web-browser, electron, assistive-tech, motor-impairment, hands-free]
---

# Advancing Boggle - Taking BCI Web-Browsing Out of the Lab

## TL;DR

Boggle is an open-source Electron SSVEP BCI web browser for people with severe
motor impairment (ALS, stroke), aiming to take BCI browsing out of the lab.
Reported ~90.98% online accuracy and 29.58 bits/min ITR using a commercial
dry-electrode headset. The most on-topic prior art for hands-free desktop/web
control via BCI — and a concrete illustration of the low-bandwidth ceiling.

## Claims

- A cross-platform (Electron/Chromium) SSVEP browser can be run outside the lab,
  lowering complexity and cost barriers to BCI web browsing.
- Ships a customizable, empirically verified native-web SSVEP stimulus generator.
- Online asynchronous performance: 90.98% accuracy, 29.58 BPM ITR.
- Targets severe motor impairment as the beneficiary population.

## Methods

- Electron app (Node.js + Chromium); SSVEP input via commercial EEG headset
  (dry-electrode DSI-VR/VEP, Wearable Sensing).
- Online, asynchronous BCI evaluation; global mean accuracy + ITR reported.
- (Full protocol / sample size not captured — ACM page paywalled.)

## Results

- Global mean classification accuracy 90.98%; ITR 29.58 BPM.

## Critique / open questions

- Access was abstract-level only (ACM 403); the 90.98% / 29.58 BPM figures come
  from a search-surfaced abstract, not full text — sample size, target count, and
  session length unknown, so ITR is not precisely comparable yet.
- ~30 BPM matches the embedded-SSVEP anchor (embedded-ssvep-decoding-2026,
  ~28 bits/min): independent corroboration that out-of-lab SSVEP browsing lands
  near 30 bits/min, i.e. a handful of link/button selections per minute.
- Genuinely relevant as an existence proof of hands-free web control, but it is
  an *assistive* tool for people with no motor alternative — the bandwidth is
  acceptable there, not for an able-bodied desktop-control efficiency play.
- Open-source Electron architecture is the most reusable idea here even if the
  EEG modality itself stays parked (stimulus generator + async selection loop).

## Trust signals

- **Credibility:** 3 — peer-reviewed ACM conference paper (CHItaly) with an
  open-source artifact and a plausible, corroborated ITR; docked because only the
  abstract was accessible and authors/affiliations/protocol were not captured.

## Follow-up

- Try to locate the open-source Boggle repo (GitHub) for the SSVEP stimulus
  generator + async selection design, which are modality-agnostic.
- If de-parking BCI, obtain full text for the evaluation protocol behind 29.58 BPM.
