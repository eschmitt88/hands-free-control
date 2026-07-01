---
kind: concept
name: "Voice Mode Switching"
status: seedling
added: "2026-07-01"
sources: ["windows-voice-access", "macos-voice-control"]
related_concepts: ["command-grammar", "dictation-mode"]
tags: ["voice", "interaction"]
---
# Voice Mode Switching
## Definition
Explicit switching between command-only, dictation-only, and mixed modes to disambiguate whether an utterance should execute or be typed.
## Why it matters here
The execute-vs-type ambiguity is the core failure mode of voice control; a clear, low-friction mode-switch mechanism is what keeps the hands-free experience predictable.
## Connections
- [[command-grammar]] — command-only mode restricts input to the grammar
- [[dictation-mode]] — dictation-only mode routes everything to verbatim text
