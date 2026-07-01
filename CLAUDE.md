# Project: hands-free-control

Short orientation only. User-level `~/.claude/CLAUDE.md` holds the durable
principles; this file refines them for this project.

## What this project is about

Building hands-free desktop control for an able-bodied user with a webcam and
mic. Working thesis (from the 2026-07-01 prior-art survey): **voice is the
primary channel with an LLM intent layer; gaze/head tracking provides coarse
pointing; the two combine as "gaze points, voice confirms."** Consumer EEG/BCI
was surveyed and parked (bandwidth ceiling ~30 bits/min). See
`mocs/multimodal-gaze-voice.md` for the spine.

## Layout (see user CLAUDE.md for the full rationale)

- `raw/` — immutable source material. Read only.
- `literature/` — processed notes on papers, repos, posts.
- `concepts/` — atomic ideas. Promote to `mocs/` when ≥5 cluster.
- `experiments/YYYY-MM-DD-<slug>/` — self-contained runs.
- `docs/decisions/` — lightweight ADRs.
- `journal/` — daily session files (hook-written).
- `_meta/` — index, log, templates.

## Scoped rules

Detailed conventions live in `.claude/rules/` and are auto-loaded when you
touch matching paths:

@.claude/rules/experiments.md
@.claude/rules/notebooks.md
@.claude/rules/data.md

## Budget & compute

Autonomous runs read `budget.yaml` at this project's root for hard
ceilings (wall time, tokens, disk) and model roles (ideator vs
implementer). Before proposing anything with non-trivial resource
demands — multi-hour training, large downloads, many seeds — read
`budget.yaml` and make sure the ask fits under the remaining headroom.
If it doesn't fit, say so in the proposal's `risks:` and either scope
down or explicitly flag the need to raise a ceiling.

@budget.yaml

## Project-specific facts

- Primary language: (fill in)
- Environment: managed by `uv`; run `make env` to sync.
- Data: tracked by DVC. Large artifacts on SN850X via `~/projects/`.

## Housekeeping

- End sessions with `/wrap`. The SessionEnd hook backstops this.
- Use `/new-experiment <slug>` — don't hand-roll experiment folders.
- Run `/lint` weekly.
