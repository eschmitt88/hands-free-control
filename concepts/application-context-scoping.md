---
kind: concept
name: "Application Context Scoping"
status: seedling
added: "2026-07-01"
sources: ["talon-voice"]
related_concepts: ["scriptable-voice-commands"]
tags: ["voice", "interaction"]
---
# Application Context Scoping
## Definition
Activating different command sets depending on which application or window currently has focus.
## Why it matters here
The right voice command depends on context, so scoping grammars to the focused app keeps vocabularies small, unambiguous, and relevant across a whole desktop.
## Connections
- [[scriptable-voice-commands]] — scoping is the mechanism that decides which scripted commands are live
