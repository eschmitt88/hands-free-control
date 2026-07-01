---
kind: paper
title: "Put-That-There: Voice and Gesture at the Graphics Interface"
authors: ["Richard A. Bolt"]
institutions: ["MIT Architecture Machine Group"]
year: 1980
venue: "SIGGRAPH '80 / Computer Graphics 14(3)"
peer_reviewed: true
url: https://www.media.mit.edu/speech/papers/1980/bolt_SIGGRAPH80_put-that-there.pdf
code_url: null
citations: null
source: "raw/papers/put-that-there-1980.md"
added: "2026-07-01"
relevance: 4
credibility: 5
status: skimmed
related_experiments: []
related_concepts: [deictic-reference, mutual-disambiguation, multimodal-fusion, gaze-point-speech-command]
tags: [multimodal, deixis, voice, gesture, seminal]
---

# Put-That-There: Voice and Gesture at the Graphics Interface

## TL;DR

The seminal multimodal system: a user points at a wall-sized display while
speaking deictic commands ("put that there"), with the pointing gesture grounding
the ambiguous pronouns in speech — the conceptual root of gaze/voice interaction.

## Claims

- Speech + a spatial referencing modality (pointing gesture) yields a natural,
  conversational interface.
- Deictic words ("that," "there") that are ambiguous in speech alone are resolved
  by concurrent pointing — mutual disambiguation.

## Methods

- "Media Room": user seated before a large graphics wall display; a magnetic
  position/orientation sensor on the wrist tracks pointing.
- Speech carries the command verb and object class; gesture supplies the spatial
  referent. System uses speech output to query the user on ambiguous input.
- Example interactions: create shapes ("Create a blue square there"), move/copy/
  delete objects ("Put that ... there"), naming.
- (Primary PDF failed to fetch — socket hang up; note built from search summaries
  + clearly-marked domain knowledge. Access: failed.)

## Results

- Demonstration system, not a controlled study. Widely credited as the first
  multimodal interface and the origin of deictic voice+pointing interaction.

## Critique / open questions

- 1980 demo, wall display + arm pointing — not desktop, not hands-free. Its value
  here is conceptual: the deixis / mutual-disambiguation pattern maps directly
  onto modern gaze(=point)+speech(=command) desktop control.
- No quantitative evaluation; historical significance rather than empirical
  evidence.

## Trust signals

- **Credibility:** 5 — Bolt, MIT Architecture Machine Group, SIGGRAPH '80; a
  canonical, heavily-cited seminal work. (Credibility of the source is high even
  though this ingest could not capture the PDF text itself.)

## Follow-up

- Frame the project's gaze+voice model explicitly as substituting gaze for the
  1980 arm-pointing referent — deixis is the through-line.
- Read the actual PDF (retry fetch / MIT mirror) to capture Bolt's original
  interaction-flow description.
