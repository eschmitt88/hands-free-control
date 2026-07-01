---
kind: concept
name: "Gaze Cursor Positioning"
status: seedling
added: "2026-07-01"
sources: ["look-and-touch-2012", "eyetracking-voice-disabled-limbs-2022"]
related_concepts: ["webcam-gaze-tracking", "coarse-to-fine-selection", "target-expansion"]
tags: ["pointing", "gaze"]
---
# Gaze Cursor Positioning
## Definition
Driving a screen cursor from eye-tracking, which is fast to move but imprecise for small targets.
## Why it matters here
Its speed-but-imprecision profile is the core motivation for pairing gaze with voice, letting gaze get near and voice finish the selection.
## Connections
- [[webcam-gaze-tracking]] — the commodity-camera source of the gaze signal
- [[coarse-to-fine-selection]] — the strategy that compensates for gaze imprecision
- [[target-expansion]] — a technique that makes small targets reachable by gaze
