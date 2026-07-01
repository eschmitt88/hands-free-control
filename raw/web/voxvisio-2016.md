source: https://www.resna.org/sites/default/files/conference/2016/cac/rozado.html
fetched: 2026-07-01
title: "VoxVisio — Combining Gaze and Speech for Accessible HCI"

# VoxVisio (RESNA 2016)

ACCESS NOTE: Full page text captured via WebFetch. Access level: full.

## Metadata
- Authors: David Rozado, Alexander McNeill, Daniel Mazur
- Institution: Otago Polytechnic
- Venue: RESNA/NCART 2016
- Open-source code: https://github.com/AlexanderMcNeill/voxvisio

## Abstract (verbatim from page)
The software intended to help motor impaired subjects to efficiently interact
with a computer hands-free by combining gaze and speech interaction. Users gaze
at interface objects and trigger a target-specific action by carrying out a
specific speech command. The system supports customizable mappings for
interactions including left mouse click, right mouse click or page scroll. The
authors claim the approach holds the potential to improve the performance of
traditional accessibility options such as speech-only interaction and gaze-only
interaction.

## System details (captured)
- Target population: users with motor disabilities unable to use standard mice
  and keyboards (spinal cord injury, motor neuron disease, muscular dystrophy).
- Combines gaze pointing with speech commands for hands-free control.
- Implements an automatic zoom mechanism triggered after a speech command to
  facilitate selection of small targets (gaze-steered zoom for fine selection).
- Two modes: command mode (clicking, scrolling, copying) and dictation mode
  (text input). Customizable command-to-action mapping via a GUI.
- Hardware: Tobii Eye X eye tracker (30 fps), SpeechWare USB TableMike mic.
- Software: Dragon NaturallySpeaking or Windows Speech Recognition for voice.

## Evaluation status
No quantitative evaluation presented. Authors state (verbatim): "We shall
investigate this proposition in future work by empirically comparing the
VoxVisio system to gaze only interaction, voice only interaction and the
traditional baseline of mouse and keyboard-based interaction."
