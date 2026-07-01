---
kind: concept
name: "Unified Tracker API"
status: seedling
added: "2026-07-01"
sources: ["pygaze"]
related_concepts: ["eye-tracking-toolbox"]
tags: ["tooling", "gaze"]
---
# Unified Tracker API
## Definition
A single abstraction that exposes one API across many eye-tracking and input devices.
## Why it matters here
It lets the project swap between a webcam estimator and dedicated trackers without rewriting the control layer, easing evaluation and portability.
## Connections
- [[eye-tracking-toolbox]] — the toolbox that provides and depends on this abstraction
