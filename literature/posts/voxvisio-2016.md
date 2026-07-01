---
kind: post
title: "VoxVisio — Combining Gaze and Speech for Accessible HCI"
author: "David Rozado, Alexander McNeill, Daniel Mazur"
url: https://www.resna.org/sites/default/files/conference/2016/cac/rozado.html
source: "raw/web/voxvisio-2016.md"
added: "2026-07-01"
relevance: 4
related_experiments: []
related_concepts: [gaze-point-speech-command, gaze-steered-zoom, dwell-free-selection, assistive-hands-free-access]
tags: [gaze, speech, accessibility, open-source, motor-impairment]
---

# VoxVisio — Combining Gaze and Speech for Accessible HCI

## TL;DR

Open-source hands-free desktop control for motor-impaired users: gaze points at
interface objects and a spoken command fires the action (left/right click,
scroll), with an automatic post-command zoom to make small targets selectable.

## Key points

- Directly on-target for this project: gaze = pointing, speech = action command,
  aimed at hands-free desktop control for users with spinal cord injury, motor
  neuron disease, or muscular dystrophy.
- **Gaze-steered zoom**: after a speech command, the region under gaze zooms to
  make small targets selectable — the fine-selection mechanism (vs MAGIC's manual
  actuator or EyeTAP's acoustic pulse).
- Two modes: command mode (click/scroll/copy) and dictation mode (text entry);
  command-to-action mapping is user-customizable via a GUI.
- Hardware: Tobii Eye X (30 fps) + SpeechWare TableMike; software leans on Dragon
  NaturallySpeaking or Windows Speech Recognition.
- Open source: https://github.com/AlexanderMcNeill/voxvisio
- No empirical evaluation in the paper; authors defer a comparison against
  gaze-only, voice-only, and mouse+keyboard baselines to future work.
- RESNA 2016 conference paper (assistive-tech venue), Otago Polytechnic — lower
  formal-evidence bar than the peer-reviewed journal/CHI work, but a concrete,
  inspectable open-source reference implementation.

## Follow-up

- Inspect the GitHub repo for the command-mapping and zoom implementation as a
  reference architecture for a hands-free desktop prototype.
- Run the empirical comparison the authors skipped (gaze+speech vs gaze-only vs
  voice-only vs mouse+keyboard) — a ready-made experiment design.
