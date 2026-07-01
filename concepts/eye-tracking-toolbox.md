---
kind: concept
name: "Eye-tracking Toolbox"
status: seedling
added: "2026-07-01"
sources: ["pygaze"]
related_concepts: ["unified-tracker-api"]
tags: ["tooling", "gaze"]
---
# Eye-tracking Toolbox
## Definition
Software libraries for building gaze experiments and pipelines, covering calibration and event detection over tracker hardware.
## Why it matters here
Such toolboxes provide reusable calibration and event-detection plumbing, saving the project from rebuilding gaze infrastructure.
## Connections
- [[unified-tracker-api]] — the abstraction that lets a toolbox target many devices
