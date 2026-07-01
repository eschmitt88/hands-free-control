---
kind: concept
name: "Speech Embedding Backbone"
status: seedling
added: "2026-07-01"
sources: ["openwakeword"]
related_concepts: ["wake-word-detection"]
tags: ["voice", "asr"]
---
# Speech Embedding Backbone
## Definition
A frozen, shared speech-embedding model over which tiny per-keyword classifiers run cheaply, so new wake words need only a small head rather than a full retrain.
## Why it matters here
It lets the project add or customize trigger phrases without training large models, keeping wake-word support light enough to run always-on alongside the rest of the pipeline.
## Connections
- [[wake-word-detection]] — the backbone supplies the features each keyword classifier scores against
