---
kind: post
title: "Talon Voice Documentation"
author: Talon Voice (talonvoice.com)
url: https://talonvoice.com/docs/
source: "raw/web/talon-voice.md"
added: "2026-07-01"
relevance: 5
related_experiments: []
related_concepts: [command-grammar, dictation-mode, streaming-asr, noise-input-control, eye-tracking-mouse-control, scriptable-voice-commands, application-context-scoping]
tags: [voice-control, hands-free, accessibility, voice-coding, desktop-control]
---
# Talon Voice Documentation

## TL;DR
Talon is a mature, scriptable command-based speech engine for full hands-free control of the keyboard, mouse, coding, terminal, and games. It ships its own free "Conformer" speech recognition model, defines commands in a custom `.talon` grammar backed by an embedded Python 3 API, and augments voice with eye tracking and mouth-noise ("pop"/"hiss") inputs. It is the de-facto reference implementation for serious hands-free desktop use.

## Key points
- **Command grammar in `.talon` files** — declarative voice-command definitions with context matching (by window title / app name), plus a Python API using decorators for actions, captures, lists, modes, settings, and scopes. This is the extensibility model that distinguishes Talon from OS-built-in tools.
- **Built-in Conformer ASR** — bundles a free speech recognition engine (Conformer model, installed from the app menu); also interoperates with Dragon with no extra setup.
- **Multimodal input** — eye tracking drives the mouse (Tobii 4C / Tobii 5 or equivalent) via multiple algorithms; noise recognition detects "pop" and "hiss" sounds as discrete low-latency input events (e.g. click without speech), expandable to more noises.
- **Modular** — keyboard/mouse automation, ASR, eye tracking, and noise inputs can be used independently; embedded CPython means no external Python install.
- **Cross-platform** — Windows 8+, macOS 10.13+, Linux/X11 (Ubuntu 18.04+). Wayland not supported (a real limitation for modern Linux desktops).

## Follow-up
- Study the `.talon` grammar + Python decorator API as a design template for a command-grammar layer.
- Investigate the Conformer model's latency/accuracy vs cloud streaming ASR.
- Note the Wayland gap — relevant if targeting modern Linux; how does Talon inject input on X11 vs macOS/Windows?
- Compare noise-input paradigm (pop/hiss) as a fast alternative to spoken "click" commands.
