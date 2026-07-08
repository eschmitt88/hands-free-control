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
- Decide MVP altitude: voice-first + grid overlays vs full multimodal.
- Re-fetch `camera-mouse` and `put-that-there-1980` (network-failed, reconstructed).

### Update — first experiment built (2026-07-01)
- Scaffolded `experiments/2026-07-01-webcam-gaze-accuracy/` (HCE, ADR 0001).
- Built + committed the full harness: `gazelib/` (geometry, scale-invariant
  ridge calibration, dwell sim, MediaPipe features), interactive `collect.py`
  (workstation), headless `analyze.py`, and `synth.py` validator.
- **Synth self-check passes tightly** (inject 2/4/8° → recover 2.12/3.69/7.25°),
  proving the metric math + calibration before any real session. Two real bugs
  fixed en route: Ridge scale-shrinkage (→ StandardScaler pipeline) and
  errors-in-variables attenuation from noisy calibration.
- **BLOCKED ON USER:** aiserver2026 is headless and its `/dev/video0` is the HDMI
  capture card, not a webcam. The collection session must run on the user's
  workstation (cam above monitor). Steps are in the experiment README.
- On session data: run `analyze.py` → `metrics.json` (validation); `analyze.py
  --final` → `final_metrics.json` (held-out test) only at chain end.

### Update — collection moved to a webapp (no desktop install)
- User asked for a webapp instead of a local install. Built `webapp/`: FastAPI on
  aiserver:8104 (HTTPS) serving an **in-browser MediaPipe FaceLandmarker** collector;
  webcam capture happens in the desktop browser, samples POST back, and the
  experiment's validated `analyze.py` scores them server-side (validation only; test
  held out — HCE preserved).
- TLS via a cert signed by the **dotaml-live local CA** (already trusted on
  desktop-2020) — SANs cover aiserver2026 / tailnet / LAN; no new import, no sudo.
- Systemd `--user` unit `hands-free-gaze.service` (enabled, linger on); port 8104
  registered in `~/claude-system/registry/services.yaml`.
- **Smoke-tested over real HTTPS**: /healthz, /api/config (splits 9/16/5), page load,
  and full POST session→analyze loop all green; browser geometry override confirmed.
  Fixed one bug: serve.py subprocess couldn't find `uv` under systemd's minimal PATH
  → resolve UV_BIN by absolute path.
- **URL: https://aiserver2026:8104/** — open on the workstation, allow camera, do the
  dot session. That's the whole workflow now.

## 2026-07-08

### Did
- **Head pointing (`2026-07-08-head-pointing-closed-loop`).** First real session:
  100% target acquisition across a ±40% gain sweep, 0.25° settling, 3.25 s/target.
  Added a One-Euro filter + live tuning sandbox (gain/steadiness/responsiveness/deadzone).
- **Gaze+head fusion (`2026-07-08-gaze-head-fusion`, `/fusion`).** Client-side ridge
  (node-tested) for live gaze + head-gated auto-warp handoff (VOR-based design; = MAGIC
  pointing made hands-free). 4 concepts added (closed-loop-control, gain-calibration,
  area-cursor, vestibulo-ocular-reflex).
- **WebGazer discriminating test (`/webgazer`).** Ran WebGazer on the same grid: median
  ~same (6.2 vs 5.6° = webcam ceiling, two impls agree), p95 far tighter (9 vs 27°).
- **`/fusion-wg`** (WebGazer coarse + MediaPipe head, single camera) + a head-near-neutral
  gate to work around head-gaze coupling. "Almost workable" but not thrilling.
- **Pivot (ADR 0002).** Dropped gaze as a control channel. Gesture lab (`/gestures`,
  blendshapes) → user vocabulary. Built `/headmouse`: head cursor + jaw-clutch
  (relative ratchet) + adaptive differential wink-click. **User: "feels good."**

### Findings
- **Head is the reliable channel** (0.25° closed-loop); **webcam gaze is capped** at ~6°
  median by the sensor, and **head-gaze coupling** is the wall fusion couldn't clear.
- **Clutch (jaw-hold ratchet) replaces gaze's range role** with no gaze at all.
- **Adaptive differential wink** (asymmetry vs slow baseline) beats any static threshold —
  cancels full-blink common-mode and head-angle bias.

### Next
- **Native workstation app** (Python + `pynput`) to drive the REAL OS cursor — the payoff;
  browser can't inject OS events. Port the MediaPipe detection + control logic.
- Finish the vocabulary: smile → drag-lock, brows up/down → scroll.
- Optional polish: rate-of-rise term in the wink detector; verify L/R wink labels.
