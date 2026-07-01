---
kind: concept
name: "Coarse-to-fine Selection"
status: seedling
added: "2026-07-01"
sources: ["look-and-touch-2012"]
related_concepts: ["gaze-steered-zoom", "target-expansion", "gaze-cursor-positioning"]
tags: ["multimodal", "interaction"]
---
# Coarse-to-fine Selection
## Definition
A two-stage selection process in which gaze acquires the target neighborhood and a refinement step then precisely locates the target within it.
## Why it matters here
It is the standard way to reconcile gaze's low precision with the need to hit small desktop targets, structuring the project's selection flow into a fast gaze stage plus a precise commit stage.
## Connections
- [[gaze-steered-zoom]] — zoom is one refinement mechanism for the fine stage
- [[target-expansion]] — expanding the target is an alternative fine-stage aid
- [[gaze-cursor-positioning]] — gaze provides the coarse cursor placement in the first stage
