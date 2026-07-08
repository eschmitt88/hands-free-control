---
kind: experiment
slug: "head-pointing-closed-loop"
date: "2026-07-08"
status: running     # running | done | abandoned
hypothesis: "With a visible cursor driven by head pose, closed-loop feedback lets the user acquire and settle on on-screen targets reliably (>90% success, sub-cm settling) even when the head->cursor gain ('size' calibration) is only roughly set — because the user corrects in real time. Acquisition time is the cost, not accuracy. This is the opposite regime from the open-loop head-pose number in 2026-07-01-webcam-gaze-accuracy (22.9 deg), which measured head pose during a head-still gaze task and is not a controllability result."
result: ""
related_concepts: [head-pose-pointing, camera-mouse, eviacam, closed-loop-control, gain-calibration, dwell-click, area-cursor, gaze-head-pointing]
related_literature: [camera-mouse, eviacam]
tags: [head-pose, closed-loop, control, pointing, measurement]
---

# head-pointing-closed-loop

## Hypothesis

The user's own usage model (2026-07-08): *"I move my eyes to look at a button,
then adjust my head a little to aim better. Since I move my head in response to
the cursor moving, it's closed-loop control, so calibration doesn't need to be
precise — the head-pose estimator just needs a size (gain) calibration."*

That reframes what to measure for the head channel. **Open-loop angular
accuracy is the wrong metric** (and produced the misleading 22.9° in
`../2026-07-01-webcam-gaze-accuracy/metrics.json`, an artifact of measuring
head pose while the head was held still for a *gaze* task). The right metrics
are **closed-loop**:

1. **Reliability.** With a visible head-driven cursor, target-acquisition
   **success rate ≥ 90%** and **settling** (steadiness held during the dwell
   window) **≤ ~1° (sub-cm)** — bounded by control, not by calibration error.
2. **Gain-robustness.** Success rate and settling stay high across a **±30–50%
   range of head→cursor gain**. If true, the "size calibration" can be a slider
   the user eyeballs, not a precise fit — validating the closed-loop claim.
3. **Speed is the cost.** The price of coarse calibration and closed-loop
   correction shows up as **acquisition time** (target appears → stable dwell),
   expected ~1–3 s/target, rising for far/small targets (Fitts-law throughput
   in bits/s is the summary number).

Corollary for the product: if (1)+(2) hold, the head channel is a viable
**fine-adjustment** layer on top of coarse gaze — the "eyes point, head nudges,
voice confirms" spine — and does not need a precise per-user calibration.

## Setup

- Config: `config.yaml` — target sequence (ISO-9241-style multidirectional),
  dwell radius/time, default gain + the gain multipliers swept for robustness,
  neutral-capture window, smoothing, per-target timeout, screen-geometry
  defaults (overridden per session by the browser-measured geometry).
- Code:
  - Collection is a **webapp mode** (`../../webapp/`, route `/headpoint`) — the
    head-driven cursor + closed-loop target task runs in the desktop browser
    (MediaPipe FaceLandmarker → head pose → cursor), and each trial's full
    trajectory is POSTed back and stored under `results/hpsession_web_<ts>/`.
  - `analyze_headpoint.py` — headless: reads a session's `trials.jsonl`,
    computes per-trial acquisition time, settling (RMS cursor spread held in the
    dwell window), overshoot count, success/miss, and Fitts throughput; writes
    `metrics.json`. Imports only numpy/pyyaml/stdlib (no mediapipe/cv2).
  - `synth_headpoint.py` — headless validator: simulates a closed-loop pointer
    (proportional controller + reaction delay + motor noise) driving the same
    target sequence at a known gain error, so the metric math is checked with no
    webcam (mirrors `../2026-07-01-webcam-gaze-accuracy/synth.py`).
- Data: `results/hpsession_web_<ts>/` — `trials.jsonl` (one row per target:
  target pos, samples of {t_ms, cursor_x, cursor_y, yaw, pitch}, outcome) +
  `meta.json` (screen geometry, gain used, neutral pose).

Not HCE-scoped: there is no held-out target split. This is a behavioral
characterization of the control loop, not a search over estimation methods, so
`metrics.json` has no val/test semantics. If a later experiment *tunes* a
method against this task, it must introduce a split then (and an ADR).

### How to run

1. Open **https://aiserver2026:8104/headpoint** on the machine with the webcam.
2. Allow the camera; confirm a face is detected; enter physical screen size +
   viewing distance (for °/cm conversion).
3. Look straight at center to capture a **neutral pose**, then use the **gain
   slider** to set a comfortable head→cursor sensitivity (small head turns
   should move the cursor across the screen without straining). This is the
   whole "size calibration."
4. Click Start → fullscreen → drive the cursor into each highlighted target and
   hold until it locks. The task sweeps a few gain multipliers around your
   chosen gain to measure robustness.
5. Metrics render in the browser and are saved on aiserver; `analyze_headpoint.py`
   scores them server-side.

## Result

Fill in after the run. Points at `metrics.json` (this experiment's own result
file — no held-out split here).

## Interpretation

What did we actually learn? Did closed-loop control forgive coarse calibration?

## Diagnostics

Fill in after the run. One line per field; `n/a` rather than blank.
`next_candidates` must list ≥2 concrete one-sentence proposals.

- intended_effect_confirmed: <yes | no | partial> — <evidence with anchor>
- leakage_check: n/a (behavioral task, no train/test split)
- overfitting_signal: n/a (no fitted model; gain is a live user control)
- delta_from_prior: vs 2026-07-01-webcam-gaze-accuracy head-pose — reframes the
  22.9° open-loop artifact as a closed-loop controllability measurement (metrics.json)
- unexpected_findings: <one or two sentences, or "none">
- next_candidates:
  - <one-sentence proposal 1>
  - <one-sentence proposal 2>

## Follow-up

- ...
