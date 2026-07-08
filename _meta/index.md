---
name: index
description: Entry-point index for this project's knowledge graph.
---

# Index

Orientation for the project knowledge graph. Updated by `/wrap`, `/ingest`,
and `/new-experiment`.

## Maps of Content

- [[multimodal-gaze-voice]] — **the project thesis**: gaze points, voice confirms.
- [[voice-control]] — the primary channel (ASR pipeline + LLM intent layer).
- [[gaze-head-pointing]] — the coarse-pointing channel (gaze/head + calibration).
- [[consumer-bci]] — surveyed and **deliberately parked** (bandwidth ceiling).

## Literature

40 notes ingested 2026-07-01 across 4 modalities (23 papers, 8 repos, 9 posts).
See `literature/` and the four candidate triage files in `raw/_candidates/`.

## Active experiments

- `experiments/2026-07-01-webcam-gaze-accuracy/` — characterize gaze + head-pose
  accuracy on the user's webcam (°-error, dwell false-activation). **HCE-scoped**
  (has `splits.yaml`). status: running. First real session in: gaze median 5.56°
  (coarse, as predicted); head-pose number is a head-still confound (see its
  Diagnostics) — motivated the closed-loop experiment below.
- `experiments/2026-07-08-head-pointing-closed-loop/` — measure the head channel
  the way it's actually used: a visible head-driven cursor, closed-loop target
  acquisition (acquisition time / settling / gain-robustness), not open-loop
  angular error. Webapp mode `/headpoint`. Not HCE-scoped (behavioral task).
  status: running (harness + synth self-check green; awaiting real session).

## Open questions

- What gaze/head accuracy is achievable with the user's specific webcam? (First
  experiment candidate — measure °-error + dwell false-activation rate.)
- Voice-first vs multimodal for the MVP: does gaze pointing earn its complexity
  over pure voice + [[grid-overlay-targeting]]?
- Re-fetch follow-ups: `camera-mouse` (site was down) and `put-that-there-1980`
  (PDF fetch hung) were reconstructed from search — refresh when reachable.
