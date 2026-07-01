---
kind: concept
name: "SSVEP"
status: seedling
added: "2026-07-01"
sources: ["high-speed-dry-ssvep", "bci-signal-acquisition-review-2025", "dry-electrode-eeg-review-2025", "embedded-ssvep-decoding-2026", "boggle-bci-browser-2025"]
related_concepts: ["visual-evoked-potential", "information-transfer-rate", "canonical-correlation-analysis"]
tags: ["bci", "paradigm"]
---
# SSVEP
## Definition
Steady-state visual evoked potential: an occipital EEG signal phase-locked to a flickering target, letting a user select by attending to one of several options flickering at distinct frequencies.
## Why it matters here
SSVEP is the most throughput-competitive EEG paradigm, but EEG overall is parked and low-priority in this project; it is tracked as a possible future selection channel, not a current build target.
## Connections
- [[visual-evoked-potential]] — SSVEP is the steady-state form of the broader evoked-potential family
- [[information-transfer-rate]] — SSVEP is measured against, and capped by, this throughput metric
- [[canonical-correlation-analysis]] — the standard decoder that identifies the attended SSVEP frequency
