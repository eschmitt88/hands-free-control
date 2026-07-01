---
kind: concept
name: "Multimodal Fusion"
status: seedling
added: "2026-07-01"
sources: ["gaze-speech-scoping-review-2026", "put-that-there-1980", "gazepointar-2024", "eyes-on-many-2026"]
related_concepts: ["mutual-disambiguation", "gaze-point-speech-command"]
tags: ["multimodal", "architecture"]
---
# Multimodal Fusion
## Definition
Combining two or more input streams — such as gaze/pointing and speech — into a single interpreted command, where temporal alignment of the streams is the core technical challenge.
## Why it matters here
Fusing the gaze pointer with the speech command into one intent is the central engineering problem of the system, and getting the timing window right is what makes the pattern feel responsive.
## Connections
- [[mutual-disambiguation]] — a key payoff of fusion is that each stream resolves the other's ambiguity
- [[gaze-point-speech-command]] — the specific fusion the project implements
