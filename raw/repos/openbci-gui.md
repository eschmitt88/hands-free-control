source: https://github.com/OpenBCI/OpenBCI_GUI
fetched: 2026-07-01
title: OpenBCI_GUI

# OpenBCI_GUI

Cross-platform (macOS, Windows, Linux) application to visualize and acquire
brainwave data from OpenBCI open-hardware boards.

## Supported hardware
- Ganglion (4 channels) [candidate brief; repo capture stated 8 for Ganglion
  which is inaccurate — Ganglion is a 4-channel board]
- Cyton (8 channels)
- Cyton + Daisy expansion (16 channels)

## Features
- Real-time visualization and filtering.
- Networking: UDP, OSC, LSL, Serial.
- Custom widget framework for building experiments.
- Data export to file for offline analysis.
- Native cross-platform app; low install friction for researchers/hackers/students.

## Tech / license
- HTML (~58%), Processing (~20%), Java (~20%), minor Python/CSS/JS.
- License: MIT.
- Latest release captured: v6.0.0-beta.1 (2023-09-28); ~87 releases, ~3401
  commits on master.

## Motor Imagery / deprecation
- No Motor Imagery tutorial content surfaced in the fetched README. The candidate
  brief flags an existing Motor Imagery tutorial as deprecated; not confirmed
  from this capture.
