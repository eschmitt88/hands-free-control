---
kind: repo
name: faster-whisper
url: https://github.com/SYSTRAN/faster-whisper
commit: unknown (fetched 2026-07-01)
source: https://github.com/SYSTRAN/faster-whisper
added: 2026-07-01
relevance: 5
status: scanned
related_experiments: []
related_concepts: [streaming-asr, local-on-device-inference, voice-activity-detection]
tags: [asr, whisper, ctranslate2, quantization, vad, local-inference]
---

## Purpose

CTranslate2-based reimplementation of OpenAI Whisper for fast, low-memory speech
recognition at parity accuracy. The obvious ASR backbone for a hands-free
desktop-control system that needs local, low-latency transcription of spoken
commands.

## Shape

Python package (`pip install faster-whisper`), MIT-licensed. Wraps CTranslate2
inference over Whisper checkpoints auto-downloaded from HuggingFace Hub. Ships
word-level timestamps, Silero-VAD filtering, batched pipeline, and Distil-Whisper
support. GPU path needs cuBLAS + cuDNN 9 (CUDA 12); no FFmpeg dependency (PyAV
decodes audio internally). Python 3.9+.

## Useful bits

- ~4x wall-clock speedup vs reference Whisper at equal memory: 13-min audio in
  1m03s (GPU large-v2 fp16 bs5) vs 2m23s; batched bs8 hits 17s. CPU small model
  2m37s vs 6m58s.
- int8 / fp16 quantization drops CPU memory to ~1,477MB — matters for running ASR
  alongside a desktop-control agent on a single machine.
- Built-in Silero VAD filtering aligns with wake-word / turn-taking needs;
  word-level timestamps enable barge-in and partial-command handling.
- "Streaming" is via community integrations, not first-party — a gap to verify if
  low-latency partial transcripts are required.

## Follow-up

- Confirm which community streaming wrapper gives the lowest first-token latency
  on the RTX 5080 box.
- Benchmark int8 CPU vs GPU fp16 latency for short command utterances (not the
  13-min batch case).
