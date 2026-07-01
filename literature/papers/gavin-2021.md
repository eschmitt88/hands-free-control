---
kind: paper
title: "GAVIN: Gaze-Assisted Voice-Based Implicit Note-taking"
authors: ["Anam Ahmad Khan", "Joshua Newn", "Ryan Kelly", "Namrata Srivastava", "James Bailey", "Eduardo Velloso"]
institutions: ["University of Melbourne"]
year: 2021
venue: "ACM Transactions on Computer-Human Interaction (TOCHI), Vol. 28"
peer_reviewed: true
url: https://arxiv.org/abs/2104.00870
code_url: null
citations: null
source: "raw/papers/gavin-2021.md"
added: "2026-07-01"
relevance: 4
credibility: 4
status: skimmed
related_experiments: []
related_concepts: ["gaze-context-grounding", "implicit-anchoring", "gaze-plus-voice-selection", "midas-touch-problem"]
tags: ["gaze", "voice", "note-taking", "implicit-interaction", "eye-tracking", "machine-learning", "reading"]
---

# GAVIN: Gaze-Assisted Voice-Based Implicit Note-taking

## TL;DR

A gaze-assisted voice note-taking app that lets readers speak notes on digital
documents and implicitly anchors each note to the text passage they were looking
at — no manual highlighting or pointing. A classifier trained on gaze data
predicts the referenced passage.

## Claims

- Highlighting + typing notes is trivial on desktop but hard on hand-held mobile
  reading; voice + gaze removes the manual burden.
- Gaze can serve as a resource for *implicit* anchoring of voice notes to text
  passages with minimal effort and high accuracy.
- A classifier can predict the target passage of a voice note from gaze
  behavior.

## Methods

- Contextual enquiry into digital-document note-taking practices.
- Data collection with 32 participants performing voice note-taking while gaze
  is tracked.
- Train an ML classifier to predict the text passage a voice note refers to
  from gaze features.
- Deploy the classifier inside GAVIN; feasibility user study.

## Results

- Demonstrates feasibility of implicit gaze anchoring for voice notes with
  "minimal effort and high accuracy" (exact accuracy behind the PDF).

## Critique / open questions

- "High accuracy" not quantified in captured content — need the PDF for the
  classifier's passage-prediction accuracy and error modes.
- Implicit anchoring trades control for effort: what happens when the user reads
  ahead of / behind the passage they mean? Robustness to gaze-note temporal
  offset is the key open question.
- Reading-note domain is narrower than general hands-free control, but the
  *implicit gaze-anchoring* mechanism generalizes to any "act on what I'm
  looking at" command.

## Trust signals

- **Credibility:** 4 — Published in TOCHI (peer-reviewed ACM journal); Velloso /
  Newn eye-interaction group (University of Melbourne). Solid empirical pipeline
  (contextual inquiry + N=32 + trained classifier + user study). Docked from 5
  only because captured accuracy figures and code are unavailable.

## Follow-up

- Get the PDF for classifier accuracy and gaze-feature set.
- Contrast implicit anchoring (GAVIN) vs explicit deictic pointing
  (GazePointAR) as design poles for gaze-grounded voice commands.
