---
kind: concept
name: "Pronoun Disambiguation"
status: seedling
added: "2026-07-01"
sources: ["gazepointar-2024"]
related_concepts: ["deictic-reference", "gaze-context-grounding"]
tags: ["multimodal", "language"]
---
# Pronoun Disambiguation
## Definition
Resolving which entity a spoken pronoun or underspecified query refers to, using gaze, pointing, or dialogue history as the resolving signal.
## Why it matters here
It lets the system accept natural underspecified speech ("what is this?") and recover the intended object from gaze context, keeping voice commands short and conversational.
## Connections
- [[deictic-reference]] — pronouns are the deictic terms whose referents must be resolved
- [[gaze-context-grounding]] — gaze is the primary signal used to pin down the referent
