/*
 * In-browser closed-loop head-pointing task.
 *
 * A cursor is driven by head pose (yaw -> x, pitch -> y) relative to a captured
 * neutral pose, scaled by a user-set gain ("size" calibration). The user drives
 * the cursor into each target and holds until it locks (dwell). We record the
 * full per-target trajectory and POST it to the server, which scores closed-loop
 * metrics (acquisition time, settling, overshoot, Fitts throughput) with a
 * per-gain-multiplier breakdown for the gain-robustness test.
 *
 * This shares the MediaPipe/camera setup shape with app.js (the gaze collector)
 * but only needs head pose, so it is kept as a self-contained module rather than
 * refactoring the working gaze collector.
 *
 * Head pose: yaw/pitch/roll are decomposed (radians) from the rigid rotation in
 * facialTransformationMatrixes[0] (4x4, column-major) — same math as app.js.
 */

const TASKS_VISION_VERSION = "0.10.20";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}`;
const MODEL_URL_REMOTE =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/" +
  "face_landmarker/float16/1/face_landmarker.task";
const VENDOR_BUNDLE = "/static/vendor/tasks-vision/vision_bundle.mjs";
const VENDOR_WASM = "/static/vendor/tasks-vision/wasm";
const VENDOR_MODEL = "/static/vendor/models/face_landmarker.task";

// ---- DOM ----
const $ = (id) => document.getElementById(id);
const screens = { landing: $("landing"), task: $("task"), results: $("results") };
function show(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle("active", k === name);
}
function overlay(msg) {
  $("overlay-msg").textContent = msg;
  $("overlay").classList.toggle("hidden", !msg);
}

// ---- state ----
let CFG = null;               // /api/headpoint_config payload
let landmarker = null;
let stream = null;
const video = $("preview");
let lastTs = 0;

let neutral = null;           // {yaw, pitch} captured neutral pose
let smoothHead = null;        // EMA-smoothed {yaw, pitch}
let previewLoop = null;

// ============================================================
// MediaPipe + camera (mirrors app.js)
// ============================================================
async function fileExists(url) {
  try { const r = await fetch(url, { method: "GET", cache: "force-cache" }); return r.ok; }
  catch { return false; }
}

async function loadLandmarker() {
  overlay("Loading MediaPipe FaceLandmarker…");
  const vendored = await fileExists(VENDOR_BUNDLE);
  let vision;
  try {
    vision = await import(vendored ? VENDOR_BUNDLE : `${CDN_BASE}/vision_bundle.mjs`);
  } catch { vision = await import(`${CDN_BASE}/vision_bundle.mjs`); }
  const { FilesetResolver, FaceLandmarker } = vision;
  const wasmBase = vendored ? VENDOR_WASM : `${CDN_BASE}/wasm`;
  const modelPath = (vendored && (await fileExists(VENDOR_MODEL))) ? VENDOR_MODEL : MODEL_URL_REMOTE;
  const fileset = await FilesetResolver.forVisionTasks(wasmBase);
  landmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: modelPath },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFacialTransformationMatrixes: true,
    outputFaceBlendshapes: false,
  });
  overlay("");
}

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
  });
  video.srcObject = stream;
  await video.play();
}

function cameraResolution() {
  const t = stream && stream.getVideoTracks()[0];
  const s = t ? t.getSettings() : {};
  return [s.width || video.videoWidth || 1280, s.height || video.videoHeight || 720];
}

function detectNow() {
  if (!landmarker || video.readyState < 2) return null;
  let ts = performance.now();
  if (ts <= lastTs) ts = lastTs + 1;
  lastTs = ts;
  try { return landmarker.detectForVideo(video, ts); } catch { return null; }
}

// Head pose (yaw,pitch) in radians from the rigid transform matrix.
function extractHead(res) {
  if (!res || !res.faceLandmarks || res.faceLandmarks.length === 0) return null;
  const mats = res.facialTransformationMatrixes;
  if (!mats || !mats.length || !mats[0].data || mats[0].data.length < 16) return null;
  const m = mats[0].data;
  const R00 = m[0], R10 = m[1], R20 = m[2], R21 = m[6], R22 = m[10];
  const sy = Math.hypot(R00, R10);
  // Map each Euler angle to the head motion that should drive that cursor axis.
  // MediaPipe's face transform frame is ~ X=right, Y=up, Z=out-of-face, so:
  //   yaw   = rotation about Y (up axis)   = turning head left/right -> cursor X
  //   pitch = rotation about X (right axis)= nodding up/down          -> cursor Y
  //   roll  = rotation about Z (optical)   = head tilt (NOT used for the cursor)
  // The earlier build bound cursor X to the Z-axis (roll/tilt) angle, which
  // barely changes when you turn your head — hence "only up/down moved".
  const yaw = Math.atan2(-R20, sy);     // horizontal (head turn)
  const pitch = Math.atan2(R21, R22);   // vertical (nod)
  const roll = Math.atan2(R10, R00);    // tilt (unused for pointing)
  if (![yaw, pitch, roll].every(Number.isFinite)) return null;
  return { yaw, pitch, roll };
}

// ============================================================
// Cursor mapping
// ============================================================
function currentGain() { return parseFloat($("gain").value) || 4000; }
function invertYaw() { return $("invert_yaw").checked; }
function invertPitch() { return $("invert_pitch").checked; }

function headToCursor(head, W, H, gain) {
  // Relative to neutral pose, scaled by gain; EMA-smoothed upstream.
  const n = neutral || { yaw: head.yaw, pitch: head.pitch };
  const sx = invertYaw() ? -1 : 1;
  const sy = invertPitch() ? -1 : 1;
  const cx = W / 2 + sx * gain * (head.yaw - n.yaw);
  const cy = H / 2 + sy * gain * (head.pitch - n.pitch);
  return [Math.max(0, Math.min(W, cx)), Math.max(0, Math.min(H, cy))];
}

function smooth(head) {
  const a = (CFG.control && CFG.control.smoothing_alpha) || 0.5;
  if (!smoothHead) smoothHead = { yaw: head.yaw, pitch: head.pitch };
  else {
    smoothHead.yaw = a * head.yaw + (1 - a) * smoothHead.yaw;
    smoothHead.pitch = a * head.pitch + (1 - a) * smoothHead.pitch;
  }
  return smoothHead;
}

// ============================================================
// Landing / pre-flight
// ============================================================
function prefillGeometry() {
  const d = (CFG && CFG.screen_defaults) || {};
  if (d.width_mm != null) $("width_mm").value = d.width_mm;
  if (d.height_mm != null) $("height_mm").value = d.height_mm;
  if (d.viewing_distance_mm != null) $("viewing_cm").value = Math.round(d.viewing_distance_mm / 10);
  updatePxReadout();
}
function updatePxReadout() {
  $("px-readout").textContent =
    `Detected screen: ${window.screen.width}×${window.screen.height} px ` +
    `(devicePixelRatio ${window.devicePixelRatio || 1}).`;
}
function applyDiagonal() {
  const diag = parseFloat($("diag_in").value);
  if (!Number.isFinite(diag) || diag <= 0) return;
  const norm = Math.hypot(16, 9), diagMm = diag * 25.4;
  $("width_mm").value = Math.round((diagMm * 16) / norm);
  $("height_mm").value = Math.round((diagMm * 9) / norm);
}
function geometryValid() {
  return ["width_mm", "height_mm", "viewing_cm"]
    .map((id) => parseFloat($(id).value)).every((v) => Number.isFinite(v) && v > 0);
}
function readyToStart() {
  return !!neutral && geometryValid();
}

// live preview: small canvas showing the head-driven cursor
const pv = $("preview-stage");
const pvctx = pv.getContext("2d");
function startPreview() {
  const badge = $("face-indicator");
  const tick = () => {
    const res = detectNow();
    const head = extractHead(res);
    const ok = !!head;
    badge.textContent = ok ? "face detected ✓" : "face: searching…";
    badge.classList.toggle("good", ok);
    badge.classList.toggle("bad", !ok);
    $("gain-readout").textContent = Math.round(currentGain());
    if (head) {
      const sm = smooth(head);
      const [cx, cy] = headToCursor(sm, pv.width, pv.height, currentGain() * (pv.width / window.screen.width));
      pvctx.clearRect(0, 0, pv.width, pv.height);
      // center crosshair
      pvctx.strokeStyle = "#3a3f4b"; pvctx.lineWidth = 1;
      pvctx.beginPath(); pvctx.moveTo(pv.width / 2, 0); pvctx.lineTo(pv.width / 2, pv.height);
      pvctx.moveTo(0, pv.height / 2); pvctx.lineTo(pv.width, pv.height / 2); pvctx.stroke();
      pvctx.beginPath(); pvctx.arc(cx, cy, 8, 0, 2 * Math.PI);
      pvctx.fillStyle = "#4da3ff"; pvctx.fill();
    }
    $("start-btn").disabled = !readyToStart();
    previewLoop = requestAnimationFrame(tick);
  };
  previewLoop = requestAnimationFrame(tick);
}

async function captureNeutral() {
  const durMs = (CFG.control && CFG.control.neutral_capture_ms) || 1000;
  $("neutral-status").textContent = "hold still…";
  const samples = [];
  const t0 = performance.now();
  await new Promise((resolve) => {
    const grab = () => {
      const head = extractHead(detectNow());
      if (head) samples.push(head);
      if (performance.now() - t0 < durMs) requestAnimationFrame(grab);
      else resolve();
    };
    requestAnimationFrame(grab);
  });
  if (samples.length < 3) { $("neutral-status").textContent = "no face — try again"; return; }
  neutral = {
    yaw: samples.reduce((s, h) => s + h.yaw, 0) / samples.length,
    pitch: samples.reduce((s, h) => s + h.pitch, 0) / samples.length,
  };
  smoothHead = { yaw: neutral.yaw, pitch: neutral.pitch };
  $("neutral-status").textContent = "captured ✓";
}

// ============================================================
// Task (fullscreen closed-loop acquisition)
// ============================================================
const canvas = $("stage");
const ctx = canvas.getContext("2d");
let taskState = null;

function sizeCanvas() {
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = w; canvas.height = h;
  return [w, h];
}

function buildTrials(W, H) {
  const targets = CFG.targets || [];
  const mults = CFG.gain_multipliers || [1.0];
  const trials = [];
  for (const mult of mults) {
    let prev = null;
    for (const t of targets) {
      trials.push({
        gain_mult: mult,
        target_norm: [t.pos[0], t.pos[1]],
        target_radius_px: t.radius_px,
        prev_norm: prev,
      });
      prev = [t.pos[0], t.pos[1]];
    }
  }
  return trials;
}

async function enterFullscreen() {
  try { await document.documentElement.requestFullscreen(); } catch { /* windowed ok */ }
}

function drawFrame(tgtPx, radius, cursorPx, dwellFrac) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // target ring fills as dwell progresses
  ctx.beginPath();
  ctx.arc(tgtPx[0], tgtPx[1], radius, 0, 2 * Math.PI);
  ctx.fillStyle = dwellFrac > 0 ? "#2b5" : "#ff4d6d";
  ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1;
  ctx.lineWidth = 3; ctx.strokeStyle = "#ff4d6d";
  ctx.beginPath(); ctx.arc(tgtPx[0], tgtPx[1], radius, 0, 2 * Math.PI); ctx.stroke();
  if (dwellFrac > 0) {
    ctx.strokeStyle = "#2be"; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(tgtPx[0], tgtPx[1], radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * dwellFrac);
    ctx.stroke();
  }
  // cursor
  ctx.beginPath(); ctx.arc(cursorPx[0], cursorPx[1], 10, 0, 2 * Math.PI);
  ctx.fillStyle = "#4da3ff"; ctx.fill();
  ctx.beginPath(); ctx.arc(cursorPx[0], cursorPx[1], 3, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff"; ctx.fill();
}

function runTask() {
  const [W, H] = sizeCanvas();
  taskState = {
    W, H,
    baseGain: currentGain(),
    trials: buildTrials(W, H),
    idx: 0,
    completed: [],
    aborted: false,
    raf: null,
    // per-trial runtime:
    tStart: 0, insideSince: null, samples: [],
  };
  beginTrial();
  taskState.raf = requestAnimationFrame(taskLoop);
}

function beginTrial() {
  const st = taskState;
  st.tStart = performance.now();
  st.insideSince = null;
  st.samples = [];
}

function finalizeTrial(outcome, tAcquire) {
  const st = taskState;
  const tr = st.trials[st.idx];
  st.completed.push({
    gain_mult: tr.gain_mult,
    gain_px_per_rad: st.baseGain * tr.gain_mult,
    target_norm: tr.target_norm,
    target_radius_px: tr.target_radius_px,
    prev_norm: tr.prev_norm,
    outcome,
    t_appear_ms: 0,
    t_acquire_ms: tAcquire,
    samples: st.samples,
  });
  st.idx += 1;
  if (st.idx >= st.trials.length) finishTask();
  else beginTrial();
}

function taskLoop() {
  const st = taskState;
  if (!st || st.aborted) return;
  st.raf = requestAnimationFrame(taskLoop);
  const tr = st.trials[st.idx];
  if (!tr) return;

  const now = performance.now();
  const tRel = now - st.tStart;
  const gain = st.baseGain * tr.gain_mult;
  const tgtPx = [tr.target_norm[0] * st.W, tr.target_norm[1] * st.H];
  const radius = tr.target_radius_px;
  const dwellMs = CFG.dwell_ms || 600;
  const timeoutMs = CFG.timeout_ms || 8000;

  const head = extractHead(detectNow());
  let cursorPx = [st.W / 2, st.H / 2];
  if (head) {
    const sm = smooth(head);
    cursorPx = headToCursor(sm, st.W, st.H, gain);
    st.samples.push([
      Math.round(tRel), Math.round(cursorPx[0] * 100) / 100, Math.round(cursorPx[1] * 100) / 100,
      Math.round(sm.yaw * 1e5) / 1e5, Math.round(sm.pitch * 1e5) / 1e5,
    ]);
  }

  const dist = Math.hypot(cursorPx[0] - tgtPx[0], cursorPx[1] - tgtPx[1]);
  let dwellFrac = 0;
  if (dist <= radius) {
    if (st.insideSince == null) st.insideSince = tRel;
    dwellFrac = Math.min(1, (tRel - st.insideSince) / dwellMs);
    if (tRel - st.insideSince >= dwellMs) { drawFrame(tgtPx, radius, cursorPx, 1); finalizeTrial("hit", tRel); return; }
  } else {
    st.insideSince = null;
  }

  if (tRel >= timeoutMs) { finalizeTrial("miss", null); return; }

  drawFrame(tgtPx, radius, cursorPx, dwellFrac);
  const totalTrials = st.trials.length;
  $("phase-hud").textContent =
    `target ${st.idx + 1}/${totalTrials} · gain ×${tr.gain_mult} · ${(tRel / 1000).toFixed(1)}s`;
}

function stopTaskLoop() { if (taskState && taskState.raf) cancelAnimationFrame(taskState.raf); }

async function finishTask() {
  const st = taskState;
  stopTaskLoop();
  st.aborted = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ignore */ } }
  await submitAndScore(st.completed);
}

function abortTask() {
  if (!taskState) return;
  taskState.aborted = true;
  stopTaskLoop();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  overlay(""); show("landing"); startPreview();
}

// ============================================================
// Submit + score
// ============================================================
async function submitAndScore(trials) {
  if (!trials.length) {
    overlay("No trials collected. Returning…");
    setTimeout(() => { overlay(""); show("landing"); startPreview(); }, 1500);
    return;
  }
  overlay("Saving session…");
  const meta = {
    screen_px: [taskState.W, taskState.H],
    screen_mm: [parseFloat($("width_mm").value), parseFloat($("height_mm").value)],
    viewing_distance_mm: parseFloat($("viewing_cm").value) * 10,
    camera: cameraResolution(),
    chosen_gain_px_per_rad: taskState.baseGain,
    smoothing_alpha: (CFG.control && CFG.control.smoothing_alpha) || 0.5,
    invert_pitch: invertPitch(),
    neutral: neutral || {},
    user_agent: navigator.userAgent,
  };
  let sessionId;
  try {
    const r = await fetch("/api/headpoint_session", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meta, trials }),
    });
    if (!r.ok) throw new Error(`session save failed: ${r.status} ${await r.text()}`);
    sessionId = (await r.json()).session_id;
  } catch (e) { overlay(`Error saving session: ${e.message}`); return; }

  overlay("Scoring…");
  try {
    const r = await fetch("/api/headpoint_analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    if (!r.ok) throw new Error(`analyze failed: ${r.status} ${await r.text()}`);
    const metrics = await r.json();
    overlay("");
    renderResults(metrics, sessionId);
  } catch (e) { overlay(`Error scoring session: ${e.message}`); }
}

// ============================================================
// Results
// ============================================================
function fmt(v, d = 2) { return v == null || Number.isNaN(v) ? "–" : Number(v).toFixed(d); }

function verdictLine(o) {
  if (!o) return "";
  const sr = o.success_rate == null ? "–" : `${Math.round(o.success_rate * 100)}%`;
  return `Closed-loop head pointing: ${sr} of targets acquired, ` +
    `${fmt(o.median_acquire_ms, 0)} ms median to lock, ` +
    `${fmt(o.median_settle_deg)}° (${fmt(o.median_settle_cm)} cm) settling, ` +
    `throughput ${fmt(o.median_throughput_bps)} bits/s.`;
}

function overallTable(o) {
  if (!o) return "";
  const rows = [
    ["success rate", o.success_rate == null ? "–" : `${Math.round(o.success_rate * 100)}%`],
    ["median acquisition", `${fmt(o.median_acquire_ms, 0)} ms`],
    ["median settling", `${fmt(o.median_settle_deg)}° (${fmt(o.median_settle_cm)} cm)`],
    ["mean overshoot", fmt(o.mean_overshoot, 1)],
    ["median path efficiency", fmt(o.median_path_eff)],
    ["throughput", `${fmt(o.median_throughput_bps)} bits/s`],
  ];
  return `<table><caption>Overall</caption><tbody>${
    rows.map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right">${v}</td></tr>`).join("")
  }</tbody></table>`;
}

function gainTable(byGain) {
  if (!byGain) return "";
  const keys = Object.keys(byGain);
  return `<table><caption>Gain robustness</caption>
    <thead><tr><th>gain</th><th>success</th><th>acquire (ms)</th><th>settle (°)</th></tr></thead>
    <tbody>${keys.map((k) => {
      const g = byGain[k];
      const sr = g.success_rate == null ? "–" : `${Math.round(g.success_rate * 100)}%`;
      return `<tr><td>${k.replace("gain_", "")}</td><td>${sr}</td>` +
             `<td>${fmt(g.median_acquire_ms, 0)}</td><td>${fmt(g.median_settle_deg)}</td></tr>`;
    }).join("")}</tbody></table>`;
}

function renderResults(metrics, sessionId) {
  const o = metrics.overall || {};
  $("verdict").textContent = verdictLine(o);
  $("metrics-tables").innerHTML = overallTable(o) + gainTable(metrics.by_gain);
  const meta = metrics.meta || {};
  $("results-meta").textContent =
    `session ${sessionId} · n_trials=${o.n_trials ?? "?"} · dwell=${meta.dwell_ms ?? "?"} ms ` +
    `· viewing_distance=${meta.viewing_distance_mm ?? "?"} mm.`;
  show("results");
}

// ============================================================
// Wiring
// ============================================================
async function init() {
  try { CFG = await (await fetch("/api/headpoint_config")).json(); }
  catch (e) { overlay(`Failed to load /api/headpoint_config: ${e.message}`); return; }

  // gain slider bounds from config
  const c = CFG.control || {};
  if (c.gain_slider_min != null) $("gain").min = c.gain_slider_min;
  if (c.gain_slider_max != null) $("gain").max = c.gain_slider_max;
  if (c.default_gain_px_per_rad != null) $("gain").value = c.default_gain_px_per_rad;
  if (c.invert_pitch) $("invert_pitch").checked = true;

  prefillGeometry();
  try { await startCamera(); } catch (e) { overlay(`Camera denied/unavailable: ${e.message}`); return; }
  try { await loadLandmarker(); } catch (e) { overlay(`Failed to load MediaPipe: ${e.message}`); return; }
  startPreview();

  $("diag-apply").addEventListener("click", applyDiagonal);
  $("neutral-btn").addEventListener("click", captureNeutral);

  $("start-btn").addEventListener("click", async () => {
    if (!readyToStart()) return;
    if (previewLoop) cancelAnimationFrame(previewLoop);
    show("task");
    await enterFullscreen();
    setTimeout(runTask, 120);
  });
  $("again-btn").addEventListener("click", () => {
    neutral = null; smoothHead = null;
    $("neutral-status").textContent = "";
    show("landing"); startPreview();
  });
}

window.addEventListener("keydown", (e) => {
  if (!screens.task.classList.contains("active")) return;
  if (e.code === "Escape") { e.preventDefault(); abortTask(); }
});
window.addEventListener("resize", () => {
  if (screens.task.classList.contains("active") && taskState && !taskState.aborted) {
    const [w, h] = sizeCanvas(); taskState.W = w; taskState.H = h;
  }
});

init();
