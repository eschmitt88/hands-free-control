---
kind: concept
name: "Command Grammar"
status: seedling
added: "2026-07-01"
sources: ["talon-voice", "windows-voice-access", "macos-voice-control", "serenade"]
related_concepts: ["dictation-mode", "voice-mode-switching", "scriptable-voice-commands"]
tags: ["voice", "interaction"]
---
# Command Grammar
## Definition
A defined vocabulary of spoken commands that maps utterances to discrete actions, as opposed to free-form dictation.
## Why it matters here
A grammar gives reliable, deterministic control with a bounded recognition space, and it is the fallback layer that keeps hands-free control usable when the LLM intent layer is uncertain or offline.
## Connections
- [[dictation-mode]] — the counterpart mode where utterances are typed verbatim rather than executed
- [[voice-mode-switching]] — switching between grammar and dictation resolves execute-vs-type ambiguity
- [[scriptable-voice-commands]] — user-authored grammars extend the fixed command set
