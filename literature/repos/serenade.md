---
kind: repo
name: "serenadeai/serenade"
url: https://github.com/serenadeai/serenade
commit:
source: "raw/repos/serenade.md"
added: "2026-07-01"
relevance: 5
status: scanned
related_experiments: []
related_concepts: [voice-coding, speech-to-code-mapping, syntax-aware-editing, command-grammar, streaming-asr, voice-activity-detection, os-input-injection]
tags: [voice-coding, open-source, apache-2.0, ide-plugin, hands-free]
---
# serenadeai/serenade

## Purpose
Open-source (Apache-2.0) voice-coding stack that maps natural-speech commands to structured, syntax-aware code edits rather than raw dictation. Splits the problem into a speech engine (speech → commands) and a code engine (commands → structured edits), delivered through editor plugins. Directly relevant as an end-to-end reference architecture for a hands-free coding/control project.

## Shape
- **Monorepo**, primarily Java (~60%) + TypeScript (~29%), with Python (~4%) and C++ (~3%); ANTLR for grammar definitions.
- Core components: **Speech Engine** (voice → actionable commands), **Code Engine** (commands → structured / syntax-aware code edits), **Client** (orchestrator), **Online Services** (backend speech/code/app logic).
- **Editor plugins** live in separate repos: VS Code, Atom, JetBrains IDEs, Chrome, Hyper, iTerm2.
- License Apache-2.0; `/docs` in-repo; Discord community. Note: Serenade was effectively discontinued as a commercial service, so the online-services backend may be non-functional — treat as an architecture reference, not a running product.

## Useful bits
- **Reusable published packages**: `speech-recorder` (cross-platform mic access + voice activity detection) and `serenade-driver` (OS-level keyboard/mouse hooks / input injection). Both are directly liftable for a hands-free control project regardless of the rest of the stack.
- **ANTLR grammar** approach to defining the voice command language — a concrete grammar-engineering example.
- Clean speech-engine / code-engine separation is a transferable design boundary (intent recognition vs domain execution).

## Follow-up
- Pin the current default-branch commit hash on next scan (frontmatter `commit:` left blank).
- Evaluate `speech-recorder` and `serenade-driver` as standalone dependencies.
- Study the ANTLR grammar + code-engine mapping as a model for structured (non-dictation) edits.
- Confirm whether the self-hostable stack still runs without the shut-down cloud backend.
