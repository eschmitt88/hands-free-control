---
kind: concept
name: "Speech-to-action Mapping"
status: seedling
added: "2026-07-01"
sources: ["voicepilot-2024", "serenade"]
related_concepts: ["llm-intent-layer", "os-input-injection", "gui-grounding"]
tags: ["intent", "llm"]
---
# Speech-to-action Mapping
## Definition
Mapping a spoken request to an executable action in a target system, whether a GUI operation or a robot command.
## Why it matters here
This mapping is the payoff of the whole pipeline: it is where a recognized intent becomes an actual change on the desktop, and its reliability determines whether hands-free control is trustworthy.
## Connections
- [[llm-intent-layer]] — supplies the structured intent this stage executes
- [[os-input-injection]] — one concrete actuation path for a mapped action
- [[gui-grounding]] — grounding resolves which on-screen element the action targets
