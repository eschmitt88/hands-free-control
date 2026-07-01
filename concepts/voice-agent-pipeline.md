---
kind: concept
name: "Voice Agent Pipeline"
status: seedling
added: "2026-07-01"
sources: ["vocode-core"]
related_concepts: ["streaming-asr", "barge-in-turn-taking", "llm-intent-layer"]
tags: ["voice", "architecture"]
---
# Voice Agent Pipeline
## Definition
The modular ASR->LLM->TTS loop with swappable components that underlies real-time voice agents.
## Why it matters here
This pipeline is the reference architecture for the project; framing hands-free control as swappable stages lets each component (ASR, intent, feedback) be chosen and tuned independently.
## Connections
- [[streaming-asr]] — the input stage of the loop
- [[barge-in-turn-taking]] — the turn-management behavior layered over the loop
- [[llm-intent-layer]] — the reasoning stage that turns transcripts into actions
