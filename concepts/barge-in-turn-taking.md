---
kind: concept
name: "Barge-in & Turn-taking"
status: seedling
added: "2026-07-01"
sources: ["vocode-core"]
related_concepts: ["voice-agent-pipeline", "streaming-asr"]
tags: ["voice", "dialogue"]
---
# Barge-in & Turn-taking
## Definition
Interruption handling and endpointing that let a user speak over a voice system and have it yield the turn.
## Why it matters here
A controller that talks back must stop the instant the user issues a new command; good barge-in is what keeps hands-free interaction feeling responsive rather than sluggish and one-sided.
## Connections
- [[voice-agent-pipeline]] — turn-taking is a cross-cutting behavior of the ASR->LLM->TTS loop
- [[streaming-asr]] — early partial transcripts are what let the system detect and honor an interruption fast
