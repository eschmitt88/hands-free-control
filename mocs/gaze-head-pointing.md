---
kind: moc
name: "Webcam Gaze & Head Tracking"
status: growing
added: "2026-07-01"
tags: [gaze, pointing, vision]
---

# Webcam Gaze & Head Tracking — the pointing channel

The coarse-pointing half of the thesis. Key reality from the survey: a commodity
webcam gives roughly **3-6° of gaze error** (a few cm on screen) — good enough
for region selection, not pixel targeting. Notably, the accessibility field's
workhorses (Camera Mouse, eViacam) use **head pose, not gaze**, because it is
more stable on a commodity camera. Both feed the same downstream selection logic.

## Gaze estimation approaches

- [[webcam-gaze-tracking]] — the umbrella: on-screen gaze from a plain RGB cam.
- [[appearance-based-gaze-estimation]] — CNN from eye/face pixels (GazeCapture,
  L2CS-Net, ETH-XGaze).
- [[landmark-based-gaze]] — from facial landmarks only; small, fast models
  (EMC-Gaze).
- [[iris-landmark-tracking]] · [[mediapipe-face-mesh]] · [[monocular-depth-from-iris]]
  — the MediaPipe primitive many pipelines build on.

## Calibration (the make-or-break problem)

- [[gaze-calibration]] — fit the per-user feature→screen mapping.
- [[interaction-based-calibration]] — self-calibrate from natural clicks (WebGazer).
- [[per-session-recalibration]] · [[meta-learned-calibration]] — fight the main
  failure mode: accuracy decay from head/posture drift.

## Evaluation

- [[gaze-angular-accuracy]] · [[gaze-estimation-benchmark]] — the degrees metric
  and standardized protocols. This is what an experiment here would measure.

## Head-pose alternative (often more reliable)

- [[head-pose-pointing]] · [[feature-tracking]] · [[camera-mouse]] — track the
  head/face instead of the eyes; the proven assistive path.
- [[assistive-pointing-device]] — the class these belong to.

## Closed-loop control & the gaze-head handoff

Added 2026-07-08 from this project's own experiments, not the survey — the
reframe that head pointing is a *control* problem, not an *estimation* problem.

- [[closed-loop-control]] — the user sees the cursor and corrects continuously,
  so the input→cursor mapping need not be accurate
  (`experiments/2026-07-08-head-pointing-closed-loop`: 100% acquisition across a
  ±40% gain sweep, 0.25° settling). This is why the calibration section above
  matters far less for head than for gaze.
- [[gain-calibration]] — under closed-loop control, the *only* calibration head
  pointing needs: one eyeballed slider (~1000 px/rad).
- [[vestibulo-ocular-reflex]] — the physiology that makes gaze and head
  *separable* signals: fixate and move your head, and the gaze point stays put
  while head pose changes. Basis for the head-gated auto-warp handoff in
  `experiments/2026-07-08-gaze-head-fusion`.
- [[area-cursor]] — target gravity / element latching, so a coarse pointer only
  has to land in a target's basin. The next lever once the handoff feels right.

## Selection from a coarse pointer

- [[gaze-cursor-positioning]] · [[dwell-click]] — the naive path (and why dwell
  is problematic → [[midas-touch-problem]]). Better: hand the confirm to voice,
  see [[multimodal-gaze-voice]].

## Deployment & tooling

- [[in-browser-inference]] — run the model on-device in the browser.
- [[online-event-detection]] · [[eye-tracking-toolbox]] · [[unified-tracker-api]]
  — pipeline plumbing (PyGaze) and a baseline vs dedicated IR trackers.
