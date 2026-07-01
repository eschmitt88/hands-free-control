---
kind: repo
name: openwhispr
url: https://github.com/OpenWhispr/openwhispr
commit: unknown (fetched 2026-07-01)
source: https://github.com/OpenWhispr/openwhispr
added: 2026-07-01
relevance: 5
status: scanned
related_experiments: []
related_concepts: [desktop-dictation-injection, local-on-device-inference, llm-agent-tool-use]
tags: [dictation, electron, whisper, parakeet, mcp, text-injection, privacy]
---

## Purpose

Cross-platform desktop dictation app that is close to the exact end-to-end shape
this project studies: global hotkey -> local ASR -> inject transcribed text (or
actions) at the cursor in any application. A direct reference implementation of the
"hands-free desktop control" loop.

## Shape

Electron 41 + React 19 + TypeScript, MIT-licensed. Local ASR via Whisper or NVIDIA
Parakeet (fully offline); optional cloud ASR via BYO key (OpenAI, Anthropic,
Gemini, Groq). Ships as .dmg/.exe/.AppImage/.deb/.rpm/.tar.gz across macOS
(ARM+Intel), Windows, Linux. Privacy-first: no telemetry, audio stays on-device
with local models.

## Useful bits

- Text-injection-at-cursor mechanism is the load-bearing OS-integration piece for
  hands-free control — worth reading their platform-specific injection code.
- "AI agent interaction with voice commands" + MCP server integration shows a path
  from dictation to command/action execution, not just transcription.
- Parakeet as a local alternative to Whisper is a second ASR backbone to benchmark
  against faster-whisper.
- Local speaker diarization / voice fingerprinting could support user-gated control
  (only the owner's voice drives the machine).

## Follow-up

- Read the cursor-injection implementation per OS (accessibility APIs, synthetic
  keystrokes) — the trickiest cross-platform part.
- Compare Parakeet vs faster-whisper latency/accuracy for short command
  utterances.
- Inspect the MCP integration to see how voice maps to tool calls / actions.
