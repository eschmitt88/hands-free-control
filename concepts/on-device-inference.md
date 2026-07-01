---
kind: concept
name: "On-device Inference"
status: seedling
added: "2026-07-01"
sources: ["faster-whisper", "openwakeword", "openwhispr", "talon-voice", "windows-voice-access"]
related_concepts: ["streaming-asr", "in-browser-inference"]
tags: ["voice", "privacy"]
---
# On-device Inference
## Definition
Running ASR and LLM models locally and offline so that no audio ever leaves the machine, trading cloud scale for privacy and latency.
## Why it matters here
A hands-free desktop controller listens continuously, so keeping audio on-device is both a privacy requirement and the only way to hit the latency budget for real-time control.
## Connections
- [[streaming-asr]] — local models must stream to feel responsive without cloud offload
- [[in-browser-inference]] — the browser is one deployment target for the same on-device principle
