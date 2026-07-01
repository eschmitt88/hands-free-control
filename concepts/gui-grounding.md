---
kind: concept
name: "GUI Grounding"
status: seedling
added: "2026-07-01"
sources: ["llm-agents-tool-users-survey-2025"]
related_concepts: ["llm-agent-tool-use", "ui-element-targeting-overlay", "os-input-injection"]
tags: ["intent", "llm"]
---
# GUI Grounding
## Definition
Mapping natural-language intent onto on-screen UI elements so an agent can operate a graphical interface.
## Why it matters here
Desktop control means clicking the right thing; grounding is the hard perception step that connects "open the settings" to the actual pixel target, and its accuracy bounds what hands-free control can do.
## Connections
- [[llm-agent-tool-use]] — grounding is the GUI-specific case of choosing what to act on
- [[ui-element-targeting-overlay]] — overlays make grounded targets selectable by voice
- [[os-input-injection]] — once grounded, the target is actuated via synthesized input
