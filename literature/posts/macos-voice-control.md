---
kind: post
title: "Use Voice Control commands on Mac"
author: Apple (support.apple.com)
url: https://support.apple.com/guide/mac-help/use-voice-control-commands-mh40719/mac
source: "raw/web/macos-voice-control.md"
added: "2026-07-01"
relevance: 5
related_experiments: []
related_concepts: [command-grammar, dictation-mode, spelling-mode, number-overlay-targeting, grid-overlay-targeting, ui-element-targeting-overlay, voice-mode-switching, phonetic-alphabet-input]
tags: [voice-control, hands-free, accessibility, macos, desktop-control, voice-coding]
---
# Use Voice Control commands on Mac

## TL;DR
macOS Voice Control is Apple's first-party hands-free system: a categorized fixed command set plus numbered/name labels and a recursive numbered grid overlay to click any on-screen element. It distinguishes dictation, spelling, command, and a Swift code-formatting mode, and integrates with VoiceOver. It is the macOS counterpart to Windows Voice Access, with a similar overlay-targeting design.

## Key points
- **Overlay targeting, two flavors** — "Show names"/"Show numbers" label screen elements (then "Click 5"); "Show grid" (or "Show window grid") superimposes a numbered grid that the user drills into recursively across multiple levels for pixel-level precision. The recursive grid is the notable detail vs Windows' single-shot grid.
- **Four text/entry modes** — Dictation (default, auto-transcribe unless a command is recognized), Spelling (phonetic-alphabet character entry, "Alfa Bravo Charlie" → "abc"), Command (only commands execute), and Swift (auto-formats Swift code). The explicit spelling mode handles proper nouns/code tokens ASR mis-hears.
- **~half-second pacing** between commands for reliable recognition — a real usability constraint of command-mode voice.
- **Discoverability** — "Show commands" lists context-sensitive available actions; custom vocabulary and an interactive tutorial are available; integrates with VoiceOver.

## Follow-up
- Recursive grid drill-down is a distinct targeting refinement worth benchmarking vs single-level grid.
- Spelling/phonetic mode is a concrete answer to ASR errors on code identifiers — relevant for any voice-coding layer.
- Compare the three OS tools' (Talon / Windows / macOS) overlay + mode designs side by side for a project design doc.
