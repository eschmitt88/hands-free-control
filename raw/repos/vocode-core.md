source: https://github.com/vocodedev/vocode-core
fetched: 2026-07-01
title: vocodedev/vocode-core — open-source library for real-time voice LLM agents

# Vocode Core: Voice-Based LLM Agents

## Project Overview

Vocode is an open-source Python library for building real-time streaming voice
applications powered by large language models. It integrates transcription,
language models, and speech synthesis into a unified system.

## Core Architecture

Three-stage pipeline:
1. Transcription (ASR): spoken audio to text
2. Language Model Processing: generates contextual responses
3. Speech Synthesis (TTS): converts responses back to audio

Modular design allows swapping components independently.

## Key Capabilities

- Real-time conversations via system audio or microphone input
- Telephony integration: inbound/outbound phone calls and Zoom dial-in
- Extensibility: integrate with Langchain agents and custom workflows
- Built-in interruption handling: manages conversation flow via punctuation-based
  endpointing and audio management

## Supported Providers

- Transcription: Whisper, Google Cloud, Azure, Deepgram, AssemblyAI, others
- LLMs: OpenAI, Anthropic
- Synthesis: Eleven Labs, Azure, Google Cloud, Play.ht, AWS Polly, Coqui (OSS)

## Installation & Usage

`pip install vocode`. Quickstart builds a conversational agent configured via
environment variables; requires API keys for transcription, synthesis, and LLM.

## Licensing & Community

MIT. Active community; documentation, Discord, published roadmap.
