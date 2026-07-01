---
kind: concept
name: "Wake-word Detection"
status: seedling
added: "2026-07-01"
sources: ["openwakeword"]
related_concepts: ["voice-activity-detection", "speech-embedding-backbone"]
tags: ["voice", "asr"]
---
# Wake-word Detection
## Definition
Always-on keyword spotting that gates a heavier ASR/LLM pipeline, firing only when a specific trigger phrase is heard.
## Why it matters here
A hands-free system that acts on every utterance is unusable; a wake word gives the user an explicit, cheap on-switch so the controller only engages when addressed.
## Connections
- [[voice-activity-detection]] — complementary gates; VAD detects any speech, wake-word detects a particular phrase
- [[speech-embedding-backbone]] — wake-word classifiers ride on top of a shared frozen embedding
