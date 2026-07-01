---
kind: concept
name: "Streaming ASR"
status: seedling
added: "2026-07-01"
sources: ["faster-whisper", "openwhispr", "vocode-core", "talon-voice", "serenade"]
related_concepts: ["on-device-inference", "voice-activity-detection", "voice-agent-pipeline"]
tags: ["voice", "asr"]
---
# Streaming ASR
## Definition
Low-latency incremental speech-to-text that emits partial transcripts as audio arrives, rather than waiting for an utterance to complete.
## Why it matters here
Voice is the primary control channel, so perceived responsiveness hinges on transcribing while the user is still speaking. Partial hypotheses let the system pre-stage commands and feel immediate rather than turn-based.
## Connections
- [[on-device-inference]] — streaming is what makes local, low-latency transcription viable without a round-trip to the cloud
- [[voice-activity-detection]] — VAD gates when the streaming decoder runs, trimming silence and false starts
- [[voice-agent-pipeline]] — streaming ASR is the front stage of the ASR->LLM->TTS loop
