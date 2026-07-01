---
kind: concept
name: "Dictation Mode"
status: seedling
added: "2026-07-01"
sources: ["talon-voice", "windows-voice-access", "macos-voice-control"]
related_concepts: ["command-grammar", "voice-mode-switching", "spelling-mode"]
tags: ["voice", "interaction"]
---
# Dictation Mode
## Definition
A voice mode that transcribes speech verbatim into text unless an utterance is recognized as a command.
## Why it matters here
Much hands-free work is text entry (email, code, chat), so the controller needs a verbatim mode that still yields to commands, and getting that execute-vs-type boundary right is central to the interaction design.
## Connections
- [[command-grammar]] — the two modes trade off between typing words and executing actions
- [[voice-mode-switching]] — explicit switching disambiguates when speech should be typed
- [[spelling-mode]] — a narrow dictation variant for characters ASR mishears
