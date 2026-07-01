---
kind: repo
name: openWakeWord
url: https://github.com/dscripka/openWakeWord
commit: unknown (fetched 2026-07-01)
source: https://github.com/dscripka/openWakeWord
added: 2026-07-01
relevance: 5
status: scanned
related_experiments: []
related_concepts: [wake-word-detection, speech-embedding-backbone, local-on-device-inference]
tags: [wake-word, keyword-spotting, onnx, synthetic-training, low-power, vad]
---

## Purpose

Open-source wake-word / keyphrase detector that gates an always-listening
pipeline. For hands-free desktop control this is the low-cost front door: a wake
word triggers the heavier ASR + intent stack so the machine isn't transcribing
continuously.

## Shape

`pip install openwakeword`, Apache-2.0 code. Three-stage architecture: ONNX
melspectrogram preprocessing -> frozen Google speech-embedding backbone
(re-implemented from TFHub) -> small learnable FC/RNN classifier per wake word.
The frozen shared backbone means each new wake word adds only a tiny classifier,
so many models run concurrently. Pre-trained models: alexa, hey mycroft, hey
jarvis, hey rhasspy, current weather, timers (English only). Note: pre-trained
model weights are CC BY-NC-SA 4.0 (non-commercial) — a licensing constraint
distinct from the Apache code.

## Useful bits

- Runs 15-20 models real-time on a single Raspberry Pi 3 core — negligible cost on
  a desktop, leaving headroom for ASR + agent.
- Fully synthetic TTS training + 30,000h negative corpus; automated notebooks let
  you mint a custom wake word (e.g. a project-specific trigger) without recording
  audio.
- Target ops point: <0.5 false-activations/hour, <5% false-reject, benchmarked on
  the Dinner Party Corpus (far-field). Realistic numbers for a desk mic.
- VAD integration and optional speaker-specific verifier models reduce false
  positives — relevant for barge-in and multi-person rooms.
- For MCU/ultra-low-power targets the author points to microWakeWord instead.

## Follow-up

- Non-commercial model license: check whether a custom-trained model (own TTS +
  negatives) sidesteps the CC-NC restriction for any eventual distribution.
- Prototype a custom wake word for the desktop-control trigger and measure
  false-accept on a real desk-mic recording.
