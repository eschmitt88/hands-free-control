---
kind: paper
title: "Development of an eye-tracking and voice command interface to facilitate GUI operation for people with disabled upper limbs"
authors: []
institutions: []
year: 2022
venue: "Universal Access in the Information Society (Springer)"
peer_reviewed: true
url: https://link.springer.com/article/10.1007/s10209-022-00939-y
code_url: null
citations: null
source: "raw/papers/eyetracking-voice-disabled-limbs-2022.md"
added: "2026-07-01"
relevance: 3
credibility: 3
status: skimmed
related_experiments: []
related_concepts: ["gaze-cursor-positioning", "gaze-plus-voice-selection", "midas-touch-problem", "target-expansion", "accessibility-motor-impairment"]
tags: ["gaze", "voice", "accessibility", "motor-impairment", "gui", "browser-extension", "cursor"]
---

# Development of an eye-tracking and voice command interface to facilitate GUI operation for people with disabled upper limbs

> ACCESS: ABSTRACT ONLY (Springer paywall; ACM PDF 403). Body below is written
> from the publisher abstract plus clearly-marked domain knowledge. Author list
> and numeric results were not retrievable.

## TL;DR

An accessibility interface for people with disabled upper limbs: eye-tracking
positions the cursor over web GUI elements, the target object is dynamically
magnified to reduce pointing error, and a voice command executes ("clicks") it
— avoiding dwell-based accidental activation. Shipped as a Chrome extension.

## Claims

- Gaze-only web interaction suffers two pointer-execution error types: pointing
  error (hard to hit small targets) and execution error (unintended activation).
- Dynamic magnification of the gaze-targeted object reduces pointing error.
- Using a voice command (rather than dwell) as the execute trigger removes
  unintended activation — i.e. addresses the Midas-touch problem.
- Feasible as a browser (Chrome) extension for real web GUIs.

## Methods

- Gaze positions the cursor; candidate target dynamically magnified; voice
  command triggers execution. Implemented as a Chrome extension embedded in the
  browser. A usability evaluation was conducted (design/results paywalled).
- *[Domain knowledge, not from source:]* This "gaze points, voice confirms" split
  mirrors the "gaze suggests, touch confirms" principle of gaze-supported
  selection (cf. Look & Touch, raw/papers/look-and-touch-2012.md), substituting
  voice for touch so the interaction stays fully hands-free — which is what makes
  it suitable for users without upper-limb use.

## Results

- Not captured (behind paywall). A usability study was reported; magnitudes
  unknown.

## Critique / open questions

- Cannot assess sample size, task battery, or effect sizes from the abstract —
  credibility capped accordingly.
- Voice-as-confirm avoids Midas touch but may be slow/fatiguing for dense GUIs
  (echoes the "repeated voice confirms are tedious" finding in Eyes on Many,
  raw/papers/eyes-on-many-2026.md).
- Directly relevant motivation for the project: hands-free control as an
  accessibility necessity, not just a convenience.

## Trust signals

- **Credibility:** 3 — Peer-reviewed Springer accessibility journal (Universal
  Access in the Information Society), which lends baseline trust; but the paper
  is paywalled, author list unresolved, and no results/effect sizes or code were
  obtainable, so the rating reflects abstract-only visibility rather than a
  weak venue.

## Follow-up

- Obtain full text (institutional access) for the usability results and the
  magnification/voice trigger parameters.
- Resolve author list and citation count.
- Use as the accessibility framing/motivation source; pair with Look & Touch for
  the "gaze suggests, X confirms" design lineage.
