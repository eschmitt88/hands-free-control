---
kind: concept
name: "Dwell-free Selection"
status: seedling
added: "2026-07-01"
sources: ["eyetap-2021", "voxvisio-2016"]
related_concepts: ["midas-touch-problem", "dwell-click", "gaze-point-speech-command"]
tags: ["multimodal", "interaction"]
---
# Dwell-free Selection
## Definition
Triggering selection without gaze dwell timers — via voice, an acoustic pulse, or an explicit command — thereby avoiding dwell's latency and Midas-touch trade-offs.
## Why it matters here
Voice-triggered selection is the project's preferred commit mechanism, letting gaze point continuously while selection fires instantly and intentionally without waiting on a dwell timeout.
## Connections
- [[midas-touch-problem]] — dwell-free triggers remove the ambiguity that dwell only partially masks
- [[dwell-click]] — the timer-based alternative this concept improves upon
- [[gaze-point-speech-command]] — speech is the project's concrete dwell-free trigger
