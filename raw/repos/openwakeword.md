source: https://github.com/dscripka/openWakeWord
fetched: 2026-07-01
title: dscripka/openWakeWord — open-source wake word detection

# openWakeWord Project Overview

## What It Does

openWakeWord is an open-source framework for detecting spoken wake words and
phrases in audio streams. It enables voice-activated applications with pre-trained
models optimized for real-world environments, focusing on accessibility and
straightforward implementation.

## Model Architecture

Three interconnected components:
1. Preprocessing: converts audio to melspectrogram using an ONNX implementation
2. Feature Extraction Backbone: a frozen Google speech embedding model
   (re-implemented from TFHub) that generates general-purpose speech embeddings
3. Classification Layer: a learnable fully-connected network or RNN that processes
   embeddings for final predictions

The frozen backbone enables efficient multi-model deployment since each additional
wake word only adds minimal computational overhead.

## Training Methodology

Models are trained entirely on synthetic speech generated via text-to-speech,
requiring no manual audio collection:
- Generating thousands of synthetic training examples for target phrases
- Collecting 30,000+ hours of negative data (speech, noise, music) to minimize
  false activations
- Training classification models atop the pre-trained feature extractor
Automated notebooks simplify custom wake word development.

## Real-Time Performance

A single Raspberry Pi 3 core can simultaneously run 15-20 models in real-time.
Performance is inadequate for severely resource-constrained microcontrollers;
microWakeWord is recommended for ultra-low-power devices.

## False-Accept Rates

Target goals: <0.5 false activations/hour and <5% false-reject rates. Testing uses
the Dinner Party Corpus (5.5 hours far-field speech and noise).

## Pre-Trained Models

alexa, hey mycroft, hey jarvis, hey rhasspy, current weather, timers — all
English-only currently.

## Installation

`pip install openwakeword`. Optional Speex noise suppression on Linux.

## License

Code: Apache 2.0. Pre-trained models: CC BY-NC-SA 4.0 (training-data restrictions).

## Notable Details

- Robust to whispered speech, variable speaking speeds, phrase variations
- VAD integration to reduce false positives
- Custom verifier models for speaker-specific accuracy
- Online demo via HuggingFace Spaces
