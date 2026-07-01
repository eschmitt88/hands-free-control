---
kind: paper
title: "GazePointAR: A Context-Aware Multimodal Voice Assistant for Pronoun Disambiguation in Wearable Augmented Reality"
authors: ["Jaewook Lee", "Jun Wang", "Elizabeth Brown", "Liam Chu", "Sebastian S. Rodriguez", "Jon E. Froehlich"]
institutions: ["University of Washington"]
year: 2024
venue: "CHI 2024 (ACM CHI Conference on Human Factors in Computing Systems), Article 408"
peer_reviewed: true
url: https://arxiv.org/abs/2404.08213
code_url: null
citations: null
source: "raw/papers/gazepointar-2024.md"
added: "2026-07-01"
relevance: 5
credibility: 5
status: skimmed
related_experiments: []
related_concepts: ["deictic-reference", "pronoun-disambiguation", "gaze-context-grounding", "gaze-plus-voice-selection", "multimodal-fusion"]
tags: ["gaze", "voice", "augmented-reality", "voice-assistant", "pointing", "context-aware", "llm"]
---

# GazePointAR: A Context-Aware Multimodal Voice Assistant for Pronoun Disambiguation in Wearable Augmented Reality

## TL;DR

A wearable-AR voice assistant that fuses eye gaze, pointing gestures, and
conversation history so users can ask underspecified/deictic questions ("what's
over there?", "how do I solve this?") and have the pronoun resolved from where
they are looking or pointing. Evaluated in a 3-part lab study (N=12) plus an
in-the-wild diary study.

## Claims

- Commercial VAs (Siri, Alexa) fail because they lack spatiotemporal context;
  grounding queries in gaze + pointing + dialogue history fixes underspecified
  reference.
- A fully-functional context-aware VA can resolve pronouns/deixis in real time
  on wearable AR.
- Users find pronoun-driven queries natural and human-like, though pronoun use
  is sometimes counter-intuitive.

## Methods

- Multimodal fusion pipeline: eye gaze + pointing gesture + conversation
  history feed reference resolution for the spoken query.
- Three-part lab study (N=12): (1) vs two commercial systems; (2) pronoun
  disambiguation across three tasks; (3) open-ended user-suggested queries.
- Iterated the system, then ran a first-person in-the-wild diary study.
- (Exact LLM and fusion architecture not in the captured abstract/metadata.)

## Results

- Participants appreciated the naturalness / human-likeness of pronoun-based
  interaction.
- Pronoun use was sometimes counter-intuitive to users.
- System exercised both in lab and in-the-wild; paper enumerates limitations
  and design considerations for future context-aware VAs.

## Critique / open questions

- Small lab sample (N=12); diary study is first-person (single subject) — signal
  is directional, not statistical.
- Captured content lacks the disambiguation accuracy numbers and the LLM/fusion
  details; would need the full PDF to assess robustness of reference resolution.
- No released code URL found — reproducibility unclear.
- Directly on-theme for hands-free control: gaze+voice deixis is exactly the
  "point with your eyes, act with your voice" pattern.

## Trust signals

- **Credibility:** 5 — CHI 2024 full paper (top-tier peer-reviewed HCI venue),
  Froehlich group (University of Washington, Makeability Lab), fully-functional
  system with both lab and field evaluation.

## Follow-up

- Pull the full PDF for the LLM + fusion architecture and pronoun-resolution
  accuracy figures.
- Compare its "look/point + pronoun" grounding against GAVIN's implicit gaze
  anchoring (raw/papers/gavin-2021.md) as two points on a gaze-context spectrum.
- Candidate seed for a hands-free deictic-selection experiment.
