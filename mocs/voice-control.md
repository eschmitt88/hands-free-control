---
kind: moc
name: "Voice Control"
status: growing
added: "2026-07-01"
tags: [voice, asr, intent]
---

# Voice Control — the primary channel

Voice is the most mature hands-free modality and the project's anchor. The
survey's clearest lesson: the hard problems are already solved by shipping
systems (Talon, Windows Voice Access, macOS Voice Control) — the novel work is
an **LLM intent layer** on top of a proven ASR + targeting substrate.

## The listening pipeline

- [[wake-word-detection]] → [[voice-activity-detection]] → [[streaming-asr]] —
  the always-listening front-end that gates heavier processing.
- [[speech-embedding-backbone]] — shared backbone making many wake-words cheap.
- [[on-device-inference]] — keep it local for privacy and latency (faster-whisper).
- [[voice-agent-pipeline]] · [[barge-in-turn-taking]] — the ASR→LLM→TTS loop and
  the interruption handling a responsive agent needs.

## Command vs dictation

- [[command-grammar]] vs [[dictation-mode]] — the fundamental split: execute an
  action vs type text.
- [[voice-mode-switching]] — disambiguate which one you mean.
- [[spelling-mode]] — character-by-character entry for what ASR mishears.
- [[scriptable-voice-commands]] · [[application-context-scoping]] — Talon's
  extensibility model: user-defined grammars scoped per app.
- [[noise-input-control]] — non-speech mouth sounds as fast discrete clicks.

## The intent layer (the project's novel angle)

- [[llm-intent-layer]] — LLM turns free natural language into structured actions,
  replacing rigid grammars.
- [[speech-to-action-mapping]] · [[llm-agent-tool-use]] · [[llm-planning]] —
  interpret, plan, call tools.
- [[gui-grounding]] · [[os-input-injection]] — land the action on a real UI
  element and synthesize the OS event.
- [[voice-coding]] — the demanding special case (Serenade, Talon).

## The targeting problem

Clicking an arbitrary UI element by voice is solved by overlays — see the
[[gaze-head-pointing]] and [[multimodal-gaze-voice]] MoCs, plus
[[ui-element-targeting-overlay]], [[number-overlay-targeting]], and
[[grid-overlay-targeting]]. Copy this pattern; don't reinvent it.
