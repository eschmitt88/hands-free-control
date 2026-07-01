---
kind: concept
name: "Meta-learned Calibration"
status: seedling
added: "2026-07-01"
sources: ["emc-gaze-2026"]
related_concepts: ["gaze-calibration", "per-session-recalibration"]
tags: ["gaze", "calibration"]
---
# Meta-learned Calibration
## Definition
Training a closed-form calibrator through episodic meta-training so that a short per-session calibration generalizes to a new user.
## Why it matters here
It shrinks calibration to a few points while retaining accuracy, cutting the setup friction that would otherwise deter hands-free gaze use.
## Connections
- [[gaze-calibration]] — the task this meta-learning approach solves more efficiently
- [[per-session-recalibration]] — benefits directly from a fast, few-shot calibrator
