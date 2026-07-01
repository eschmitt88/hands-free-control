---
kind: concept
name: "Gaze-steered Zoom"
status: seedling
added: "2026-07-01"
sources: ["voxvisio-2016", "magic-pointing-1999"]
related_concepts: ["coarse-to-fine-selection", "target-expansion"]
tags: ["multimodal", "interaction"]
---
# Gaze-steered Zoom
## Definition
Zooming the region under the user's gaze so that small targets become large enough for reliable gaze fine-selection.
## Why it matters here
It offers a way to hit dense small desktop controls with gaze alone by magnifying the local region, at the cost of an extra zoom interaction the voice channel could otherwise trigger.
## Connections
- [[coarse-to-fine-selection]] — zoom implements the fine stage of coarse-to-fine acquisition
- [[target-expansion]] — a closely related magnification technique acting per-target rather than per-region
