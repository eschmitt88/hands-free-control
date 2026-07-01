---
kind: concept
name: "LLM Intent Layer"
status: seedling
added: "2026-07-01"
sources: ["voicepilot-2024", "openwhispr"]
related_concepts: ["speech-to-action-mapping", "llm-agent-tool-use"]
tags: ["intent", "llm"]
---
# LLM Intent Layer
## Definition
Using an LLM to translate free natural-language speech, plus user preferences, into structured actions or commands, rather than relying on a fixed grammar.
## Why it matters here
It is the bridge from natural speech to executable control; the LLM intent layer is what lets users say what they want in their own words instead of memorizing a rigid command set.
## Connections
- [[speech-to-action-mapping]] — the intent layer produces the structured action to be mapped and executed
- [[llm-agent-tool-use]] — structured intents are often realized as tool/API calls
