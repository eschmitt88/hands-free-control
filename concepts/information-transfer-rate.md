---
kind: concept
name: "Information Transfer Rate"
status: seedling
added: "2026-07-01"
sources: ["high-speed-dry-ssvep", "embedded-ssvep-decoding-2026", "boggle-bci-browser-2025", "dry-electrode-eeg-review-2025"]
related_concepts: ["ssvep", "bci-illiteracy"]
tags: ["bci", "metric"]
---
# Information Transfer Rate
## Definition
ITR (bits/min), the standard BCI throughput metric; out-of-lab SSVEP tops out around 28-30 bits/min, marking the effective bandwidth ceiling.
## Why it matters here
This ceiling quantifies why EEG cannot yet be a primary control channel here — voice and gaze move far more intent per second — supporting the decision to park EEG.
## Connections
- [[ssvep]] — the paradigm whose real-world ITR sets the practical ceiling
- [[bci-illiteracy]] — even the ceiling ITR is unattainable for the substantial fraction of non-responders
