---
kind: concept
name: "Grid-overlay Targeting"
status: seedling
added: "2026-07-01"
sources: ["windows-voice-access", "macos-voice-control"]
related_concepts: ["ui-element-targeting-overlay", "number-overlay-targeting"]
tags: ["targeting", "interaction"]
---
# Grid-overlay Targeting
## Definition
Superimposing a numbered, recursively drillable grid so the user can voice-target any pixel with coordinate precision.
## Why it matters here
It handles targets that have no addressable UI element, and its multi-step drilling is exactly the friction gaze can shortcut by pre-placing the region.
## Connections
- [[ui-element-targeting-overlay]] — the general overlay pattern this specializes
- [[number-overlay-targeting]] — the element-based sibling used when a target is discrete
