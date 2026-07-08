/*
 * WebGazer.js discriminating test.
 *
 * Runs the mature WebGazer library through the SAME 9-point calibration + a
 * validation grid our own iris-feature ridge used, and reports validation error
 * (deg / px / cm) side-by-side with our numbers. Purpose: tell whether the poor
 * webcam gaze is our implementation (→ software) or the sensor (→ hardware).
 *
 * WebGazer is loaded as a global (see webgazer_test.html). It runs its own camera
 * + regression; we hide its overlays and draw our own live gaze dot (the same
 * real-time diagnostic that made the problem visible on the fusion page).
 */

// Our baseline (2026-07-01 gaze experiment, same rig, 9-pt calib, validation split)
const OURS = { mean: 9.29, median: 5.56, p95: 27.42 };

const CALIB = [];   // 3x3
for (const y of [0.12, 0.5, 0.88]) for (const x of [0.12, 0.5, 0.88]) CALIB.push([x, y]);
const VAL = [];     // 4x4 interior (matches our 16-pt validation)
for (const y of [0.2, 0.4, 0.6, 0.8]) for (const x of [0.2, 0.4, 0.6, 0.8]) VAL.push([x, y]);

const $ = (id) => document.getElementById(id);
const screens = { landing: $("landing"), stage: $("stage-screen"), results: $("results") };
const show = (n) => { for (const [k, el] of Object.entries(screens)) el.classList.toggle("active", k === n); };
const overlay = (m) => { $("overlay-msg").textContent = m; $("overlay").classList.toggle("hidden", !m); };

const canvas = $("stage"), ctx = canvas.getContext("2d");
let latest = null;          // latest webgazer prediction {x,y} in client px
let started = false, aborted = false;

// ---- geometry ----
function mmPerPx() {
  const wm = parseFloat($("width_mm").value), hm = parseFloat($("height_mm").value);
  return 0.5 * (wm / window.screen.width + hm / window.screen.height);
}
function errToDeg(px) {
  const vd = parseFloat($("viewing_cm").value) * 10;
  return Math.atan2(px * mmPerPx(), vd) * 180 / Math.PI;
}
function px2cm(px) { return px * mmPerPx() / 10; }
function geometryValid() { return ["width_mm", "height_mm", "viewing_cm"].map((i) => parseFloat($(i).value)).every((v) => v > 0); }

function applyDiagonal() {
  const d = parseFloat($("diag_in").value); if (!(d > 0)) return;
  const n = Math.hypot(16, 9), mm = d * 25.4;
  $("width_mm").value = Math.round(mm * 16 / n); $("height_mm").value = Math.round(mm * 9 / n);
}

// ---- webgazer setup ----
async function initWebGazer() {
  overlay("Starting WebGazer + camera…");
  webgazer.setRegression("ridge").setGazeListener((d) => { if (d) latest = { x: d.x, y: d.y }; });
  await webgazer.begin();
  // hide all of WebGazer's own UI; we draw our own dot
  try { webgazer.showVideoPreview(false).showPredictionPoints(false); } catch { /* older api */ }
  try { webgazer.showFaceOverlay(false).showFaceFeedbackBox(false); } catch { /* ignore */ }
  try { webgazer.removeMouseEventListeners(); } catch { /* ignore */ } // only OUR dots train it
  overlay("");
}

function sizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

function drawDot(cx, cy, prog, live) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (live) { // faint live gaze dot
    ctx.beginPath(); ctx.arc(live.x, live.y, 7, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255,210,80,0.8)"; ctx.lineWidth = 2; ctx.stroke();
  }
  if (cx != null) {
    ctx.beginPath(); ctx.arc(cx, cy, 16 + 22 * (1 - prog), -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * prog);
    ctx.strokeStyle = "#4da3ff"; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 2 * Math.PI); ctx.fillStyle = "#ff4d6d"; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2 * Math.PI); ctx.fillStyle = "#fff"; ctx.fill();
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// run one dot: warmup, then `action(cx,cy)` each frame for `captureMs`
async function dotPhase(targets, label, captureMs, action) {
  const W = canvas.width, H = canvas.height;
  for (let i = 0; i < targets.length; i++) {
    if (aborted) return;
    const [nx, ny] = targets[i], cx = nx * W, cy = ny * H;
    $("phase-hud").textContent = `${label} ${i + 1}/${targets.length}`;
    // warmup 500ms
    const t0 = performance.now();
    while (performance.now() - t0 < 500 && !aborted) { drawDot(cx, cy, 0, latest); await sleep(16); }
    // capture window
    const tc = performance.now();
    while (performance.now() - tc < captureMs && !aborted) {
      const prog = (performance.now() - tc) / captureMs;
      drawDot(cx, cy, prog, latest);
      action(cx, cy);
      await sleep(16);
    }
  }
}

async function runTest() {
  sizeCanvas();
  started = true; aborted = false;
  $("hint-hud").textContent = "look at each dot · Esc = abort";

  // 1) calibration — feed WebGazer the screen position while the user looks
  await dotPhase(CALIB, "calibration", 1600, (cx, cy) => {
    try { webgazer.recordScreenPosition(cx, cy, "click"); } catch { /* ignore */ }
  });

  // 2) validation — collect predictions, average per dot, error
  const errsPx = [];
  const W = canvas.width, H = canvas.height;
  for (let i = 0; i < VAL.length; i++) {
    if (aborted) break;
    const [nx, ny] = VAL[i], cx = nx * W, cy = ny * H;
    $("phase-hud").textContent = `validation ${i + 1}/${VAL.length}`;
    const t0 = performance.now();
    while (performance.now() - t0 < 500 && !aborted) { drawDot(cx, cy, 0, latest); await sleep(16); }
    const preds = [];
    const tc = performance.now();
    while (performance.now() - tc < 1400 && !aborted) {
      drawDot(cx, cy, (performance.now() - tc) / 1400, latest);
      if (latest) preds.push([latest.x, latest.y]);
      await sleep(16);
    }
    if (preds.length) {
      const mx = preds.reduce((s, p) => s + p[0], 0) / preds.length;
      const my = preds.reduce((s, p) => s + p[1], 0) / preds.length;
      errsPx.push(Math.hypot(mx - cx, my - cy));
    }
  }

  // 3) free-look — let the user eyeball jumpiness for 12s
  $("phase-hud").textContent = "free look — move your eyes around";
  $("hint-hud").textContent = "watch the yellow dot vs where you look · Esc = finish";
  const tf = performance.now();
  while (performance.now() - tf < 12000 && !aborted) { drawDot(null, null, 0, latest); await sleep(16); }

  finish(errsPx);
}

function pct(arr, p) { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; }

async function finish(errsPx) {
  try { webgazer.pause(); } catch { /* ignore */ }
  if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ignore */ } }
  if (!errsPx.length) { overlay("No validation samples captured. Try again."); setTimeout(() => { overlay(""); show("landing"); }, 1800); return; }
  const degs = errsPx.map(errToDeg);
  const mean = degs.reduce((a, b) => a + b, 0) / degs.length;
  const median = pct(degs, 50), p95 = pct(degs, 95);
  const meanCm = px2cm(errsPx.reduce((a, b) => a + b, 0) / errsPx.length);
  render({ mean, median, p95, meanCm, n: errsPx.length });
}

function render(wg) {
  const row = (name, a, b) => `<tr><td>${name}</td><td style="text-align:right">${a}</td><td style="text-align:right">${b}</td></tr>`;
  $("cmp-table").innerHTML = `<table>
    <thead><tr><th>validation error</th><th>WebGazer</th><th>ours (6-feat ridge)</th></tr></thead>
    <tbody>
      ${row("mean °", wg.mean.toFixed(1), OURS.mean.toFixed(1))}
      ${row("median °", wg.median.toFixed(1), OURS.median.toFixed(1))}
      ${row("p95 °", wg.p95.toFixed(1), OURS.p95.toFixed(1))}
    </tbody></table>`;
  let v;
  if (wg.median <= OURS.median * 0.6 && wg.p95 <= OURS.p95 * 0.6)
    v = "WebGazer is clearly better → our implementation is a big part of the gap. Software is worth investing in.";
  else if (wg.median >= OURS.median * 0.85)
    v = "WebGazer is no better (or worse) → the limit is the webcam sensor, not our code. Hardware (a real eye tracker) is the high-ROI move.";
  else v = "WebGazer is somewhat better → mixed; some software headroom, but the webcam ceiling is real.";
  $("verdict").textContent = v;
  $("results-meta").textContent = `WebGazer median ${wg.median.toFixed(1)}° (${wg.meanCm.toFixed(1)} cm mean) over ${wg.n} validation dots · same 9-pt calibration. Report the numbers + how the free-look dot felt.`;
  // best-effort persist for the record (non-blocking)
  fetch("/api/webgazer_result", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webgazer: wg, ours: OURS, user_agent: navigator.userAgent }),
  }).catch(() => {});
  show("results");
}

// ---- wiring ----
$("diag-apply").addEventListener("click", applyDiagonal);
$("start-btn").addEventListener("click", async () => {
  if (!geometryValid()) { $("landing-status").textContent = "enter screen size + distance first"; return; }
  if (!started) { try { await initWebGazer(); } catch (e) { overlay(`WebGazer failed: ${e.message}`); return; } }
  show("stage"); await document.documentElement.requestFullscreen().catch(() => {});
  setTimeout(runTest, 150);
});
$("again-btn").addEventListener("click", () => { show("landing"); });
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && screens.stage.classList.contains("active")) { aborted = true; }
});
window.addEventListener("resize", () => { if (screens.stage.classList.contains("active")) sizeCanvas(); });

// prefill geometry defaults from the head-pointing config (best-effort)
fetch("/api/headpoint_config").then((r) => r.json()).then((c) => {
  const d = c.screen_defaults || {};
  if (d.width_mm) $("width_mm").value = d.width_mm;
  if (d.height_mm) $("height_mm").value = d.height_mm;
  if (d.viewing_distance_mm) $("viewing_cm").value = Math.round(d.viewing_distance_mm / 10);
}).catch(() => {});
