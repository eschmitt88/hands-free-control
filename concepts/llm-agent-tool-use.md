---
kind: concept
name: "LLM Agent Tool Use"
status: seedling
added: "2026-07-01"
sources: ["llm-agents-tool-users-survey-2025", "openwhispr"]
related_concepts: ["llm-planning", "gui-grounding", "llm-intent-layer"]
tags: ["intent", "llm"]
---
# LLM Agent Tool Use
## Definition
LLMs interpreting instructions and invoking external tools or APIs to take actions in the world.
## Why it matters here
Hands-free control is ultimately tool invocation driven by speech; treating desktop actions as tools the LLM can call is the mechanism that makes open-ended voice commands executable.
## Connections
- [[llm-planning]] — multi-step goals require planning over sequences of tool calls
- [[gui-grounding]] — operating a GUI is a special case of tool use over on-screen elements
- [[llm-intent-layer]] — the intent layer decides which tool to call
