---
kind: paper
title: "EyeTAP: Introducing a multimodal gaze-based technique using voice inputs with a comparative analysis of selection techniques"
authors: ["Mohsen Parisay", "Charalambos Poullis", "Marta Kersten-Oertel"]
institutions: ["Concordia University"]
year: 2021
venue: "International Journal of Human-Computer Studies (IJHCS)"
peer_reviewed: true
url: https://www.sciencedirect.com/science/article/abs/pii/S107158192100094X
code_url: null
citations: null
source: "raw/papers/eyetap-2021.md"
added: "2026-07-01"
relevance: 5
credibility: 4
status: skimmed
related_experiments: []
related_concepts: [midas-touch-problem, gaze-point-speech-command, dwell-free-selection, assistive-hands-free-access]
tags: [gaze, voice, point-and-select, midas-touch, accessibility]
---

# EyeTAP

## TL;DR

Contact-free point-and-select: an eye tracker positions the pointer and a brief
acoustic signal (tongue click, mic tap, or verbal command) triggers selection,
sidestepping the Midas touch problem. Faster and lower cognitive load than
voice-only; competitive with dwell.

## Claims

- Acoustic/voice confirmation cleanly separates "looking" from "selecting,"
  addressing the Midas touch problem for gaze interaction.
- Lower cognitive workload and faster movement/task-completion time than voice
  recognition alone.
- Robust to ambient noise up to 70 dB.
- Minimal interface changes needed to integrate; useful for users with mobility
  limitations.

## Methods

- Gaze → pointer position (eye tracker); selection → acoustic pulse captured by a
  headset microphone (tongue click / mic tap / verbal command).
- Comparative user study, N = 33, against voice-recognition and dwell-time
  selection baselines. (Journal paywalled — captured via arXiv preprint
  2002.08455; access: abstract.)

## Results

- Faster movement and task-completion time and lower cognitive load than
  voice-only.
- Did NOT generally beat dwell-time on time, but had a lower error rate than
  dwell in one experiment.
- Noise tolerance up to 70 dB.

## Critique / open questions

- Acoustic-pulse selection avoids ASR latency but a tongue-click/mic-tap is a
  coarse binary trigger — how does it scale to richer command vocabularies
  (right-click, drag, scroll) vs a full speech-command system like VoxVisio?
- No clear win over dwell on time; the case rests on cognitive load and error
  rate. Need effect sizes from full text.
- Abstract-level ingest only.

## Trust signals

- **Credibility:** 4 — peer-reviewed IJHCS journal; controlled study with N = 33
  and explicit baselines; established lab (Concordia ICT). Docked one point:
  results captured at abstract level, effect sizes not verified.

## Follow-up

- Pull the full comparative results table (time, error, NASA-TLX) from the
  journal/arXiv PDF.
- Candidate baseline technique to replicate for a hands-free desktop
  point-and-select experiment.
