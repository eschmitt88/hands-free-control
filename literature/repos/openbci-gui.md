---
kind: repo
name: OpenBCI_GUI
url: https://github.com/OpenBCI/OpenBCI_GUI
commit: v6.0.0-beta.1 (2023-09-28)
source: raw/repos/openbci-gui.md
added: 2026-07-01
relevance: 3
status: ingested
related_experiments: []
related_concepts: [consumer-bci-hardware, dry-electrode-eeg, eeg-acquisition-software]
tags: [openbci, eeg, acquisition, visualization, open-hardware, lsl]
---

## Purpose
Official cross-platform acquisition and visualization app for OpenBCI open-
hardware boards (Cyton 8ch, Cyton+Daisy 16ch, Ganglion 4ch). The default entry
point for getting raw EEG off OpenBCI hardware and streaming it out for
downstream processing.

## Shape
- HTML/Processing/Java app; MIT-licensed; ~3400 commits, ~87 releases.
- Latest captured release v6.0.0-beta.1 (Sep 2023) — note it is a beta and the
  repo cadence looks slow; check for staleness before depending on it.

## Useful bits
- Streaming out via LSL / OSC / UDP is the key integration path — pipe live EEG
  into Python (MNE, pyriemann, custom classifiers) for a hands-free control loop.
- Serial + networking protocols, real-time filtering, custom widget framework,
  file export for offline analysis.
- Good for rapid prototyping / signal-quality inspection without writing an
  acquisition layer.

## Follow-up
- Confirm whether the Motor Imagery tutorial exists and is deprecated (candidate
  brief claims deprecation; not verified from README capture).
- Verify Ganglion channel count in docs (Ganglion is 4ch, not 8ch as one capture
  suggested).
- Assess LSL latency/jitter for a real-time control loop; check whether the beta
  release is stable enough or whether the Python "brainflow" SDK is the better
  integration surface.
