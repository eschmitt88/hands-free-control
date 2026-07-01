---
kind: moc
name: "Multimodal Gaze + Voice"
status: growing
added: "2026-07-01"
tags: [multimodal, thesis, interaction]
---

# Multimodal Gaze + Voice — the project thesis

The strongest prior-art signal from the 2026-07-01 survey is that **neither gaze
nor voice alone is the answer — their combination is**. Gaze is fast but
imprecise and suffers the [[midas-touch-problem]]; voice is precise about
*intent* but slow at continuous *pointing*. Put each modality on the job it is
good at and they cover each other's weakness. This is the oldest idea in the
space ([[deictic-reference]], Bolt's "Put-That-There", 1980) and the dominant
pattern in the current literature (CHI 2026 gaze+speech scoping review).

## The core pattern

- [[gaze-point-speech-command]] — gaze points, a spoken command acts. The
  load-bearing pattern; every system below is a variant of it.
- [[gaze-suggests-x-confirms]] — the design principle underneath it: gaze
  *suggests* a coarse target, a second modality *confirms* the commit.
- [[gaze-supported-interaction]] — gaze assists rather than drives; the general
  framing that generalizes [[magic-pointing]] from gaze+manual to gaze+voice.

## The problem it solves

- [[midas-touch-problem]] — the central obstacle for gaze-only interfaces:
  looking cannot be distinguished from intending. A separate confirm channel
  (voice) dissolves it.
- [[dwell-free-selection]] — voice confirmation replaces dwell timers, removing
  dwell's latency/false-activation trade-off (EyeTAP showed this beats both
  dwell and voice-only on time *and* cognitive load).

## Fusion & reference resolution

- [[multimodal-fusion]] — combining the streams into one command; temporal
  alignment is the hard part.
- [[mutual-disambiguation]] — each modality resolves the other's ambiguity.
- [[deictic-reference]] · [[pronoun-disambiguation]] · [[gaze-context-grounding]]
  · [[implicit-anchoring]] — the "what is *that*?" family: gaze grounds
  underspecified speech (GazePointAR, GAVIN).

## Precision recovery (fixing gaze's coarseness)

- [[coarse-to-fine-selection]] — two-stage: gaze acquires the neighborhood, a
  refinement step lands the target.
- [[gaze-steered-zoom]] · [[target-expansion]] — magnify under gaze so small
  targets become hittable.

## Discrete control acts

- [[multi-object-selection]] · [[mode-switching]] — voice is ideal for discrete,
  infrequent triggers (toggling modes); it fatigues when repeated per-object
  (a caution from Eyes-on-Many 2026).

## Why this is the spine

For an able-bodied user with a webcam and a mic, the buildable, evidence-backed
architecture is: **gaze/head for coarse pointing → voice command to confirm and
act**, with [[target-expansion]] or overlays to recover precision. See also the
voice channel ([[voice-control]] MoC), the pointing channel
([[gaze-head-pointing]] MoC), and the parked [[consumer-bci]] MoC.
