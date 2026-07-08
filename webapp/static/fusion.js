/*
 * In-browser gaze + head fusion controller ("eyes point, head nudges").
 *
 *   cursor = gaze_anchor + head_offset
 *            └─ coarse ─┘   └── fine ──┘
 *
 * Gaze (a client-side ridge map, live) sets a COARSE anchor; the head applies a
 * FINE relative offset. They are mutually gated by head motion so they never
 * fight: while the head moves, gaze is frozen (fine mode); the cursor only warps
 * to the gaze point when the head is quiet AND the gaze point is far from the
 * cursor AND gaze has settled (auto-warp, head-gated handoff). On a warp, the head
 * neutral re-zeros so nothing jumps, then the head fine-tunes from the new anchor.
 *
 * Self-contained module; imports only the pure ridge solver (node-tested).
 */
import { fitGazeModel, rmsResidualPx } from "/static/fusion_solve.mjs";

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
const screens = { landing: $("landing"), calib: $("calib"), fusion: $("fusion"), results: $("results") };
function show(name) { for (const [k, el] of Object.entries(screens)) el.classList.toggle("active", k === name); }
function showTunePanel(on) { $("tune-panel").classList.toggle("hidden", !on); }
function overlay(msg) { $("overlay-msg").textContent = msg; $("overlay").classList.toggle("hidden", !msg); }

// ---- state ----
let CFG = null, landmarker = null, stream = null, lastTs = 0;
const video = $("preview");
let neutral = null;          // head neutral {yaw,pitch}
let gazeModel = null;        // fitted ridge predictor
let calibResidualPx = null;  // fit quality
let previewLoop = null;

// ============================================================
// MediaPipe + camera
// ============================================================
async function fileExists(url) { try { const r = await fetch(url, { method: "GET", cache: "force-cache" }); return r.ok; } catch { return false; } }
async function loadLandmarker() {
  overlay("Loading MediaPipe FaceLandmarker…");
  const vendored = await fileExists(VENDOR_BUNDLE);
  let vision;
  try { vision = await import(vendored ? VENDOR_BUNDLE : `${CDN_BASE}/vision_bundle.mjs`); }
  catch { vision = await import(`${CDN_BASE}/vision_bundle.mjs`); }
  const { FilesetResolver, FaceLandmarker } = vision;
  const wasmBase = vendored ? VENDOR_WASM : `${CDN_BASE}/wasm`;
  const modelPath = (vendored && (await fileExists(VENDOR_MODEL))) ? VENDOR_MODEL : MODEL_URL_REMOTE;
  const fileset = await FilesetResolver.forVisionTasks(wasmBase);
  landmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: modelPath }, runningMode: "VIDEO",
    numFaces: 1, outputFacialTransformationMatrixes: true, outputFaceBlendshapes: false,
  });
  overlay("");
}
async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
  video.srcObject = stream; await video.play();
}
function cameraResolution() { const t = stream && stream.getVideoTracks()[0]; const s = t ? t.getSettings() : {}; return [s.width || 1280, s.height || 720]; }
function detectNow() {
  if (!landmarker || video.readyState < 2) return null;
  let ts = performance.now(); if (ts <= lastTs) ts = lastTs + 1; lastTs = ts;
  try { return landmarker.detectForVideo(video, ts); } catch { return null; }
}

// ============================================================
// Feature extraction: gaze (6-D iris) + head (forward vector)
// ============================================================
function extractGaze(res) {
  if (!res || !res.faceLandmarks || res.faceLandmarks.length === 0) return null;
  const L = res.faceLandmarks[0]; if (!L || L.length < 478) return null;
  const pt = (i) => L[i];
  const dist = (a, b) => Math.hypot(pt(a).x - pt(b).x, pt(a).y - pt(b).y);
  const mid = (a, b) => [(pt(a).x + pt(b).x) / 2, (pt(a).y + pt(b).y) / 2];
  const meanPts = (idxs) => { let sx = 0, sy = 0; for (const i of idxs) { sx += pt(i).x; sy += pt(i).y; } return [sx / idxs.length, sy / idxs.length]; };
  const iod = dist(33, 263) || 1e-6;
  const lIris = meanPts([468, 469, 470, 471, 472]), rIris = meanPts([473, 474, 475, 476, 477]);
  const lMid = mid(33, 133), rMid = mid(263, 362);
  const Ldx = (lIris[0] - lMid[0]) / iod, Ldy = (lIris[1] - lMid[1]) / iod;
  const Rdx = (rIris[0] - rMid[0]) / iod, Rdy = (rIris[1] - rMid[1]) / iod;
  const openL = dist(159, 145) / (dist(33, 133) || 1e-6), openR = dist(386, 374) / (dist(263, 362) || 1e-6);
  const f = [Ldx, Ldy, Rdx, Rdy, openL, openR];
  return f.every(Number.isFinite) ? f : null;
}
function extractHead(res) {
  if (!res || !res.facialTransformationMatrixes || !res.facialTransformationMatrixes.length) return null;
  const m = res.facialTransformationMatrixes[0].data; if (!m || m.length < 16) return null;
  const fx = m[8], fy = m[9], fz = m[10];
  const yaw = Math.atan2(fx, fz), pitch = Math.atan2(fy, fz);   // horizontal / vertical (see headpoint.js)
  return [yaw, pitch].every(Number.isFinite) ? { yaw, pitch } : null;
}

// ============================================================
// Tunables (persisted) — head feel + fusion gates
// ============================================================
const TUNE = { gain: 1000, minCutoff: 1.0, beta: 0.007, deadzone: 0 };
const GATES = { reanchorDeg: 6.0, headQuietDegps: 8.0, fixationMs: 100, gazeSettleDegps: 25.0 };
const TUNE_MIN = { gain: 400, minCutoff: 0.3, beta: 0, deadzone: 0, reanchorDeg: 2, headQuietDegps: 2, fixationMs: 0 };
const TUNE_MAX = { gain: 12000, minCutoff: 6, beta: 0.05, deadzone: 40, reanchorDeg: 20, headQuietDegps: 30, fixationMs: 400 };
function loadTune() {
  try {
    const s = JSON.parse(localStorage.getItem("fusion_tune") || "{}");
    Object.assign(TUNE, s.tune || {}); Object.assign(GATES, s.gates || {});
  } catch { /* ignore */ }
}
function saveTune() { try { localStorage.setItem("fusion_tune", JSON.stringify({ tune: TUNE, gates: GATES })); } catch { /* ignore */ } }

class OneEuro {
  constructor(minCutoff, beta, dCutoff = 1.0) { this.minCutoff = minCutoff; this.beta = beta; this.dCutoff = dCutoff; this.xPrev = null; this.dxPrev = 0; this.tPrev = null; }
  _alpha(cutoff, dt) { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); }
  filter(x, tMs) {
    if (this.xPrev === null) { this.xPrev = x; this.tPrev = tMs; return x; }
    let dt = (tMs - this.tPrev) / 1000; if (!(dt > 0)) dt = 1 / 60; this.tPrev = tMs;
    const dx = (x - this.xPrev) / dt, aD = this._alpha(this.dCutoff, dt);
    const edx = aD * dx + (1 - aD) * this.dxPrev; this.dxPrev = edx;
    const a = this._alpha(this.minCutoff + this.beta * Math.abs(edx), dt);
    const xf = a * x + (1 - a) * this.xPrev; this.xPrev = xf; return xf;
  }
}
let filtYaw = null, filtPitch = null;
function resetHeadFilters() { filtYaw = new OneEuro(TUNE.minCutoff, TUNE.beta); filtPitch = new OneEuro(TUNE.minCutoff, TUNE.beta); }

// ============================================================
// Geometry
// ============================================================
function mmPerPx() {
  const wm = parseFloat($("width_mm").value), hm = parseFloat($("height_mm").value);
  const W = window.screen.width, H = window.screen.height;
  return 0.5 * (wm / W + hm / H);
}
function degPerPx() {
  const vd = parseFloat($("viewing_cm").value) * 10; // mm
  return (mmPerPx() / vd) * 180 / Math.PI;            // small-angle linear approx
}

// ============================================================
// Landing helpers
// ============================================================
function prefillGeometry() {
  const d = (CFG && CFG.screen_defaults) || {};
  if (d.width_mm != null) $("width_mm").value = d.width_mm;
  if (d.height_mm != null) $("height_mm").value = d.height_mm;
  if (d.viewing_distance_mm != null) $("viewing_cm").value = Math.round(d.viewing_distance_mm / 10);
  updatePxReadout();
}
function updatePxReadout() { $("px-readout").textContent = `Screen ${window.screen.width}×${window.screen.height} px.`; }
function applyDiagonal() {
  const diag = parseFloat($("diag_in").value); if (!Number.isFinite(diag) || diag <= 0) return;
  const norm = Math.hypot(16, 9), diagMm = diag * 25.4;
  $("width_mm").value = Math.round((diagMm * 16) / norm); $("height_mm").value = Math.round((diagMm * 9) / norm);
}
function geometryValid() { return ["width_mm", "height_mm", "viewing_cm"].map((id) => parseFloat($(id).value)).every((v) => Number.isFinite(v) && v > 0); }
function invertYaw() { return $("invert_yaw").checked; }
function invertPitch() { return $("invert_pitch").checked; }

function startPreview() {
  const badge = $("face-indicator");
  const tick = () => {
    const res = detectNow(); const ok = !!extractHead(res) && !!extractGaze(res);
    badge.textContent = ok ? "face detected ✓" : "face: searching…";
    badge.classList.toggle("good", ok); badge.classList.toggle("bad", !ok);
    $("gain-readout").textContent = Math.round(TUNE.gain);
    $("calib-btn").disabled = !(neutral && geometryValid());
    $("start-btn").disabled = !(neutral && geometryValid() && gazeModel);
    previewLoop = requestAnimationFrame(tick);
  };
  previewLoop = requestAnimationFrame(tick);
}

async function captureNeutral() {
  $("neutral-status").textContent = "hold still…";
  const dur = 1000, t0 = performance.now(), samples = [];
  await new Promise((resolve) => {
    const grab = () => { const h = extractHead(detectNow()); if (h) samples.push(h); (performance.now() - t0 < dur) ? requestAnimationFrame(grab) : resolve(); };
    requestAnimationFrame(grab);
  });
  if (samples.length < 3) { $("neutral-status").textContent = "no face — try again"; return; }
  neutral = { yaw: samples.reduce((s, h) => s + h.yaw, 0) / samples.length, pitch: samples.reduce((s, h) => s + h.pitch, 0) / samples.length };
  resetHeadFilters(); $("neutral-status").textContent = "captured ✓";
}

// ============================================================
// Gaze calibration (fullscreen dots -> client-side ridge fit)
// ============================================================
const calibCanvas = $("calib-stage"), calibCtx = calibCanvas.getContext("2d");
async function runGazeCalibration() {
  show("calib");
  try { await document.documentElement.requestFullscreen(); } catch { /* windowed ok */ }
  await new Promise((r) => setTimeout(r, 120));
  const W = window.innerWidth, H = window.innerHeight; calibCanvas.width = W; calibCanvas.height = H;
  const targets = CFG.gaze_calibration.targets, framesPer = CFG.gaze_calibration.frames_per_target || 30, warmup = CFG.gaze_calibration.warmup_frames || 10;
  const Xraw = [], Ypx = [];
  let aborted = false;
  const onEsc = (e) => { if (e.code === "Escape") aborted = true; };
  window.addEventListener("keydown", onEsc);

  for (const t of targets) {
    if (aborted) break;
    const cx = t[0] * W, cy = t[1] * H;
    let warm = warmup; const frames = [];
    await new Promise((resolve) => {
      const loop = () => {
        if (aborted) return resolve();
        const res = detectNow();
        calibCtx.clearRect(0, 0, W, H);
        const prog = Math.min(1, frames.length / framesPer);
        calibCtx.beginPath(); calibCtx.arc(cx, cy, 16 + 24 * (1 - prog), -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * prog);
        calibCtx.strokeStyle = "#4da3ff"; calibCtx.lineWidth = 4; calibCtx.stroke();
        calibCtx.beginPath(); calibCtx.arc(cx, cy, 14, 0, 2 * Math.PI); calibCtx.fillStyle = "#ff4d6d"; calibCtx.fill();
        if (warm > 0) { warm--; }
        else { const f = extractGaze(res); if (f) frames.push(f); }
        if (frames.length >= framesPer) {
          const mean = frames[0].map((_, j) => frames.reduce((s, fr) => s + fr[j], 0) / frames.length);
          Xraw.push(mean); Ypx.push([cx, cy]); resolve();
        } else requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
  }
  window.removeEventListener("keydown", onEsc);
  if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ignore */ } }

  if (aborted || Xraw.length < targets.length) {
    gazeModel = null; $("calib-status").textContent = "cancelled"; show("landing"); startPreview(); return;
  }
  gazeModel = fitGazeModel(Xraw, Ypx, CFG.gaze_calibration.ridge_lambda || 1.0);
  calibResidualPx = rmsResidualPx(gazeModel, Xraw, Ypx);
  const dpp = degPerPx();
  $("calib-status").textContent = `done ✓ (fit residual ≈ ${(calibResidualPx * dpp).toFixed(1)}° / ${calibResidualPx.toFixed(0)}px)`;
  show("landing"); startPreview();
}

// ============================================================
// Fusion free-play
// ============================================================
const fcanvas = $("fusion-stage"), fctx = fcanvas.getContext("2d");
let fusionState = null;

function runFusion() {
  const W = window.innerWidth, H = window.innerHeight; fcanvas.width = W; fcanvas.height = H;
  resetHeadFilters();
  const dpp = degPerPx();
  fusionState = {
    W, H, dpp,
    anchor: [W / 2, H / 2], cursor: [W / 2, H / 2], headNeutral: { ...neutral },
    prevRawHead: null, prevGaze: null, gazeSettleSince: null,
    reanchors: 0, samples: [], events: [], t0: performance.now(),
    targets: (CFG.practice_targets || []).map((t) => [t.pos[0] * W, t.pos[1] * H, t.radius_px]),
    raf: null, aborted: false,
  };
  showTunePanel(true);
  fusionState.raf = requestAnimationFrame(fusionLoop);
}

function fusionLoop() {
  const st = fusionState; if (!st || st.aborted) return;
  st.raf = requestAnimationFrame(fusionLoop);
  const now = performance.now(), tRel = now - st.t0;
  const res = detectNow();
  const rawHead = extractHead(res), gazeFeat = extractGaze(res);

  // --- head speed (from RAW head, for the motion gate) ---
  let headSpeed = 0;
  if (rawHead && st.prevRawHead) {
    const dt = Math.max(1e-3, (now - st.prevRawHead.t) / 1000);
    headSpeed = Math.hypot(rawHead.yaw - st.prevRawHead.yaw, rawHead.pitch - st.prevRawHead.pitch) * 180 / Math.PI / dt;
  }
  if (rawHead) st.prevRawHead = { ...rawHead, t: now };

  // --- live gaze point (coarse), + gaze speed for settle detection ---
  let gazePt = null, gazeSpeed = Infinity;
  if (gazeFeat && gazeModel) {
    const p = gazeModel.predict(gazeFeat);
    gazePt = [Math.max(0, Math.min(st.W, p[0])), Math.max(0, Math.min(st.H, p[1]))];
    if (st.prevGaze) {
      const dt = Math.max(1e-3, (now - st.prevGaze.t) / 1000);
      gazeSpeed = Math.hypot(gazePt[0] - st.prevGaze.x, gazePt[1] - st.prevGaze.y) * st.dpp / dt;
    }
    st.prevGaze = { x: gazePt[0], y: gazePt[1], t: now };
  }

  // --- gaze settle timer ---
  if (gazeSpeed < GATES.gazeSettleDegps) { if (st.gazeSettleSince == null) st.gazeSettleSince = now; }
  else st.gazeSettleSince = null;
  const gazeSettled = st.gazeSettleSince != null && (now - st.gazeSettleSince) >= GATES.fixationMs;

  // --- head-gated auto-warp: re-anchor the cursor to the gaze point ---
  const headQuiet = headSpeed < GATES.headQuietDegps;
  const distDeg = gazePt ? Math.hypot(gazePt[0] - st.cursor[0], gazePt[1] - st.cursor[1]) * st.dpp : 0;
  let mode = "FINE (head)";
  if (rawHead && !headQuiet) {
    mode = "FINE (head)";
  } else if (gazePt && headQuiet && distDeg > GATES.reanchorDeg && gazeSettled) {
    // WARP: jump the anchor to the gaze point, re-zero head so no discontinuity.
    st.anchor = [gazePt[0], gazePt[1]];
    st.headNeutral = rawHead ? { ...rawHead } : st.headNeutral;
    resetHeadFilters();
    st.reanchors += 1; st.events.push({ t: Math.round(tRel), type: "warp", to: [Math.round(gazePt[0]), Math.round(gazePt[1])] });
    mode = "WARP →";
  } else if (gazePt && headQuiet && distDeg > GATES.reanchorDeg) {
    mode = "WARP-ARMED"; // far + head still, waiting for gaze to settle
  }

  // --- head fine offset (filtered), applied from the anchor ---
  let headOffset = [0, 0];
  if (rawHead) {
    const fy = filtYaw.filter(rawHead.yaw, now), fp = filtPitch.filter(rawHead.pitch, now);
    const sx = invertYaw() ? -1 : 1, sy = invertPitch() ? -1 : 1;
    headOffset = [sx * TUNE.gain * (fy - st.headNeutral.yaw), sy * TUNE.gain * (fp - st.headNeutral.pitch)];
  }
  let cx = st.anchor[0] + headOffset[0], cy = st.anchor[1] + headOffset[1];
  cx = Math.max(0, Math.min(st.W, cx)); cy = Math.max(0, Math.min(st.H, cy));
  // deadzone (freeze micro-wobble)
  if (TUNE.deadzone > 0 && Math.hypot(cx - st.cursor[0], cy - st.cursor[1]) <= TUNE.deadzone) { cx = st.cursor[0]; cy = st.cursor[1]; }
  st.cursor = [cx, cy];

  if (tRel % 33 < 17) st.samples.push([Math.round(tRel), Math.round(cx), Math.round(cy),
    gazePt ? Math.round(gazePt[0]) : null, gazePt ? Math.round(gazePt[1]) : null, Math.round(headSpeed), mode[0]]);

  drawFusion(st, gazePt, mode, headSpeed);
}

function drawFusion(st, gazePt, mode, headSpeed) {
  fctx.clearRect(0, 0, st.W, st.H);
  for (const [tx, ty, r] of st.targets) {
    const hit = Math.hypot(st.cursor[0] - tx, st.cursor[1] - ty) <= r;
    fctx.beginPath(); fctx.arc(tx, ty, r, 0, 2 * Math.PI);
    if (hit) { fctx.fillStyle = "rgba(46,204,113,0.25)"; fctx.fill(); }
    fctx.strokeStyle = "#4a5261"; fctx.lineWidth = 2; fctx.stroke();
  }
  if (gazePt) { // faint gaze point
    fctx.beginPath(); fctx.arc(gazePt[0], gazePt[1], 7, 0, 2 * Math.PI);
    fctx.strokeStyle = "rgba(255,210,80,0.7)"; fctx.lineWidth = 2; fctx.stroke();
  }
  // anchor (ring) + cursor (solid)
  fctx.beginPath(); fctx.arc(st.anchor[0], st.anchor[1], 5, 0, 2 * Math.PI); fctx.strokeStyle = "#7a8699"; fctx.stroke();
  fctx.beginPath(); fctx.arc(st.cursor[0], st.cursor[1], 10, 0, 2 * Math.PI); fctx.fillStyle = "#4da3ff"; fctx.fill();
  fctx.beginPath(); fctx.arc(st.cursor[0], st.cursor[1], 3, 0, 2 * Math.PI); fctx.fillStyle = "#fff"; fctx.fill();
  $("fusion-mode").textContent = `${mode} · head ${headSpeed.toFixed(0)}°/s · re-anchors ${st.reanchors}`;
  $("t-stats").textContent = `re-anchors: ${st.reanchors}`;
}

function stopFusion() { if (fusionState && fusionState.raf) cancelAnimationFrame(fusionState.raf); }
async function endFusion() {
  const st = fusionState; stopFusion(); if (st) st.aborted = true;
  showTunePanel(false); fctx.clearRect(0, 0, fcanvas.width, fcanvas.height);
  if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ignore */ } }
  await saveSession(st);
}

async function saveSession(st) {
  if (!st) { show("landing"); startPreview(); return; }
  overlay("Saving session…");
  const meta = {
    screen_px: [st.W, st.H], screen_mm: [parseFloat($("width_mm").value), parseFloat($("height_mm").value)],
    viewing_distance_mm: parseFloat($("viewing_cm").value) * 10, camera: cameraResolution(),
    gaze_calib_residual_px: calibResidualPx, gaze_calib_residual_deg: calibResidualPx * st.dpp,
    tune: { ...TUNE, invert_yaw: invertYaw(), invert_pitch: invertPitch(), filter: "one_euro" },
    gates: { ...GATES }, reanchors: st.reanchors, user_agent: navigator.userAgent,
  };
  try {
    const r = await fetch("/api/fusion_session", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meta, samples: st.samples, events: st.events }) });
    const j = r.ok ? await r.json() : { session_id: "(save failed)" };
    overlay("");
    $("verdict").textContent = `Session saved. ${st.reanchors} gaze re-anchors over ${((performance.now() - st.t0) / 1000).toFixed(0)}s of free play.`;
    $("results-meta").textContent = `${j.session_id} · gaze fit ≈ ${(calibResidualPx * st.dpp).toFixed(1)}° · head gain ${TUNE.gain} · re-anchor dist ${GATES.reanchorDeg}° · head-quiet ${GATES.headQuietDegps}°/s.`;
    show("results");
  } catch (e) { overlay(`Error saving: ${e.message}`); }
}

// ============================================================
// Tuning panel
// ============================================================
const steadyToCut = (s) => 6.0 - (s / 100) * (6.0 - 0.3);
const cutToSteady = (c) => Math.round((6.0 - c) / (6.0 - 0.3) * 100);
function refreshTunePanel() {
  $("t-gain").value = TUNE.gain; $("t-gain-val").textContent = Math.round(TUNE.gain);
  $("t-steady").value = cutToSteady(TUNE.minCutoff); $("t-steady-val").textContent = cutToSteady(TUNE.minCutoff);
  $("t-beta").value = TUNE.beta; $("t-beta-val").textContent = TUNE.beta.toFixed(3);
  $("t-dz").value = TUNE.deadzone; $("t-dz-val").textContent = TUNE.deadzone;
  $("t-red").value = GATES.reanchorDeg; $("t-red-val").textContent = GATES.reanchorDeg;
  $("t-hq").value = GATES.headQuietDegps; $("t-hq-val").textContent = GATES.headQuietDegps;
  $("t-fix").value = GATES.fixationMs; $("t-fix-val").textContent = GATES.fixationMs;
  if ($("gain")) { $("gain").value = TUNE.gain; $("gain-readout").textContent = Math.round(TUNE.gain); }
}
function wireTunePanel() {
  $("t-gain").addEventListener("input", (e) => { TUNE.gain = +e.target.value; saveTune(); refreshTunePanel(); });
  $("t-steady").addEventListener("input", (e) => { TUNE.minCutoff = steadyToCut(+e.target.value); saveTune(); refreshTunePanel(); });
  $("t-beta").addEventListener("input", (e) => { TUNE.beta = +e.target.value; saveTune(); refreshTunePanel(); });
  $("t-dz").addEventListener("input", (e) => { TUNE.deadzone = +e.target.value; saveTune(); refreshTunePanel(); });
  $("t-red").addEventListener("input", (e) => { GATES.reanchorDeg = +e.target.value; saveTune(); refreshTunePanel(); });
  $("t-hq").addEventListener("input", (e) => { GATES.headQuietDegps = +e.target.value; saveTune(); refreshTunePanel(); });
  $("t-fix").addEventListener("input", (e) => { GATES.fixationMs = +e.target.value; saveTune(); refreshTunePanel(); });
}
function tuneStep(obj, p, d, lo, hi) { obj[p] = Math.max(lo, Math.min(hi, obj[p] + d)); saveTune(); refreshTunePanel(); }

// ============================================================
// Wiring
// ============================================================
async function init() {
  try { CFG = await (await fetch("/api/fusion_config")).json(); }
  catch (e) { overlay(`Failed to load /api/fusion_config: ${e.message}`); return; }
  const c = CFG.control || {};
  if (c.default_gain_px_per_rad != null) TUNE.gain = c.default_gain_px_per_rad;
  if (c.min_cutoff != null) TUNE.minCutoff = c.min_cutoff;
  if (c.beta != null) TUNE.beta = c.beta;
  if (c.deadzone != null) TUNE.deadzone = c.deadzone;
  Object.assign(GATES, {
    reanchorDeg: CFG.fusion?.reanchor_dist_deg ?? GATES.reanchorDeg,
    headQuietDegps: CFG.fusion?.head_quiet_degps ?? GATES.headQuietDegps,
    fixationMs: CFG.fusion?.fixation_ms ?? GATES.fixationMs,
    gazeSettleDegps: CFG.fusion?.gaze_settle_degps ?? GATES.gazeSettleDegps,
  });
  loadTune(); wireTunePanel(); refreshTunePanel();

  prefillGeometry();
  try { await startCamera(); } catch (e) { overlay(`Camera denied/unavailable: ${e.message}`); return; }
  try { await loadLandmarker(); } catch (e) { overlay(`Failed to load MediaPipe: ${e.message}`); return; }
  startPreview();

  $("diag-apply").addEventListener("click", applyDiagonal);
  $("neutral-btn").addEventListener("click", captureNeutral);
  $("gain").addEventListener("input", (e) => { TUNE.gain = +e.target.value; saveTune(); refreshTunePanel(); });
  $("calib-btn").addEventListener("click", () => { if (previewLoop) cancelAnimationFrame(previewLoop); runGazeCalibration(); });
  $("start-btn").addEventListener("click", async () => {
    if (!(neutral && geometryValid() && gazeModel)) return;
    if (previewLoop) cancelAnimationFrame(previewLoop);
    show("fusion"); await document.documentElement.requestFullscreen().catch(() => {});
    setTimeout(runFusion, 120);
  });
  $("again-btn").addEventListener("click", () => { show("landing"); startPreview(); });
}

window.addEventListener("keydown", (e) => {
  if (!screens.fusion.classList.contains("active")) return;
  if (e.code === "Escape") { e.preventDefault(); endFusion(); return; }
  const t = {
    "[": () => tuneStep(TUNE, "gain", -250, TUNE_MIN.gain, TUNE_MAX.gain),
    "]": () => tuneStep(TUNE, "gain", 250, TUNE_MIN.gain, TUNE_MAX.gain),
    "-": () => tuneStep(TUNE, "minCutoff", -0.3, TUNE_MIN.minCutoff, TUNE_MAX.minCutoff),
    "=": () => tuneStep(TUNE, "minCutoff", 0.3, TUNE_MIN.minCutoff, TUNE_MAX.minCutoff),
    ";": () => tuneStep(TUNE, "beta", -0.002, TUNE_MIN.beta, TUNE_MAX.beta),
    "'": () => tuneStep(TUNE, "beta", 0.002, TUNE_MIN.beta, TUNE_MAX.beta),
    ",": () => tuneStep(TUNE, "deadzone", -2, TUNE_MIN.deadzone, TUNE_MAX.deadzone),
    ".": () => tuneStep(TUNE, "deadzone", 2, TUNE_MIN.deadzone, TUNE_MAX.deadzone),
    "9": () => tuneStep(GATES, "reanchorDeg", -0.5, TUNE_MIN.reanchorDeg, TUNE_MAX.reanchorDeg),
    "0": () => tuneStep(GATES, "reanchorDeg", 0.5, TUNE_MIN.reanchorDeg, TUNE_MAX.reanchorDeg),
  };
  if (t[e.key]) { e.preventDefault(); t[e.key](); }
});
window.addEventListener("resize", () => {
  if (screens.fusion.classList.contains("active") && fusionState && !fusionState.aborted) {
    fusionState.W = window.innerWidth; fusionState.H = window.innerHeight;
    fcanvas.width = fusionState.W; fcanvas.height = fusionState.H;
  }
});

window.addEventListener("pagehide", () => { try { stream && stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ } });
init();
