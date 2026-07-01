---
kind: repo
name: vocode-core
url: https://github.com/vocodedev/vocode-core
commit: unknown (fetched 2026-07-01)
source: https://github.com/vocodedev/vocode-core
added: 2026-07-01
relevance: 4
status: scanned
related_experiments: []
related_concepts: [voice-agent-pipeline, barge-in-turn-taking, streaming-asr]
tags: [voice-agents, asr-llm-tts, interruption, streaming, telephony, langchain]
---

## Purpose

Modular Python library for real-time streaming voice LLM agents: a full
ASR -> LLM -> TTS conversational loop with interruption handling. Relevant as the
reference architecture for the conversational / turn-taking layer of hands-free
control, even though its primary use case is telephony rather than desktop control.

## Shape

`pip install vocode`, MIT-licensed. Standard three-stage pipeline with swappable
components: transcription (Whisper, Deepgram, AssemblyAI, Google, Azure), LLM
(OpenAI, Anthropic), synthesis (Eleven Labs, Azure, Play.ht, Polly, Coqui).
Integrates with Langchain agents. Runs off mic/system audio or telephony
(inbound/outbound calls, Zoom dial-in). Configured via env vars + provider API
keys.

## Useful bits

- Built-in interruption handling via punctuation-based endpointing + audio
  management — the concrete barge-in / turn-taking mechanism worth studying for a
  voice controller that must yield when the user speaks over it.
- Clean swappable ASR/LLM/TTS boundary is a good architectural template even if we
  drop TTS (desktop control may not need to speak back).
- Provider-agnostic, so faster-whisper (local) could slot in as the ASR stage to
  keep the loop offline.

## Follow-up

- Read the interruption/endpointing module — the mechanism transfers directly to
  barge-in for hands-free control.
- Assess whether the telephony-centric abstractions add unwanted overhead for a
  local desktop mic loop; possibly borrow the interruption logic only.
