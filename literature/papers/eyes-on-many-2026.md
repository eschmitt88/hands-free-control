---
kind: paper
title: "Eyes on Many: Evaluating Gaze, Hand, and Voice for Multi-Object Selection in Extended Reality"
authors: ["Mohammad Raihanul Bashar", "Aunnoy K Mutasim", "Ken Pfeuffer", "Anil Ufuk Batmaz"]
institutions: ["Concordia University", "Aarhus University"]
year: 2026
venue: "CHI 2026 (ACM CHI Conference on Human Factors in Computing Systems), Barcelona"
peer_reviewed: true
url: https://arxiv.org/abs/2602.12406
code_url: null
citations: null
source: "raw/papers/eyes-on-many-2026.md"
added: "2026-07-01"
relevance: 5
credibility: 4
status: skimmed
related_experiments: []
related_concepts: ["multi-object-selection", "gaze-plus-voice-selection", "mode-switching", "multimodal-fusion", "midas-touch-problem"]
tags: ["gaze", "voice", "hand", "pinch", "extended-reality", "selection", "empirical-study", "xr"]
---

# Eyes on Many: Evaluating Gaze, Hand, and Voice for Multi-Object Selection in Extended Reality

## TL;DR

Empirical XR study decomposing multi-object selection into mode-switching
(toggle multi-select) and subselection (pick each object), then crossing 4
mode-switch techniques (SemiPinch, FullPinch, DoublePinch, Voice) x 3
subselection techniques (Gaze+Dwell, Gaze+Pinch, Gaze+Voice). DoublePinch +
Gaze+Pinch wins; Gaze+Voice subselection is disliked because repeating vocal
commands is tedious.

## Claims

- Multi-object selection = two composable steps (mode-switching + subselection),
  each assignable to eyes, hands, or voice.
- Design choices for each step measurably change speed/accuracy/effort.
- Voice is useful for the discrete mode-switch but poor for repeated
  subselection.

## Methods

- Controlled user study crossing 4 mode-switching x 3 subselection techniques.
- Modalities: hand (pinch variants), gaze (dwell / pinch-confirm / voice-confirm),
  voice (mode toggle and per-object confirm).
- Measures overall performance (speed, accuracy, effort/preference).

## Results

- DoublePinch + Gaze+Pinch = highest overall performance.
- SemiPinch = lowest performance.
- Voice-based mode-switching showed benefits (good for a one-off discrete toggle).
- Gaze+Voice subselection was less favored — repetitive vocal commands perceived
  as tedious.

## Critique / open questions

- Key lesson for hands-free design: voice suits *discrete/infrequent* actions
  (mode toggles), not *repeated high-frequency* ones (per-object confirms) —
  fatigue/tedium dominates. This bounds where voice belongs in a hands-free
  control loop.
- Captured content lacks the numeric effect sizes and participant count — need
  the PDF.
- XR/hand-available setting: the winning technique relies on pinch, so its
  conclusions transfer only partially to strictly hands-free (no-hand) contexts;
  the Voice and Gaze+Dwell arms are the transferable ones.

## Trust signals

- **Credibility:** 4 — CHI 2026 paper; Pfeuffer (gaze+pinch lineage) and Batmaz
  (XR interaction / Fitts' law) are established in the area; clean factorial
  study design. Docked from 5 pending the full results (fetched from abstract
  only; very recent, citations not yet accrued).

## Follow-up

- Pull the PDF for effect sizes and N.
- Extract the "voice for discrete toggles, not repeated confirms" heuristic into
  a design note for the project.
- Isolate the hands-free-relevant arms (Voice mode-switch, Gaze+Dwell,
  Gaze+Voice) as a baseline table for a no-hands selection experiment.
