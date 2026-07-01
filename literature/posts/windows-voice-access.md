---
kind: post
title: "Windows 11 Voice Access command list"
author: Microsoft (support.microsoft.com)
url: https://support.microsoft.com/en-us/accessibility/windows/voice-access/voice-access-command-list
source: "raw/web/windows-voice-access.md"
added: "2026-07-01"
relevance: 5
related_experiments: []
related_concepts: [command-grammar, dictation-mode, on-device-asr, number-overlay-targeting, grid-overlay-targeting, ui-element-targeting-overlay, voice-mode-switching]
tags: [voice-control, hands-free, accessibility, windows, desktop-control]
---
# Windows 11 Voice Access command list

## TL;DR
Windows 11 Voice Access is Microsoft's built-in, fully on-device (offline) speech control for the whole OS. It has a documented, closed command grammar spanning app/window control, UI clicking, dictation, text editing, formatting, and navigation, and uses "Show numbers" and "Show grid" overlays to target arbitrary on-screen elements. This is the canonical example of a first-party, fixed-grammar hands-free system.

## Key points
- **On-device / offline ASR** — no internet required; runs locally on Windows 11 22H2+. Languages: English, Spanish, French, German, Chinese, Japanese.
- **Explicit mode model** — command-only, dictation-only, and default (mixed) modes; activated/deactivated with "Voice access wake up" / "Voice access sleep" (wake-phrase gating).
- **Fixed command grammar by category**: manage voice access; app & window control ("Open/Close/Switch to <app>", snap/minimize/maximize); UI interaction ("Click/Double-click <item>", "Scroll <dir>"); dictation & editing ("Delete/Copy/Paste/Undo that", "Select <text>/previous <count> words"); formatting ("Bold/Italicize/Underline <text>", case changes); navigation ("Go to top", "Move left <count> words"); punctuation/symbol insertion.
- **Two overlay targeting mechanisms** — "Show numbers" labels clickable elements with numbers; "Show grid" superimposes a grid for coordinate-style precision targeting of anything without an accessible name. This solves the "element has no label" problem that pure name-based clicking hits.

## Follow-up
- Contrast the closed fixed grammar here vs Talon's user-scriptable grammar — tradeoff of discoverability/reliability vs extensibility.
- The number-overlay vs grid-overlay split is a reusable UI-targeting pattern worth cataloging across all three OS tools.
- On-device ASR as a privacy/latency baseline to compare against LLM-intent approaches.
