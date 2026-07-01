---
kind: concept
name: "Midas Touch Problem"
status: seedling
added: "2026-07-01"
sources: ["eyetap-2021", "magic-pointing-1999", "gaze-speech-scoping-review-2026", "look-and-touch-2012", "eyes-on-many-2026"]
related_concepts: ["dwell-free-selection", "gaze-suggests-x-confirms", "dwell-click"]
tags: ["multimodal", "problem"]
---
# Midas Touch Problem
## Definition
Gaze interfaces unintentionally activate whatever the eyes rest on because looking cannot be distinguished from intending to act; a separate confirmation channel resolves the ambiguity.
## Why it matters here
It is the core failure mode any gaze component in this project must avoid, and the main argument for pairing gaze with a distinct voice confirm rather than shipping gaze-only control.
## Connections
- [[dwell-free-selection]] — one class of fixes that trigger via an explicit command instead of gaze rest
- [[gaze-suggests-x-confirms]] — the design principle that structurally prevents the problem
- [[dwell-click]] — dwell is the classic but latency-prone workaround for Midas touch
