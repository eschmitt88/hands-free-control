---
kind: moc
name: "Consumer BCI (parked)"
status: growing
added: "2026-07-01"
tags: [bci, eeg, parked]
---

# Consumer BCI — surveyed and deliberately parked

You asked about brain-wave monitoring without shaving your head. Good news:
non-invasive [[dry-electrode-eeg]] headbands (Muse, OpenBCI, Emotiv) need no
gel or shaving. Honest news: consumer EEG is **not a viable primary control
channel today**, and the survey is unusually consistent on why. This MoC exists
to record that verdict with evidence so it doesn't get re-litigated — not to
seed a build.

## Why it's parked (the ceiling)

- [[information-transfer-rate]] — the killer metric. Out-of-lab SSVEP tops out
  around **28-30 bits/min**; even the best dry-electrode lab result is ~92
  bits/min (Xing 2018) — orders of magnitude below voice or a keyboard.
- [[bci-illiteracy]] · [[inter-subject-variability]] — ~50% of users can't
  produce usable control signals with a given paradigm at all.
- [[dry-electrode-eeg]] · [[electrode-contact-impedance]] — the no-gel
  convenience costs SNR: >100 kΩ impedance, motion artifacts, line noise.
- [[consumer-bci-hardware]] — few channels, and real product-longevity risk
  (NextMind, the most polished consumer VEP product, was bought by Snap and
  killed).

## The paradigms (for the record)

- [[ssvep]] — attend a flickering target; needs constant on-screen flicker.
  Decoded via [[canonical-correlation-analysis]].
- [[p300-speller]] — [[event-related-potential]] oddball response; needs trial
  averaging → slow.
- [[motor-imagery-bci]] — imagined movement; needs central electrodes a headband
  lacks, and per-user training.
- [[visual-evoked-potential]] — the general basis of SSVEP/NextMind selection.
- [[non-invasive-bci]] — the whole externally-worn category.

## Verdict

Documented, not adopted. If revisited, the only plausible near-term role is a
**low-bandwidth discrete switch** (one reliable "select" bit) folded into the
[[multimodal-gaze-voice]] stack — never a pointing or text channel. Revisit only
if consumer hardware bandwidth materially improves.
