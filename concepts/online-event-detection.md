---
kind: concept
name: "Online Event Detection"
status: seedling
added: "2026-07-01"
sources: ["pygaze"]
related_concepts: ["gaze-cursor-positioning"]
tags: ["gaze", "signal"]
---
# Online Event Detection
## Definition
Real-time detection of gaze events such as fixations and saccades to drive gaze-contingent interaction.
## Why it matters here
Distinguishing a settled fixation from transit is what lets the system decide when gaze is genuinely pointing versus merely scanning.
## Connections
- [[gaze-cursor-positioning]] — consumes detected fixations to place and steady the cursor
