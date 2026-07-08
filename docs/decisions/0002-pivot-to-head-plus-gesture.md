# 0002 — Pivot from gaze fusion to head-pointing + facial gestures

- **Date:** 2026-07-08
- **Status:** accepted (pending final feel-validation of the head-mouse prototype)

## Context

The project thesis was "gaze points (coarse), head refines (fine), voice confirms."
Three experiments tested it:

- `2026-07-01-webcam-gaze-accuracy` — webcam gaze is coarse: median ~5.6°, **p95
  27°** (the fat tail is the felt "flying all over").
- `2026-07-08-head-pointing-closed-loop` — head pointing is **excellent**: 100%
  target acquisition across a ±40% gain sweep, **0.25° settling**. The reliable channel.
- `2026-07-08-gaze-head-fusion` (+ WebGazer variant) — fusing them. A WebGazer
  discriminating test showed the ~6° **median is the webcam sensor ceiling** (two
  independent implementations agree); WebGazer's tail is tighter (p95 9° vs 27°) so
  stability is softwarable, but the core wall is **head-gaze coupling**: webcam gaze
  is calibrated at one head pose, and fusion actively moves the head, corrupting the
  gaze. A head-near-neutral gate mitigated but did not cure it; the user judged it
  "better but not thrilled."

## Decision

**Drop gaze as a control channel.** Keep the proven head-pointing analog channel and
add **facial gestures** (MediaPipe's 52 blendshapes) for discrete commands and to
replace gaze's coarse/range role. Gestures are discrete and robust — they need no
continuous precision, which is exactly where the webcam is weak.

Range (which gaze was there to solve) is instead handled by a **clutch/ratchet**: a
gesture freezes the cursor so the user recenters the head, then resumes — reaching
the whole screen at low gain, like lifting a mouse.

User-validated gesture vocabulary (from the `/gestures` lab, 2026-07-08):

- **head** → cursor (low-gain, One-Euro, closed-loop)
- **jaw-open (hold)** → clutch (freeze + recenter) — the range solution
- **wink L / R** → left / right click (single-eye = deliberate; both-eyes natural
  blink is ignored)
- **smile** → drag-lock (planned); **brows up/down** → scroll (planned)

## Consequences

- Gaze work (`2026-07-01`, `2026-07-08-gaze-head-fusion`, `/fusion`, `/fusion-wg`,
  `/webgazer`) is retained as **negative/scoping results**, not deleted — they
  establish *why* gaze was dropped.
- New direction: `/gestures` (discovery lab) and `/headmouse` (feel prototype:
  head + jaw-clutch + wink-click on a target grid).
- **Real OS control needs a native workstation app** (Python + `pynput` injecting
  mouse events) — a browser page cannot move the system cursor. The MediaPipe
  detection + control logic ports directly; the browser prototypes validate the
  scheme's feel first.
- Voice-confirm (the third leg of the original thesis) remains available as a
  complementary command channel and is unaffected by this pivot.
