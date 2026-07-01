source: https://github.com/SYSTRAN/faster-whisper
fetched: 2026-07-01
title: SYSTRAN/faster-whisper — Faster Whisper transcription with CTranslate2

# Faster-Whisper: A High-Performance Speech Recognition Tool

## Project Overview

Faster-Whisper is an optimized reimplementation of OpenAI's Whisper model using
CTranslate2, a fast inference engine for Transformer models. The project delivers
significantly improved performance while maintaining accuracy.

## Core Architecture

The implementation leverages CTranslate2 as its computational backbone, enabling
efficient transformer-based inference that substantially outpaces the original
Whisper implementation.

## Performance Metrics

Benchmarks transcribing 13 minutes of audio:

GPU (Large-v2 model, fp16, beam size 5):
- Faster-Whisper: 1m03s vs 2m23s for OpenAI's version
- Memory: 4,525MB vs 4,708MB
- With batch processing (size 8): 17 seconds, 6,090MB

CPU (Small model, fp32, beam size 5):
- Faster-Whisper: 2m37s vs 6m58s for OpenAI's implementation
- RAM: 2,257MB vs 2,335MB

Quantization: int8 and fp16 options reduce memory footprint; int8 variants use
~1,477MB on CPU.

## Key Capabilities

- Word-level timestamps for precise timing
- Voice Activity Detection (VAD) filtering using Silero VAD model
- Batched transcription pipeline
- Support for Distil-Whisper checkpoints
- Real-time streaming capabilities through community integrations

## Installation & Requirements

`pip install faster-whisper`. Python 3.9+. GPU execution needs cuBLAS and cuDNN 9
for CUDA 12. FFmpeg not required — PyAV handles audio decoding internally.

## Model Support

Automatically downloads CTranslate2-optimized models from Hugging Face Hub,
including original OpenAI checkpoints and user fine-tuned variants via conversion
tools.

## License

MIT.
