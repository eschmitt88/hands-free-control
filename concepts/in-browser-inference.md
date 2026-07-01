---
kind: concept
name: "In-browser Inference"
status: seedling
added: "2026-07-01"
sources: ["emc-gaze-2026", "webgazer"]
related_concepts: ["on-device-inference"]
tags: ["deployment", "gaze"]
---
# In-browser Inference
## Definition
Running the gaze or control model entirely on-device in the browser, using a small model with millisecond latency and no server round-trip.
## Why it matters here
Local inference keeps webcam frames private and the cursor responsive, which is decisive for a hands-free tool that must feel immediate.
## Connections
- [[on-device-inference]] — the broader on-device deployment stance this instantiates
