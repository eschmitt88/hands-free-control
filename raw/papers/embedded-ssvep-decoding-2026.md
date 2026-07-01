source: https://arxiv.org/abs/2601.01772
fetched: 2026-07-01
title: Design and Quantitative Evaluation of an Embedded EEG Instrumentation Platform for Real-Time SSVEP Decoding

# Design and Quantitative Evaluation of an Embedded EEG Instrumentation Platform for Real-Time SSVEP Decoding

**Authors:** Manh-Dat Nguyen, Thomas Do, Nguyen Thanh Trung Le, Xuan-The Tran,
Fred Chang, Chin-Teng Lin
**Year:** 2026 (submitted 2026-01-05; revised 2026-03-11)
**arXiv:** 2601.01772
**Access:** abstract + metadata (arXiv abs page). Institutions not listed on abs
page; senior author Chin-Teng Lin is a well-known BCI researcher (UTS Sydney).

## Captured content

Embedded 8-channel EEG platform: **ESP32-S3 microcontroller + ADS1299 analog
front end**, performing "zero-phase bandpass filtering, and canonical correlation
analysis entirely on-device" for SSVEP detection (no external computation).

### Performance metrics (captured, verbatim)
- Online accuracy: **99.17%**
- Information transfer rate: **27.66 bits/min**
- Noise floor: ~0.08 µV RMS
- Sampling jitter: 0.56 µs std
- "100% decision agreement between the mixed-precision embedded pipeline and a
  64-bit double-precision reference" (numerical fidelity on constrained HW).

### Takeaway for a control project
Demonstrates a self-contained, low-cost on-device SSVEP decoder can hit very
high accuracy — but the ITR (27.66 bits/min) is the headline ceiling: even a
near-perfect SSVEP speller moves information at well under 1 char/sec-class
bandwidth. Bandwidth, not accuracy, is the binding limit.
