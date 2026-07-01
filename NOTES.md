# NOTES

Running log of work sessions. `/wrap` appends a new dated section at the
end of each session with **Did / Findings / Next** subsections. The
SessionEnd hook backstops this if you forget.

<!-- entries go below this line, newest at bottom -->

## 2026-07-01

### Did
- Scaffolded the project; pushed public to GitHub with a live Pages viewer.
- Ran a 4-modality prior-art sweep (voice, webcam-gaze, multimodal, EEG) →
  40 ranked candidates in `raw/_candidates/`.
- Set `agency: max` (user opted into full autonomy).
- Ingested **all 40** candidates → 40 literature notes (23 papers, 8 repos,
  9 posts) with immutable raw captures.
- Synthesized ~107 raw concept candidates into a **78-concept graph** across
  8 clusters (258 wikilinks, 0 dead, every concept sourced).
- Promoted **4 MoCs**: multimodal-gaze-voice (thesis), voice-control,
  gaze-head-pointing, consumer-bci (parked).

### Findings
- **Thesis: "gaze points, voice confirms."** Multimodal beats either modality
  alone; EyeTAP shows gaze+voice-confirm beats both dwell and voice-only on
  time *and* cognitive load; dissolves the Midas-touch problem.
- **Voice is the mature anchor.** Talon + OS Voice Access already solve
  arbitrary-element targeting via number/grid overlays — copy, don't reinvent.
  Novel angle = LLM intent layer on top.
- **Webcam gaze is coarse (~3-6°).** Head-pose (Camera Mouse/eViacam) is often
  more reliable on a commodity cam. Calibration drift is the make-or-break.
- **EEG parked.** Out-of-lab SSVEP ceiling ~28-30 bits/min; ~50% BCI-illiteracy;
  NextMind (best consumer product) was acquired and killed. Documented, not built.
- Subagents corrected 3 errors in my survey: SSVEP ITR conflation (wet vs dry),
  wrong Look & Touch DOI, unverified NextMind claims.

### Next
- First experiment candidate: **characterize gaze/head accuracy on the user's
  own webcam** (°-error + dwell false-activation rate) — HCE splits apply.
- Decide MVP altitude: voice-first + grid overlays vs full multimodal.
- Re-fetch `camera-mouse` and `put-that-there-1980` (network-failed, reconstructed).
- User to curate: the graph is built; pick the direction to prototype.
