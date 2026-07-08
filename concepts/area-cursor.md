---
kind: concept
name: "Area Cursor / Target Gravity"
status: seedling
added: "2026-07-08"
sources: ["magic-pointing-1999"]
related_concepts: ["coarse-to-fine-selection", "dwell-click", "gaze-head-pointing", "midas-touch-problem"]
tags: ["targeting", "pointing"]
---
# Area Cursor / Target Gravity
## Definition
Enlarging a pointer's effective activation region — snap-to-nearest-target, a gravity well around targets, or an area (rather than point) cursor — so an imprecise pointer can reliably select small targets.
## Why it matters here
It is the direct antidote to coarse gaze (~5.6°, `experiments/2026-07-01-webcam-gaze-accuracy`): with element-latching, a cursor only needs to land in a target's basin, not on its center. Flagged as the next lever to cut fused acquisition time once the gaze+head handoff feels right.
## Connections
- [[coarse-to-fine-selection]] — the broader strategy area cursors implement
- [[dwell-click]] — pairs with latching to confirm the snapped target
- [[gaze-head-pointing]] — the coarse channel that benefits most from target facilitation
- [[midas-touch-problem]] — latching must avoid snapping to unintended targets
