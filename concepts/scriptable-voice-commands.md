---
kind: concept
name: "Scriptable Voice Commands"
status: seedling
added: "2026-07-01"
sources: ["talon-voice"]
related_concepts: ["command-grammar", "application-context-scoping"]
tags: ["voice", "extensibility"]
---
# Scriptable Voice Commands
## Definition
A user-extensible command system (e.g. .talon files plus a Python API) for defining custom grammars and actions, with per-application scoping.
## Why it matters here
Power users and accessibility users need to bend the controller to their own workflows; a scriptable layer turns a fixed grammar into an open platform for custom hands-free control.
## Connections
- [[command-grammar]] — scripting is how users grow the base grammar
- [[application-context-scoping]] — scripted commands are commonly activated per focused app
