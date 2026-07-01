---
kind: concept
name: "Voice Activity Detection"
status: seedling
added: "2026-07-01"
sources: ["faster-whisper", "serenade"]
related_concepts: ["wake-word-detection", "streaming-asr"]
tags: ["voice", "asr"]
---
# Voice Activity Detection
## Definition
Detecting speech versus silence or noise in an audio stream to gate transcription and suppress false triggers.
## Why it matters here
An always-listening controller wastes compute and misfires on background noise; VAD is the cheap first filter that decides when the heavier ASR pipeline should even run.
## Connections
- [[wake-word-detection]] — both gate a heavier pipeline, VAD on energy/speech presence and wake-word on a specific phrase
- [[streaming-asr]] — VAD segments the stream that the streaming decoder consumes
