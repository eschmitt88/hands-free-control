source: https://github.com/OpenWhispr/openwhispr
fetched: 2026-07-01
title: OpenWhispr/openwhispr — privacy-first desktop voice dictation

# OpenWhispr: Privacy-First Voice Dictation

## Core Functionality

OpenWhispr is a desktop application that enables voice-to-text dictation through a
simple workflow: activate a global hotkey, speak your message, and the transcribed
text automatically appears at your cursor position in any application.

## Supported ASR Models

- Local models: OpenAI's Whisper and NVIDIA Parakeet for completely offline
  processing
- Cloud options: OpenAI, Anthropic, Google Gemini, Groq via bring-your-own-key

## Privacy & Architecture

Privacy-first design. With local models, audio never leaves the device — all
processing occurs on-machine. No telemetry or data collection.

## Cross-Platform Availability

Runs on macOS (Apple Silicon and Intel), Windows, and Linux, distributed as .dmg,
.exe, .AppImage, .deb, .rpm, and .tar.gz packages.

## Additional Features

- AI agent interaction with voice commands
- Meeting transcription with speaker identification
- Local speaker diarization using voice fingerprinting
- Note-taking with semantic search
- Public API and Model Context Protocol (MCP) server integration

## Technical Stack & Licensing

Built with React 19, TypeScript, Tailwind CSS, and Electron 41. MIT license.
Codebase ~48.5% TypeScript, ~46.1% JavaScript.
