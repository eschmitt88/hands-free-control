source: https://github.com/serenadeai/serenade
fetched: 2026-07-01
title: serenadeai/serenade

# Serenade Voice-Coding Project Overview

## Purpose
Serenade is a voice-controlled coding assistant that enables developers to write code using natural speech commands rather than traditional keyboard input.

## Architecture

The project is organized as a monorepo containing several core components:

**Speech Engine**: Processes voice input and converts natural language to actionable commands.

**Code Engine**: Translates voice commands into structured code edits and syntax-aware modifications.

**Client Application**: The core Serenade client that orchestrates these services.

**Online Services**: Backend systems supporting speech processing, code generation, and application logic.

## Editor Support

Serenade provides plugins for multiple development environments:
- VS Code, Atom, JetBrains IDEs, Chrome, Hyper, and iTerm2

Each plugin lives in a separate repository for modular development.

## Technical Stack

The monorepo uses:
- **Java** (59.8% of codebase)
- **TypeScript** (28.6%)
- **Python** (4.3%)
- **C++** (3.3%)
- **ANTLR** for grammar definitions

## Additional Resources

- **Documentation**: Available in the `/docs` directory
- **Open-source packages**: The project publishes reusable packages including `speech-recorder` (microphone access/voice activity detection) and `serenade-driver` (OS-level keyboard/mouse hooks)
- **License**: Apache 2.0
- **Community**: Discord community available for support and questions

## Getting Started

Contributors should review the Contributing Guidelines before submitting changes.
