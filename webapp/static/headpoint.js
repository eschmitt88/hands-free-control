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
const screens = { landing: $("landing"), sandbox: $("sandbox"), task: $("task"), results: $("results") };
function showTunePanel(on) { $("tune-panel").classList.toggle("hidden", !on); }
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

// Head pointing signal from the rigid transform matrix (column-major 4x4).
//
// Rather than decompose Euler angles (whose axis labels depend on a convention
// that's easy to get wrong), use the head-FORWARD direction directly: the image
// of the model's local Z axis is the 3rd column = (m8, m9, m10). Turning your
// head left/right swings that vector sideways (m8, the world-X component);
// nodding swings it up/down (m9). atan2 against the forward depth (m10) gives
// stable, decoupled horizontal/vertical pointing angles in radians. Sign is
// handled by the invert toggles.
// Raw head-forward components (for the live diagnostic readout).
function extractHeadRaw(res) {
  const m = res.facialTransformationMatrixes[0].data;
  return { fx: m[8], fy: m[9], fz: m[10] };
}

function extractHead(res) {
  if (!res || !res.faceLandmarks || res.faceLandmarks.length === 0) return null;
  const mats = res.facialTransformationMatrixes;
  if (!mats || !mats.length || !mats[0].data || mats[0].data.length < 16) return null;
  const m = mats[0].data;
  const fx = m[8], fy = m[9], fz = m[10];   // head-forward direction in world space
  // Axes are correct as-is (confirmed by the user: correct once BOTH invert
  // toggles were on — i.e. only the signs were flipped, not the axes). Horizontal
  // = fx (turning swings the forward vector sideways), vertical = fy (nodding).
  const yaw = Math.atan2(fx, fz);           // horizontal (turn left/right)
  const pitch = Math.atan2(fy, fz);         // vertical (nod up/down)
  const roll = Math.atan2(m[1], m[0]);      // in-plane tilt (unused for pointing)
  if (![yaw, pitch, roll].every(Number.isFinite)) return null;
  return { yaw, pitch, roll };
}

// ============================================================
// Live-tunable levers (persisted; adjustable during the task/sandbox)
// ============================================================
const TUNE = {
  gain: 4000,        // px per radian of head rotation
  minCutoff: 1.0,    // One-Euro min cutoff (Hz): LOWER = smoother/steadier at rest
  beta: 0.007,       // One-Euro speed coefficient: HIGHER = less lag when moving fast
  deadzone: 0,       // px: freeze cursor until head moves it past this radius (kills micro-wobble)
};
function loadTune() {
  try { Object.assign(TUNE, JSON.parse(localStorage.getItem("hp_tune") || "{}")); } catch { /* ignore */ }
}
function saveTune() {
  try { localStorage.setItem("hp_tune", JSON.stringify(TUNE)); } catch { /* ignore */ }
}

// One-Euro filter (Casiez et al. 2012): adaptive low-pass — smooth when still,
// responsive when moving. Far better than a fixed EMA for pointer wobble.
class OneEuro {
  constructor(minCutoff, beta, dCutoff = 1.0) {
    this.minCutoff = minCutoff; this.beta = beta; this.dCutoff = dCutoff;
    this.xPrev = null; this.dxPrev = 0; this.tPrev = null;
  }
  reset() { this.xPrev = null; this.dxPrev = 0; this.tPrev = null; }
  _alpha(cutoff, dt) { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); }
  filter(x, tMs) {
    if (this.xPrev === null) { this.xPrev = x; this.tPrev = tMs; return x; }
    let dt = (tMs - this.tPrev) / 1000; if (!(dt > 0)) dt = 1 / 60;
    this.tPrev = tMs;
    const dx = (x - this.xPrev) / dt;
    const aD = this._alpha(this.dCutoff, dt);
    const edx = aD * dx + (1 - aD) * this.dxPrev; this.dxPrev = edx;
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const a = this._alpha(cutoff, dt);
    const xf = a * x + (1 - a) * this.xPrev; this.xPrev = xf;
    return xf;
  }
}
let filtYaw = null, filtPitch = null, heldCursor = null;
function resetFilters() {
  filtYaw = new OneEuro(TUNE.minCutoff, TUNE.beta);
  filtPitch = new OneEuro(TUNE.minCutoff, TUNE.beta);
  heldCursor = null;
}

// ============================================================
// Cursor mapping
// ============================================================
function currentGain() { return TUNE.gain; }
function invertYaw() { return $("invert_yaw").checked; }
function invertPitch() { return $("invert_pitch").checked; }

function applyDeadzone(cx, cy) {
  if (TUNE.deadzone <= 0) { heldCursor = [cx, cy]; return [cx, cy]; }
  if (!heldCursor) heldCursor = [cx, cy];
  if (Math.hypot(cx - heldCursor[0], cy - heldCursor[1]) > TUNE.deadzone) heldCursor = [cx, cy];
  return heldCursor;
}

function headToCursor(head, W, H, gain) {
  // Relative to neutral pose, scaled by gain; One-Euro-filtered upstream.
  const n = neutral || { yaw: head.yaw, pitch: head.pitch };
  const sx = invertYaw() ? -1 : 1;
  const sy = invertPitch() ? -1 : 1;
  let cx = W / 2 + sx * gain * (head.yaw - n.yaw);
  let cy = H / 2 + sy * gain * (head.pitch - n.pitch);
  [cx, cy] = applyDeadzone(cx, cy);
  return [Math.max(0, Math.min(W, cx)), Math.max(0, Math.min(H, cy))];
}

function smooth(head, tMs) {
  if (!filtYaw) resetFilters();
  filtYaw.minCutoff = TUNE.minCutoff; filtYaw.beta = TUNE.beta;
  filtPitch.minCutoff = TUNE.minCutoff; filtPitch.beta = TUNE.beta;
  const t = tMs == null ? performance.now() : tMs;
  return { yaw: filtYaw.filter(head.yaw, t), pitch: filtPitch.filter(head.pitch, t), roll: head.roll };
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

      // live diagnostic: horizontal/vertical signal relative to neutral (deg)
      const n = neutral || { yaw: sm.yaw, pitch: sm.pitch };
      const hDeg = ((sm.yaw - n.yaw) * 180 / Math.PI).toFixed(1);
      const vDeg = ((sm.pitch - n.pitch) * 180 / Math.PI).toFixed(1);
      const raw = extractHeadRaw(res);
      $("head-debug").textContent =
        `head signal — horizontal: ${hDeg}°   vertical: ${vDeg}°   ` +
        `(fwd x=${raw.fx.toFixed(2)} y=${raw.fy.toFixed(2)} z=${raw.fz.toFixed(2)})`;
    }
    $("start-btn").disabled = !readyToStart();
    $("sandbox-btn").disabled = !neutral;
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
  resetFilters();
  $("neutral-status").textContent = "captured ✓";
}

// ============================================================
// Live tuning panel (shown in sandbox + task; drag sliders or use keys)
// ============================================================
const TUNE_MIN = { gain: 400, minCutoff: 0.3, beta: 0, deadzone: 0 };
const TUNE_MAX = { gain: 12000, minCutoff: 6, beta: 0.05, deadzone: 40 };
// "Steadiness" slider (0..100) maps INVERSELY to One-Euro minCutoff so higher = steadier.
const steadyToCut = (s) => 6.0 - (s / 100) * (6.0 - 0.3);
const cutToSteady = (c) => Math.round((6.0 - c) / (6.0 - 0.3) * 100);

function refreshTunePanel() {
  $("t-gain").value = TUNE.gain; $("t-gain-val").textContent = Math.round(TUNE.gain);
  $("t-steady").value = cutToSteady(TUNE.minCutoff); $("t-steady-val").textContent = cutToSteady(TUNE.minCutoff);
  $("t-beta").value = TUNE.beta; $("t-beta-val").textContent = TUNE.beta.toFixed(3);
  $("t-dz").value = TUNE.deadzone; $("t-dz-val").textContent = TUNE.deadzone;
  // keep the landing gain slider + readout in sync
  if ($("gain")) $("gain").value = TUNE.gain;
  if ($("gain-readout")) $("gain-readout").textContent = Math.round(TUNE.gain);
}
function wireTunePanel() {
  $("t-gain").addEventListener("input", (e) => { TUNE.gain = parseFloat(e.target.value); saveTune(); refreshTunePanel(); });
  $("t-steady").addEventListener("input", (e) => { TUNE.minCutoff = steadyToCut(parseFloat(e.target.value)); saveTune(); refreshTunePanel(); });
  $("t-beta").addEventListener("input", (e) => { TUNE.beta = parseFloat(e.target.value); saveTune(); refreshTunePanel(); });
  $("t-dz").addEventListener("input", (e) => { TUNE.deadzone = parseFloat(e.target.value); saveTune(); refreshTunePanel(); });
}
function tuneStep(p, d) {
  TUNE[p] = Math.max(TUNE_MIN[p], Math.min(TUNE_MAX[p], TUNE[p] + d));
  saveTune(); refreshTunePanel();
}

// ============================================================
// Tuning sandbox (free play — no scoring)
// ============================================================
const sbCanvas = $("sandbox-stage");
const sbctx = sbCanvas.getContext("2d");
let sandboxRaf = null;
const wobbleBuf = [];

function updateWobble() {
  if (wobbleBuf.length < 5) { $("t-wobble").textContent = "wobble: —"; return; }
  const mx = wobbleBuf.reduce((s, p) => s + p[0], 0) / wobbleBuf.length;
  const my = wobbleBuf.reduce((s, p) => s + p[1], 0) / wobbleBuf.length;
  const rms = Math.sqrt(wobbleBuf.reduce((s, p) => s + (p[0] - mx) ** 2 + (p[1] - my) ** 2, 0) / wobbleBuf.length);
  $("t-wobble").textContent = `wobble (RMS, last ${wobbleBuf.length}f): ${rms.toFixed(1)} px`;
}

function runSandbox() {
  const W = window.innerWidth, H = window.innerHeight;
  sbCanvas.width = W; sbCanvas.height = H;
  resetFilters(); wobbleBuf.length = 0;
  const targets = (CFG.targets || []).map((t) => [t.pos[0] * W, t.pos[1] * H, t.radius_px]);
  const loop = () => {
    sandboxRaf = requestAnimationFrame(loop);
    const head = extractHead(detectNow());
    sbctx.clearRect(0, 0, W, H);
    for (const [tx, ty, r] of targets) {
      sbctx.beginPath(); sbctx.arc(tx, ty, r, 0, 2 * Math.PI);
      sbctx.strokeStyle = "#4a5261"; sbctx.lineWidth = 2; sbctx.stroke();
    }
    if (head) {
      const sm = smooth(head);
      const [cx, cy] = headToCursor(sm, W, H, TUNE.gain);
      wobbleBuf.push([cx, cy]); if (wobbleBuf.length > 30) wobbleBuf.shift();
      for (const [tx, ty, r] of targets) {
        if (Math.hypot(cx - tx, cy - ty) <= r) {
          sbctx.beginPath(); sbctx.arc(tx, ty, r, 0, 2 * Math.PI);
          sbctx.fillStyle = "rgba(46,204,113,0.25)"; sbctx.fill();
        }
      }
      sbctx.beginPath(); sbctx.arc(cx, cy, 10, 0, 2 * Math.PI); sbctx.fillStyle = "#4da3ff"; sbctx.fill();
      sbctx.beginPath(); sbctx.arc(cx, cy, 3, 0, 2 * Math.PI); sbctx.fillStyle = "#fff"; sbctx.fill();
      updateWobble();
    }
  };
  loop();
}
function exitSandbox() {
  if (sandboxRaf) cancelAnimationFrame(sandboxRaf);
  sbctx.clearRect(0, 0, sbCanvas.width, sbCanvas.height);
  showTunePanel(false);
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  show("landing"); startPreview();
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
  showTunePanel(true);   // levers stay adjustable mid-task
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
  showTunePanel(false);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ignore */ } }
  await submitAndScore(st.completed);
}

function abortTask() {
  if (!taskState) return;
  taskState.aborted = true;
  stopTaskLoop();
  showTunePanel(false);
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
    tune: { gain: TUNE.gain, min_cutoff: TUNE.minCutoff, beta: TUNE.beta, deadzone: TUNE.deadzone,
            invert_yaw: invertYaw(), invert_pitch: invertPitch(), filter: "one_euro" },
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

  // gain slider bounds from config; default gain from config, then stored prefs.
  const c = CFG.control || {};
  if (c.gain_slider_min != null) $("gain").min = c.gain_slider_min;
  if (c.gain_slider_max != null) $("gain").max = c.gain_slider_max;
  if (c.default_gain_px_per_rad != null) TUNE.gain = c.default_gain_px_per_rad;
  loadTune();                 // localStorage overrides defaults (persisted feel)
  wireTunePanel();
  refreshTunePanel();

  prefillGeometry();
  try { await startCamera(); } catch (e) { overlay(`Camera denied/unavailable: ${e.message}`); return; }
  try { await loadLandmarker(); } catch (e) { overlay(`Failed to load MediaPipe: ${e.message}`); return; }
  startPreview();

  $("diag-apply").addEventListener("click", applyDiagonal);
  $("neutral-btn").addEventListener("click", captureNeutral);
  // landing gain slider shares TUNE.gain with the in-task/sandbox panel
  $("gain").addEventListener("input", (e) => { TUNE.gain = parseFloat(e.target.value); saveTune(); refreshTunePanel(); });

  $("sandbox-btn").addEventListener("click", async () => {
    if (!neutral) return;
    if (previewLoop) cancelAnimationFrame(previewLoop);
    show("sandbox");
    showTunePanel(true);
    await enterFullscreen();
    setTimeout(runSandbox, 120);
  });
  $("start-btn").addEventListener("click", async () => {
    if (!readyToStart()) return;
    if (previewLoop) cancelAnimationFrame(previewLoop);
    show("task");
    await enterFullscreen();
    setTimeout(runTask, 120);
  });
  $("again-btn").addEventListener("click", () => {
    neutral = null; resetFilters();
    $("neutral-status").textContent = "";
    show("landing"); startPreview();
  });
}

window.addEventListener("keydown", (e) => {
  const inTask = screens.task.classList.contains("active");
  const inSandbox = screens.sandbox.classList.contains("active");
  if (inTask && e.code === "Escape") { e.preventDefault(); abortTask(); return; }
  if (inSandbox && e.code === "Escape") { e.preventDefault(); exitSandbox(); return; }
  if (!(inTask || inSandbox)) return;
  // live tuning keys (work during sandbox AND the scored task)
  const steps = {
    "[": ["gain", -250], "]": ["gain", 250],
    "-": ["minCutoff", -0.3], "=": ["minCutoff", 0.3],   // lower cutoff = steadier
    ";": ["beta", -0.002], "'": ["beta", 0.002],
    ",": ["deadzone", -2], ".": ["deadzone", 2],
  };
  if (steps[e.key]) { e.preventDefault(); tuneStep(steps[e.key][0], steps[e.key][1]); }
});
window.addEventListener("resize", () => {
  if (screens.task.classList.contains("active") && taskState && !taskState.aborted) {
    const [w, h] = sizeCanvas(); taskState.W = w; taskState.H = h;
  }
  if (screens.sandbox.classList.contains("active")) {
    sbCanvas.width = window.innerWidth; sbCanvas.height = window.innerHeight;
  }
});

init();
