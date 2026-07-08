---
kind: concept
name: "Vestibulo-ocular Reflex (VOR)"
status: seedling
added: "2026-07-08"
sources: ["magic-pointing-1999", "eyetap-2021"]
related_concepts: ["gaze-head-pointing", "head-pose-pointing", "multimodal-gaze-voice", "midas-touch-problem"]
tags: ["physiology", "fusion", "gaze"]
---
# Vestibulo-ocular Reflex (VOR)
## Definition
A fast (~10 ms) reflex that counter-rotates the eyes opposite to head movement to keep gaze stable on a fixated point. Foundational oculomotor physiology.
## Why it matters here
The VOR is what makes gaze and head *separable control signals*: when you fixate a target and move your head, the eyes counter-rotate so the **gaze point on screen stays fixed while the head pose changes** — the opposite of a saccade (gaze point jumps, head still). This separability is the basis for the head-gated auto-warp fusion (`experiments/2026-07-08-gaze-head-fusion`): freeze gaze while the head moves, re-anchor only when the head is quiet. It resolves the channel-conflict worry in [[gaze-head-pointing]].
## Connections
- [[gaze-head-pointing]] — the fused channel VOR makes conflict-free
- [[head-pose-pointing]] — the fine channel active during VOR-stabilized fixation
- [[multimodal-gaze-voice]] — the broader thesis of layered complementary channels
- [[midas-touch-problem]] — head-gating plus VOR limits unintended gaze-driven jumps
