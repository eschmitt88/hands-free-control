# log — gaze-head-fusion

- 2026-07-08 scaffolded. Fused gaze-anchor + head-fine controller with head-gated
  auto-warp handoff (user-chosen). In-browser live gaze (client-side ridge). Webapp
  route /fusion. Awaiting first fused session.
2026-07-08 17:30 added /fusion-wg: fusion with WebGazer as the coarse channel (steadier: p95 9 vs 27 deg) + MediaPipe head fine. Single camera (WebGazer owns it; MediaPipe reads its canvas). Tests whether stable-coarse + head-fine is enough before deciding on hardware.
