# Deploy — gaze collector webapp

FastAPI service serving the in-browser MediaPipe gaze/head-pose calibration
collector. Runs on aiserver2026 as a `--user` systemd unit, HTTPS on :8104.

## Install
```sh
cp deploy/hands-free-gaze.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now hands-free-gaze.service
```

## TLS
Serves HTTPS (getUserMedia needs a secure context). The cert `webapp/certs/gaze.pem`
is signed by the **dotaml-live local CA** — clients that already trust that rootCA
(e.g. desktop-2020) need no new import. Regenerate with:
```sh
# openssl req/x509 signing against ~/projects/dotaml-live/certs/rootCA.pem
# SANs: aiserver2026, aiserver2026.tail6b4ade.ts.net, 100.70.9.10, 192.168.50.46, localhost, 127.0.0.1
```
`webapp/certs/` and `webapp/static/vendor/` are gitignored (keys + fetched model).

## Access
- Tailscale/LAN: https://aiserver2026:8104/  (or https://100.70.9.10:8104/)
- Data lands in `experiments/2026-07-01-webcam-gaze-accuracy/results/session_web_*/`
- Scoring reuses that experiment's `analyze.py` (validation only; test stays held out).

## Offline assets (optional)
`python fetch_assets.py` vendors the MediaPipe tasks-vision bundle + model into
`static/vendor/`; without it the frontend falls back to the jsDelivr CDN.
