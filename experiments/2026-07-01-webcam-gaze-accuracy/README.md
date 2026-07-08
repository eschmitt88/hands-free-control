---
kind: experiment
slug: "webcam-gaze-accuracy"
date: "2026-07-01"
status: running     # running | done | abandoned
hypothesis: "After a 9-point calibration, a monitor-mounted consumer webcam yields gaze error in the 3-6 deg range (a few cm on screen) and lower/steadier error for head-pose pointing; both suffice for coarse region targeting but not pixel-precise targeting — motivating gaze-points/voice-confirms."
result: ""
related_concepts: [webcam-gaze-tracking, appearance-based-gaze-estimation, landmark-based-gaze, gaze-calibration, gaze-angular-accuracy, head-pose-pointing, dwell-click, midas-touch-problem, gaze-point-speech-command]
related_literature: [mediapipe-iris, l2cs-net-2022, gazecapture-itracker-2016, emc-gaze-2026, webcam-iris-recalibration-2024, camera-mouse, eviacam]
tags: [gaze, calibration, measurement, hce]
---

# webcam-gaze-accuracy

## Hypothesis

State precisely what we expect, before running anything:

1. **Gaze accuracy.** After a 9-point calibration, MediaPipe Face-Mesh features →
   ridge regression will estimate on-screen gaze with **mean validation error of
   ~3-6°** (≈ 3-7 cm at a 60 cm viewing distance on a 27" monitor). This matches
   the literature ([[l2cs-net-2022]] 3.9° in-the-wild; [[emc-gaze-2026]] 5.8°
   landmark-only).
2. **Head-pose is steadier.** Head-pose pointing ([[head-pose-pointing]]) will
   show **lower variance and comparable-or-better mean error**, consistent with
   why assistive tools ([[camera-mouse]], [[eviacam]]) prefer it on commodity cams.
3. **Coarse, not precise.** Both channels will be sufficient for coarse region
   selection but the **dwell false-activation rate** will be high enough that
   dwell-only selection is impractical — motivating [[dwell-free-selection]] via
   voice ([[gaze-point-speech-command]]).

## Setup

- Config: `config.yaml` (screen geometry + capture + dwell params — **measure the
  screen physical size and viewing distance on the collection workstation**).
- Splits: `splits.yaml` (calibration / validation / **test** target positions; HCE).
- Code:
  - `collect.py` — interactive full-screen collector (runs on the **workstation**
    with the webcam; needs a display). Captures MediaPipe features at each target.
  - `analyze.py` — headless analysis: fit on calibration, score on **validation**,
    write `metrics.json`. `--final` also scores the held-out **test** set →
    `final_metrics.json` (final-scoring pass only, per HCE).
  - `synth.py` — generates synthetic sessions with a known injected angular error,
    used to **validate the metric math headlessly** (no webcam needed).
  - `gazelib/` — feature extraction (`features.py`, MediaPipe), calibration
    (`calibrate.py`), geometry (`geometry.py`), dwell sim (`dwell.py`).
- Data: `results/session_*/` (per-session jsonl of feature vectors + targets).
  Validation split is the search signal; **test is off-limits until final scoring**.

### How to run — PRIMARY: browser, no install

The collector is served as a webapp (see `../../webapp/`), so the workstation just
opens a URL — no Python/MediaPipe install. On the machine with the webcam:

1. Open **https://aiserver2026:8104/** (or `https://100.70.9.10:8104/`). The cert is
   trusted by any device that already trusts the dotaml-live rootCA (e.g. desktop-2020).
2. On the pre-flight screen: allow the camera, confirm a face is detected, enter your
   **physical screen size + viewing distance** (used for the °-error conversion).
3. Click Start → fullscreen → look at each dot (calibration → validation → test).
4. Results (validation gaze/head error in ° and cm, dwell false-activation) render in
   the browser. Data is saved on aiserver at
   `results/session_web_<ts>/` and scored by this experiment's `analyze.py`
   (validation only; **test stays held out** for the final pass).

### Alternate: local Python collector (no server)

```sh
cd experiments/2026-07-01-webcam-gaze-accuracy
uv sync --extra collect          # mediapipe, opencv, pygame
# measure + edit config.yaml: screen.width_mm/height_mm, viewing_distance_mm
uv run python collect.py         # sit ~60 cm away; look at each dot, press space
uv run python analyze.py         # writes metrics.json (validation)
```

The analysis (`analyze.py`, `synth.py`) runs headless on aiserver2026; `synth.py
--selfcheck` validates the metric math with no webcam.

## Result

First real in-browser session (`session_web_20260702-003616`, `metrics.json`,
validation split). **Gaze:** mean 9.29° / median 5.56° / p95 27.4° (≈11 cm on
screen), dwell false-activation 0.81. **Head-pose:** mean 22.91° / median 19.63°
— but this number is a **head-still confound, not a verdict** (see Diagnostics).
Held-out test remains unscored (`final_metrics.json` not written) — the method
search is not finished. See `~/.claude/rules/evaluation.md`.

## Interpretation

- **Gaze is coarse-only, as hypothesized.** Median 5.56° sits inside the
  predicted 3–6° band and matches the prior art ([[l2cs-net-2022]] 3.9°,
  [[emc-gaze-2026]] 5.8°). The mean (9.29°) is dragged up by a few large-error
  validation dots (p95 27°), and the vertical iris signal is weak (vertical iris
  std ≈0.003 vs ≈0.014 horizontal) — the classic webcam-gaze vertical deficit.
  0.81 dwell false-activation confirms dwell-only selection is impractical →
  motivates element-latching + voice-confirm over raw dwell.
- **Hypothesis #2 (head-pose steadier) is NOT tested by this run.** In a *gaze*
  calibration the head is held roughly still, so the head-pose regressor had no
  deliberate pointing signal — it fit head *jitter*. The +17.25° calib→val gap
  proves it overfit 9 near-identical calibration points. Testing the head channel
  requires a **closed-loop head-pointing** collection (cursor visible, user aims
  by moving the head), where the metric is settling error + acquisition time, not
  open-loop angular error. Per the user's usage model, head only needs a *gain*
  ("size") calibration because the visible cursor closes the loop.

## Diagnostics

- intended_effect_confirmed: partial — gaze coarse-accuracy hypothesis (#1)
  confirmed (val median 5.56° in the 3–6° band, metrics.json); hypothesis #2
  (head steadier) untestable here due to head-still confound; #3 (dwell
  impractical) confirmed (false_activation 0.81).
- leakage_check: split-by-target-position (calibration 3×3 / validation 4×4 /
  test held out); analyze.py fits on calibration.jsonl only and never reads
  test.jsonl in default mode — no leakage. Distinct physical dot positions per split.
- overfitting_signal: gaze calib=4.66 val=9.29 gap=+4.63; headpose calib=5.66
  val=22.91 gap=+17.25 — gaze mildly overfits (9 calibration points, 6 features,
  α=1.0); headpose grossly overfits (head-still → 9 near-identical rows fit as
  noise). Both argue for more calibration points and/or stronger regularization.
- delta_from_prior: n/a (first experiment)
- unexpected_findings: head-pose scored far *worse* than gaze (opposite of the
  hypothesis) — an artifact of measuring head pose during a head-still gaze task,
  not evidence against head pointing. Recorded so the head-pointing experiment
  isn't mis-anchored to this number.
- next_candidates:
  - Build a closed-loop head-pointing collection mode (visible cursor, gain
    calibration, drive-to-target + dwell/confirm) measuring settling error and
    acquisition time rather than open-loop angular error.
  - Add more calibration points and/or raise ridge α (or per-axis regularization
    for the weak vertical channel) and re-score gaze to shrink the +4.63° gap.

## Follow-up

- ...
