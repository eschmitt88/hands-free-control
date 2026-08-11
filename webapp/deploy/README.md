# Deploy — gaze collector webapp

FastAPI service serving the in-browser MediaPipe gaze/head-pose calibration
collector. Runs on the build server as a `--user` systemd unit, HTTPS on :8104.

## Install
```sh
cp deploy/hands-free-gaze.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now hands-free-gaze.service
```

## TLS
Serves HTTPS (getUserMedia needs a secure context). The cert `webapp/certs/gaze.pem`
is signed by a **local CA** — clients that already trust that rootCA need no
new import. Regenerate with:
```sh
# openssl req/x509 signing against your local rootCA.pem
# SANs: <hostname>, <hostname>.<tailnet>.ts.net, <tailnet-IP>, <LAN-IP>, localhost, 127.0.0.1
```
`webapp/certs/` and `webapp/static/vendor/` are gitignored (keys + fetched model).

## Access
- Tailscale/LAN: https://<build-server>:8104/
- Data lands in `experiments/2026-07-01-webcam-gaze-accuracy/results/session_web_*/`
- Scoring reuses that experiment's `analyze.py` (validation only; test stays held out).

## Offline assets (optional)
`python fetch_assets.py` vendors the MediaPipe tasks-vision bundle + model into
`static/vendor/`; without it the frontend falls back to the jsDelivr CDN.
