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

### How to run (on the workstation with the webcam)

```sh
cd experiments/2026-07-01-webcam-gaze-accuracy
uv sync                          # installs mediapipe, opencv, pygame, ...
# measure and edit config.yaml: screen.width_mm/height_mm, viewing_distance_mm
uv run python collect.py         # sit ~60 cm away; look at each dot, press space
uv run python analyze.py         # writes metrics.json (validation)
```

The analysis (`analyze.py`, `synth.py`) also runs headless on aiserver2026.

## Result

Fill in after the run. Points at `metrics.json` (validation split — the search
signal). `final_metrics.json` (held-out test) is written only by
`analyze.py --final` at chain end. See `~/.claude/rules/evaluation.md`.

## Interpretation

What did we actually learn? What surprised us?

## Diagnostics

Fill in after the run. One line per field; `n/a` rather than blank.
`next_candidates` must list ≥2 concrete one-sentence proposals. Metric numbers
reference `metrics.json` (validation split) unless noted.

- intended_effect_confirmed: <yes | no | partial> — <evidence with anchor>
- leakage_check: <method> — <finding>
- overfitting_signal: calib=<x> val=<y> gap=<z> — <interpretation> (metrics.json)
- delta_from_prior: n/a (first experiment)
- unexpected_findings: <one or two sentences, or "none">
- next_candidates:
  - <one-sentence proposal 1>
  - <one-sentence proposal 2>

## Follow-up

- ...
