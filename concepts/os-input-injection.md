---
kind: concept
name: "OS Input Injection"
status: seedling
added: "2026-07-01"
sources: ["serenade"]
related_concepts: ["speech-to-action-mapping", "gui-grounding"]
tags: ["intent", "systems"]
---
# OS Input Injection
## Definition
Programmatically synthesizing OS-level keyboard and mouse events to actuate control decisions.
## Why it matters here
It is the final actuator of hands-free control, letting the system drive any application the way a physical keyboard and mouse would, without needing per-app integrations.
## Connections
- [[speech-to-action-mapping]] — injection is a concrete execution backend for mapped actions
- [[gui-grounding]] — grounding supplies the coordinates and targets injection acts on
