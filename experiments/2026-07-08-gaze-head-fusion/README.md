---
kind: experiment
slug: "gaze-head-fusion"
date: "2026-07-08"
status: running     # running | done | abandoned
hypothesis: "Layering the two channels — gaze sets a COARSE cursor anchor (updated only on a deliberate look-elsewhere), head applies a FINE relative offset — lets the user point fast AND precisely with no channel conflict, because the two are mutually gated by head motion. Concretely: gaze re-anchors the cursor only when the head is quiet AND the gaze point is far from the cursor AND settled; while the head is moving, gaze is frozen and head owns the cursor. Expected: coarse relocation in one saccade (~gaze latency) + head fine-tune to sub-cm settling (from 2026-07-08-head-pointing-closed-loop: 0.25 deg), with total acquisition faster than head-only (which was 3.25 s because head had to cover the whole screen)."
result: ""
related_concepts: [multimodal-gaze-voice, gaze-point-speech-command, head-pose-pointing, closed-loop-control, midas-touch-problem, gaze-head-pointing, area-cursor, vestibulo-ocular-reflex]
related_literature: [magic-pointing-1999, eyetap-2021, camera-mouse, eviacam, mediapipe-iris]
tags: [fusion, gaze, head-pose, closed-loop, multimodal, pointing]
---

# gaze-head-fusion

## Hypothesis

The project thesis, made concrete: **eyes point, head nudges.** The two channels
we've now characterized separately —

- gaze: coarse (~5.6° median, `../2026-07-01-webcam-gaze-accuracy/metrics.json`),
- head, closed-loop: precise (0.25° settling) but slow when it must cover the whole
  screen (3.25 s/target, `../2026-07-08-head-pointing-closed-loop/metrics.json`) —

are **complementary**. Fusing them as a layered controller should give coarse speed
+ fine precision at once:

```
cursor = gaze_anchor  +  head_offset
         └─ coarse ──┘     └── fine ──┘
```

**Why they don't conflict (the key idea).** When you fixate a point and move your
head, the **vestibulo-ocular reflex** counter-rotates the eyes to hold gaze on that
point — so the *gaze point on screen stays put* while the head pose changes. A
*saccade* is the opposite: the gaze point jumps while the head is still. The two
intents are therefore separable in the signals, and we gate on head motion:

- **Head moving → gaze frozen** (fine mode; head owns the cursor).
- **Re-anchor (gaze warp) only when: head quiet AND gaze point far from cursor AND
  settled ~100 ms.** Chosen handoff (2026-07-08): **auto-warp, head-gated** — the
  cursor teleports to the gaze point, then the head neutral re-zeros so nothing
  jumps, and the head fine-tunes from there.

This gate also sidesteps our gaze weakness: the gaze estimate is coarse and was
calibrated head-still, so it drifts when the head turns — but we never trust gaze
during head motion, so that drift is irrelevant. Gaze only has to reach the rough
neighborhood; the head does the precision.

**Prior art.** This is [[magic-pointing-1999]] (Zhai's MAGIC — Manual And Gaze
Input Cascaded — pointing) with the *head* as the fine channel instead of a hand,
and made fully hands-free. MAGIC established the core move: warp the cursor to the
gaze region, then fine-tune with a precise channel. Our head-motion gate + the
[[vestibulo-ocular-reflex]] separability is the hands-free adaptation.

## Setup

- Config: `config.yaml` — gaze calibration targets (9-pt), fusion gates
  (reanchor_dist_deg, head_quiet_degps, fixation_ms), head-cursor defaults
  (gain/filter/deadzone, inherited from the head-pointing experiment), screen
  geometry defaults.
- Code:
  - Collection/interaction is a **webapp mode** (`../../webapp/`, route `/fusion`).
    The browser runs MediaPipe FaceLandmarker, does a quick in-browser gaze
    calibration (ridge fit **client-side** — the fused cursor needs a live gaze
    point, not a server round-trip), then runs the fused cursor with head-gated
    auto-warp. Free-play + practice targets; sessions POST back for later analysis.
  - `fusion_solve.mjs` (in `webapp/static/`) — pure, dependency-free ridge fit +
    predict used by the browser; **node-testable headlessly** (see `test_solve.mjs`).
  - `analyze_fusion.py` — headless scoring of a fused session (acquisition time,
    settling, re-anchor count, mode dwell) → `metrics.json`. (Added once the feel
    is validated and a scored task is defined.)
- Data: `results/fusion_web_<ts>/` — trajectory + events (re-anchors) + `meta.json`
  (gaze calibration residual, fusion gates, head tune).

Not HCE-scoped: behavioral characterization of the control loop, no held-out split.

### How to run

1. Open **https://aiserver2026:8104/fusion** on the machine with the webcam.
2. Camera + geometry, capture **head neutral** + set head gain (your fine-tuner).
3. Do the **9-point gaze calibration** (look at each dot).
4. Free-play: look somewhere → cursor warps there when your head is still; then
   **nudge your head** to fine-tune onto the target. A debug overlay shows the gaze
   point, the anchor, head speed, and the current mode (WARP-ARMED / FINE). Live
   levers tune the gates and the head cursor.

## Result

Fill in after the first fused session. Points at `metrics.json`.

## Interpretation

Does the layered controller feel conflict-free? Is fused acquisition faster than
head-only while keeping head-only's settling?

## Diagnostics

Fill in after the run. One line per field; `n/a` rather than blank.
`next_candidates` must list ≥2 concrete one-sentence proposals.

- intended_effect_confirmed: <yes | no | partial> — <evidence with anchor>
- leakage_check: n/a (behavioral task, no train/test split)
- overfitting_signal: gaze calibration residual (calib vs live) — <finding>
- delta_from_prior: vs 2026-07-08-head-pointing-closed-loop — <acquisition-time delta> (metrics.json)
- unexpected_findings: <one or two sentences, or "none">
- next_candidates:
  - <one-sentence proposal 1>
  - <one-sentence proposal 2>

## Follow-up

- ...
