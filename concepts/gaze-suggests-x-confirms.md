---
kind: concept
name: "Gaze Suggests, X Confirms"
status: seedling
added: "2026-07-01"
sources: ["look-and-touch-2012"]
related_concepts: ["gaze-point-speech-command", "dwell-free-selection", "midas-touch-problem"]
tags: ["multimodal", "design-principle"]
---
# Gaze Suggests, X Confirms
## Definition
A design principle in which gaze provides fast coarse targeting (the "suggest") and a second modality such as voice or touch provides the deliberate commit (the "confirm").
## Why it matters here
It gives the project a clean division of labor: gaze proposes a target continuously while voice commits deliberately, keeping the fast channel free of accidental activations.
## Connections
- [[gaze-point-speech-command]] — the project's speech-as-confirm realization of this principle
- [[dwell-free-selection]] — an explicit confirm replaces dwell as the commit mechanism
- [[midas-touch-problem]] — separating suggest from confirm is precisely what defeats Midas touch
