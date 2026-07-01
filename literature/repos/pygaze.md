---
kind: repo
name: "PyGaze"
url: https://github.com/esdalmaijer/PyGaze
commit: null
source: "raw/repos/pygaze.md"
added: "2026-07-01"
relevance: 3
status: scanned
related_experiments: []
related_concepts: [gaze-calibration, eye-tracking-toolbox, unified-tracker-api, online-event-detection]
tags: [eye-tracking, python, toolbox, gpl, gaze, experiment-software]
---

# PyGaze

## Purpose
Open-source, cross-platform Python toolbox for minimal-effort programming of
eye-tracking experiments. Gives one unified API across research-grade
eye-trackers so gaze-contingent and non-gaze-contingent studies can be written
without vendor-specific code.

## Shape
- Language: Python (100%), GPLv3. Install via `pip install python-pygaze`.
- Core `pygaze` module + OpenSesame plugins + examples + helper libs.
- Vendor backends for major research trackers (EyeLink, SMI, Tobii, GazePoint,
  etc.); README does not enumerate brands but the abstraction is the point.
- ~765 stars / ~214 forks / ~401 commits on master; no tagged releases.
- Reference: Dalmaijer, Mathot & Van der Stigchel (2013), Behavior Research Methods.

## Useful bits
- Unified tracker API — a template for abstracting over multiple gaze/head input
  devices behind one interface, relevant to a pluggable hands-free control layer.
- Online / real-time event detection for gaze-contingent behavior.
- Calibration handling patterns worth borrowing for a webcam-gaze pipeline.

## Follow-up
- Aimed at research-grade hardware trackers, not commodity-webcam gaze — assess
  whether its API abstraction (or calibration/event-detection code) is reusable
  for a webcam-only stack, or if it is only a design reference.
- Pin a commit hash if the repo is adopted as a dependency.
