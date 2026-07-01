---
kind: concept
name: "Implicit Anchoring"
status: seedling
added: "2026-07-01"
sources: ["gavin-2021"]
related_concepts: ["gaze-context-grounding"]
tags: ["multimodal", "interaction"]
---
# Implicit Anchoring
## Definition
Inferring an action's referent from implicit signals such as gaze, rather than from an explicit manual selection.
## Why it matters here
It reduces interaction cost in hands-free control by letting the system assume the gaze target as the anchor, though it trades away the certainty of an explicit pick and so pairs best with a voice confirm.
## Connections
- [[gaze-context-grounding]] — the concrete implicit signal this project anchors on
