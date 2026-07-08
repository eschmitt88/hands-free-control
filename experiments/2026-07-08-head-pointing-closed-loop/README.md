---
kind: experiment
slug: "head-pointing-closed-loop"
date: "2026-07-08"
status: running     # running | done | abandoned
hypothesis: "With a visible cursor driven by head pose, closed-loop feedback lets the user acquire and settle on on-screen targets reliably (>90% success, sub-cm settling) even when the head->cursor gain ('size' calibration) is only roughly set — because the user corrects in real time. Acquisition time is the cost, not accuracy. This is the opposite regime from the open-loop head-pose number in 2026-07-01-webcam-gaze-accuracy (22.9 deg), which measured head pose during a head-still gaze task and is not a controllability result."
result: "First session (un-tuned EMA smoother; directionality correct via both invert toggles): 100% target acquisition across a ±40% gain sweep, 0.25 deg (0.28 cm) settling, 3.25 s/target (slow, traced to cursor wobble). Closed-loop control forgives coarse calibration; speed is the cost. Added a One-Euro filter + live tuning sandbox to cut wobble; tuned re-run pending."
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

First real session (`hpsession_web_20260708-151320`, `metrics.json`).
**Directionality was correct** — the user enabled both invert toggles (only the
axis *signs* were flipped, not the axes themselves), so the mapping was sound.
The run used the pre-filter EMA smoother (no One-Euro filter, no deadzone); the
user reported cursor **wobble** and found the task challenging. Results:

- **success_rate = 1.0** — all 30 targets acquired, across every gain (×0.6/×1.0/×1.4).
- **median settling = 0.25° (0.28 cm)** — sub-cm steadiness held through the dwell.
- **median acquisition = 3.25 s** — the cost (slow; traced to wobble, not miscontrol).
- **mean overshoot = 0.93**, **path efficiency = 0.75**, **throughput = 1.1 bits/s**.
- **Gain robustness:** 100% success at all three gains; acquisition *fell* with
  higher gain (3.67→3.36→2.67 s for ×0.6→×1.0→×1.4) and throughput rose
  (1.03→1.08→1.44 bits/s). No instability at ×1.4 — the human adapts where the
  synthetic controller broke.

## Interpretation

The core hypothesis holds. These numbers come from the **un-tuned** setup (EMA
smoother, no filter/deadzone), so speed in particular should improve with tuning:

- **Closed-loop control forgives coarse calibration — strongly.** 100% acquisition
  under a ±40% gain sweep is the headline. The head channel does not need a precise
  calibration; a gain slider the user eyeballs is enough, exactly as predicted.
- **The precision payoff is real.** 0.25° settling is ~20× tighter than open-loop
  gaze (`../2026-07-01-webcam-gaze-accuracy/metrics.json`: gaze median 5.56°). Head
  fine-adjustment can hold well inside any button.
- **Speed is the cost, and it's the thing to improve.** 3.25 s/target is slow (a
  mouse is sub-second). Higher gain helped speed with no accuracy penalty, so the
  operating point likely sits at or above the user's chosen gain.
- **User-reported difficulty** ("challenging") + wobble trace to the pre-filter EMA
  smoother and zero deadzone. In response, a **One-Euro filter** and a **live tuning
  sandbox** (gain / steadiness / responsiveness / deadzone, with a wobble readout)
  were added so the user can dial in the feel before the next scored run; `meta.tune`
  records the settings used per session.

## Diagnostics

- intended_effect_confirmed: yes — closed-loop acquisition succeeded 100% across a
  ±40% gain sweep (`metrics.json:by_gain.*.success_rate` all 1.0) with 0.25° settling
  (`metrics.json:overall.median_settle_deg`), on the un-tuned EMA smoother.
- leakage_check: n/a (behavioral task, no train/test split)
- overfitting_signal: n/a (no fitted model; gain is a live user control)
- delta_from_prior: vs 2026-07-01-webcam-gaze-accuracy head-pose — reframes the
  22.9° open-loop artifact as a closed-loop result: settling 0.25° vs gaze median
  5.56° open-loop, i.e. ~20× tighter with a visible cursor (`metrics.json`).
- unexpected_findings: higher gain improved speed with no accuracy loss and no
  instability at ×1.4 — opposite the synthetic sloppy controller, i.e. the human
  adapts. Acquisition (3.25 s) is slow and traces to pre-filter cursor wobble, which
  motivated the One-Euro filter + tuning sandbox rather than any mapping change.
- next_candidates:
  - Re-run after tuning (One-Euro steadiness/responsiveness + deadzone) and test
    whether median acquisition drops below ~2 s/target at fixed settling.
  - Add element-latching (snap-to-nearest-target / area cursor) on top of the head
    cursor and measure the acquisition-time reduction it buys at fixed settling.

## Follow-up

- ...
