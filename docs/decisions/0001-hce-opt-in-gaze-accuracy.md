# 0001 — Opt into HCE for the webcam-gaze scope

- **Date:** 2026-07-01
- **Status:** accepted

## Context

The `webcam-gaze-accuracy` experiment has a genuine held-out evaluation:
on-screen target positions can be partitioned into calibration / validation /
test sets. Future experiments will iterate on calibration and estimation
methods, which risks overfitting to the evaluation signal across cycles.

## Decision

Opt the webcam-gaze scope into the Hidden Consistent Evaluation rule
(`~/.claude/rules/evaluation.md`). The authority is
`experiments/2026-07-01-webcam-gaze-accuracy/splits.yaml`, which partitions
target positions with `seed: 42`:

- **calibration** (3×3 grid) — fit the per-user feature→screen map.
- **validation** (4×4 interior grid) — the search signal → `metrics.json`.
- **test** (5 held-out irregular positions) — read only by the final-scoring
  pass → `final_metrics.json`; off-limits during method development.

Comparable future experiments copy this `splits.yaml` rather than redefining it.
Changing the target positions is a breaking change and requires a new decision
record.

## Consequences

- `/lint` now runs HCE checks on this project; `test/`-position access during
  search is a hard failure.
- `analyze.py` reads calibration+validation during search; `analyze.py --final`
  is the only reader of the test split.
