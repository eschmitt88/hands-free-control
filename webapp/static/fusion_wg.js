/*
 * Fusion on WebGazer: gaze (WebGazer, coarse) + head (MediaPipe, fine).
 *
 * Same head-gated auto-warp controller as fusion.js, but the coarse channel is
 * WebGazer's gaze point (steadier: p95 9° vs our 27°) instead of our iris-ridge.
 * WebGazer owns the single camera; MediaPipe FaceLandmarker reads WebGazer's own
 * video canvas for head pose, so one camera stream feeds both signals.
 *
 * WebGazer is a global (loaded in fusion_wg.html); MediaPipe is imported dynamically.
 */

const TASKS_VISION_VERSION = "0.10.20";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}`;
const MODEL_URL_REMOTE =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const VENDOR_BUNDLE = "/static/vendor/tasks-vision/vision_bundle.mjs";
const VENDOR_WASM = "/static/vendor/tasks-vision/wasm";
const VENDOR_MODEL = "/static/vendor/models/face_landmarker.task";

const $ = (id) => document.getElementById(id);
const screens = { landing: $("landing"), calib: $("calib"), fusion: $("fusion"), results: $("results") };
const show = (n) => { for (const [k, el] of Object.entries(screens)) el.classList.toggle("active", k === n); };
const showTunePanel = (on) => $("tune-panel").classList.toggle("hidden", !on);
const overlay = (m) => { $("overlay-msg").textContent = m; $("overlay").classList.toggle("hidden", !m); };

let CFG = null, landmarker = null, lastTs = 0;
let neutral = null, latestGaze = null, wgReady = false, calibrated = false, previewLoop = null;

// ============================================================
// MediaPipe (head) — reads WebGazer's video canvas
// ============================================================
async function fileExists(url) { try { const r = await fetch(url, { method: "GET", cache: "force-cache" }); return r.ok; } catch { return false; } }
async function loadLandmarker() {
  overlay("Loading MediaPipe (head pose)…");
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

// WebGazer's live frame source (its processing canvas / video) for MediaPipe.
function wgFrameSource() {
  try { const c = webgazer.getVideoElementCanvas && webgazer.getVideoElementCanvas(); if (c && c.width) return c; } catch { /* ignore */ }
  const c2 = document.getElementById("webgazerVideoCanvas"); if (c2 && c2.width) return c2;
  const vid = (webgazer.params && document.getElementById(webgazer.params.videoElementId)) || document.querySelector("video");
  return (vid && vid.readyState >= 2) ? vid : null;
}
function detectHead() {
  const src = wgFrameSource(); if (!landmarker || !src) return null;
  let ts = performance.now(); if (ts <= lastTs) ts = lastTs + 1; lastTs = ts;
  let res; try { res = landmarker.detectForVideo(src, ts); } catch { return null; }
  if (!res || !res.facialTransformationMatrixes || !res.facialTransformationMatrixes.length) return null;
  const m = res.facialTransformationMatrixes[0].data; if (!m || m.length < 16) return null;
  const fx = m[8], fy = m[9], fz = m[10];
  const yaw = Math.atan2(fx, fz), pitch = Math.atan2(fy, fz);
  return [yaw, pitch].every(Number.isFinite) ? { yaw, pitch } : null;
}

// ============================================================
// WebGazer (gaze) — owns the camera
// ============================================================
async function initWebGazer() {
  overlay("Starting WebGazer + camera…");
  webgazer.setRegression("ridge").setGazeListener((d) => { if (d) latestGaze = { x: d.x, y: d.y }; });
  await webgazer.begin();
  try { webgazer.showVideoPreview(false).showPredictionPoints(false); } catch { /* ignore */ }
  try { webgazer.showFaceOverlay(false).showFaceFeedbackBox(false); } catch { /* ignore */ }
  try { webgazer.removeMouseEventListeners(); } catch { /* ignore */ }
  wgReady = true; overlay("");
}

// ============================================================
// Tunables + filter (identical to fusion.js)
// ============================================================
const TUNE = { gain: 1000, minCutoff: 1.0, beta: 0.007, deadzone: 0 };
const GATES = { reanchorDeg: 6.0, headQuietDegps: 8.0, fixationMs: 100, gazeSettleDegps: 25.0, headNearDeg: 8.0 };
const TUNE_MIN = { gain: 400, minCutoff: 0.3, beta: 0, deadzone: 0, reanchorDeg: 2, headQuietDegps: 2, fixationMs: 0, headNearDeg: 2 };
const TUNE_MAX = { gain: 12000, minCutoff: 6, beta: 0.05, deadzone: 40, reanchorDeg: 20, headQuietDegps: 30, fixationMs: 400, headNearDeg: 30 };
function loadTune() { try { const s = JSON.parse(localStorage.getItem("fusion_tune") || "{}"); Object.assign(TUNE, s.tune || {}); Object.assign(GATES, s.gates || {}); } catch { /* ignore */ } }
function saveTune() { try { localStorage.setItem("fusion_tune", JSON.stringify({ tune: TUNE, gates: GATES })); } catch { /* ignore */ } }
class OneEuro {
  constructor(mc, b, dC = 1.0) { this.minCutoff = mc; this.beta = b; this.dCutoff = dC; this.xPrev = null; this.dxPrev = 0; this.tPrev = null; }
  _alpha(c, dt) { const tau = 1 / (2 * Math.PI * c); return 1 / (1 + tau / dt); }
  filter(x, t) {
    if (this.xPrev === null) { this.xPrev = x; this.tPrev = t; return x; }
    let dt = (t - this.tPrev) / 1000; if (!(dt > 0)) dt = 1 / 60; this.tPrev = t;
    const dx = (x - this.xPrev) / dt, aD = this._alpha(this.dCutoff, dt);
    const edx = aD * dx + (1 - aD) * this.dxPrev; this.dxPrev = edx;
    const a = this._alpha(this.minCutoff + this.beta * Math.abs(edx), dt);
    const xf = a * x + (1 - a) * this.xPrev; this.xPrev = xf; return xf;
  }
}
let filtYaw = null, filtPitch = null;
function resetHeadFilters() { filtYaw = new OneEuro(TUNE.minCutoff, TUNE.beta); filtPitch = new OneEuro(TUNE.minCutoff, TUNE.beta); }

// ============================================================
// Geometry + landing helpers
// ============================================================
function mmPerPx() { const wm = parseFloat($("width_mm").value), hm = parseFloat($("height_mm").value); return 0.5 * (wm / window.screen.width + hm / window.screen.height); }
function degPerPx() { const vd = parseFloat($("viewing_cm").value) * 10; return (mmPerPx() / vd) * 180 / Math.PI; }
function prefillGeometry() { const d = (CFG && CFG.screen_defaults) || {}; if (d.width_mm != null) $("width_mm").value = d.width_mm; if (d.height_mm != null) $("height_mm").value = d.height_mm; if (d.viewing_distance_mm != null) $("viewing_cm").value = Math.round(d.viewing_distance_mm / 10); $("px-readout").textContent = `Screen ${window.screen.width}×${window.screen.height} px.`; }
function applyDiagonal() { const dg = parseFloat($("diag_in").value); if (!(dg > 0)) return; const n = Math.hypot(16, 9), mm = dg * 25.4; $("width_mm").value = Math.round(mm * 16 / n); $("height_mm").value = Math.round(mm * 9 / n); }
function geometryValid() { return ["width_mm", "height_mm", "viewing_cm"].map((i) => parseFloat($(i).value)).every((v) => v > 0); }
const invertYaw = () => $("invert_yaw").checked, invertPitch = () => $("invert_pitch").checked;

function startPreview() {
  const badge = $("face-indicator");
  const tick = () => {
    const head = wgReady ? detectHead() : null;
    const ok = !!head;
    badge.textContent = ok ? "face detected ✓" : (wgReady ? "face: searching…" : "starting…");
    badge.classList.toggle("good", ok); badge.classList.toggle("bad", !ok);
    $("gain-readout").textContent = Math.round(TUNE.gain);
    $("neutral-btn").disabled = !wgReady;
    $("calib-btn").disabled = !(neutral && geometryValid());
    $("start-btn").disabled = !(neutral && geometryValid() && calibrated);
    previewLoop = requestAnimationFrame(tick);
  };
  previewLoop = requestAnimationFrame(tick);
}

async function captureNeutral() {
  $("neutral-status").textContent = "hold still…";
  const dur = 1000, t0 = performance.now(), s = [];
  await new Promise((res) => { const g = () => { const h = detectHead(); if (h) s.push(h); (performance.now() - t0 < dur) ? requestAnimationFrame(g) : res(); }; requestAnimationFrame(g); });
  if (s.length < 3) { $("neutral-status").textContent = "no face — try again"; return; }
  neutral = { yaw: s.reduce((a, h) => a + h.yaw, 0) / s.length, pitch: s.reduce((a, h) => a + h.pitch, 0) / s.length };
  resetHeadFilters(); $("neutral-status").textContent = "captured ✓";
}

// ============================================================
// WebGazer gaze calibration (9-dot look-and-record)
// ============================================================
const calibCanvas = $("calib-stage"), calibCtx = calibCanvas.getContext("2d");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function runGazeCalibration() {
  show("calib");
  try { await document.documentElement.requestFullscreen(); } catch { /* ignore */ }
  await sleep(120);
  const W = window.innerWidth, H = window.innerHeight; calibCanvas.width = W; calibCanvas.height = H;
  const CAL = []; for (const y of [0.12, 0.5, 0.88]) for (const x of [0.12, 0.5, 0.88]) CAL.push([x, y]);
  let aborted = false; const onEsc = (e) => { if (e.code === "Escape") aborted = true; };
  window.addEventListener("keydown", onEsc);
  for (const [nx, ny] of CAL) {
    if (aborted) break;
    const cx = nx * W, cy = ny * H, t0 = performance.now();
    while (performance.now() - t0 < 2000 && !aborted) {
      const prog = Math.min(1, (performance.now() - t0) / 2000);
      calibCtx.clearRect(0, 0, W, H);
      calibCtx.beginPath(); calibCtx.arc(cx, cy, 16 + 22 * (1 - prog), -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * prog);
      calibCtx.strokeStyle = "#4da3ff"; calibCtx.lineWidth = 4; calibCtx.stroke();
      calibCtx.beginPath(); calibCtx.arc(cx, cy, 14, 0, 2 * Math.PI); calibCtx.fillStyle = "#ff4d6d"; calibCtx.fill();
      if (prog > 0.25) { try { webgazer.recordScreenPosition(cx, cy, "click"); } catch { /* ignore */ } }
      await sleep(16);
    }
  }
  window.removeEventListener("keydown", onEsc);
  if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ignore */ } }
  calibrated = !aborted;
  $("calib-status").textContent = calibrated ? "done ✓" : "cancelled";
  show("landing"); startPreview();
}

// ============================================================
// Fusion free-play (same head-gated auto-warp as fusion.js)
// ============================================================
const fcanvas = $("fusion-stage"), fctx = fcanvas.getContext("2d");
let fusionState = null;
function runFusion() {
  const W = window.innerWidth, H = window.innerHeight; fcanvas.width = W; fcanvas.height = H;
  resetHeadFilters();
  fusionState = {
    W, H, dpp: degPerPx(), anchor: [W / 2, H / 2], cursor: [W / 2, H / 2], headNeutral: { ...neutral },
    prevRawHead: null, prevGaze: null, gazeSettleSince: null, reanchors: 0, samples: [], events: [], t0: performance.now(),
    targets: (CFG.practice_targets || []).map((t) => [t.pos[0] * W, t.pos[1] * H, t.radius_px]), raf: null, aborted: false,
  };
  showTunePanel(true);
  fusionState.raf = requestAnimationFrame(fusionLoop);
}
function fusionLoop() {
  const st = fusionState; if (!st || st.aborted) return;
  st.raf = requestAnimationFrame(fusionLoop);
  const now = performance.now(), tRel = now - st.t0;
  const rawHead = detectHead();

  let headSpeed = 0;
  if (rawHead && st.prevRawHead) { const dt = Math.max(1e-3, (now - st.prevRawHead.t) / 1000); headSpeed = Math.hypot(rawHead.yaw - st.prevRawHead.yaw, rawHead.pitch - st.prevRawHead.pitch) * 180 / Math.PI / dt; }
  if (rawHead) st.prevRawHead = { ...rawHead, t: now };

  // gaze point straight from WebGazer (clamp to screen)
  let gazePt = null, gazeSpeed = Infinity;
  if (latestGaze) {
    gazePt = [Math.max(0, Math.min(st.W, latestGaze.x)), Math.max(0, Math.min(st.H, latestGaze.y))];
    if (st.prevGaze) { const dt = Math.max(1e-3, (now - st.prevGaze.t) / 1000); gazeSpeed = Math.hypot(gazePt[0] - st.prevGaze.x, gazePt[1] - st.prevGaze.y) * st.dpp / dt; }
    st.prevGaze = { x: gazePt[0], y: gazePt[1], t: now };
  }
  if (gazeSpeed < GATES.gazeSettleDegps) { if (st.gazeSettleSince == null) st.gazeSettleSince = now; } else st.gazeSettleSince = null;
  const gazeSettled = st.gazeSettleSince != null && (now - st.gazeSettleSince) >= GATES.fixationMs;

  const headQuiet = headSpeed < GATES.headQuietDegps;
  // Gaze is only valid near the calibration head pose — trust it only there.
  const headNear = rawHead ? (Math.hypot(rawHead.yaw - neutral.yaw, rawHead.pitch - neutral.pitch) * 180 / Math.PI < GATES.headNearDeg) : false;
  const distDeg = gazePt ? Math.hypot(gazePt[0] - st.cursor[0], gazePt[1] - st.cursor[1]) * st.dpp : 0;
  const wantWarp = gazePt && headQuiet && distDeg > GATES.reanchorDeg;
  let mode = "FINE (head)";
  if (rawHead && !headQuiet) { mode = "FINE (head)"; }
  else if (wantWarp && headNear && gazeSettled) {
    st.anchor = [gazePt[0], gazePt[1]]; st.headNeutral = rawHead ? { ...rawHead } : st.headNeutral; resetHeadFilters();
    st.reanchors += 1; st.events.push({ t: Math.round(tRel), type: "warp", to: [Math.round(gazePt[0]), Math.round(gazePt[1])] }); mode = "WARP →";
  } else if (wantWarp && !headNear) { mode = "RE-AIM · center head"; }   // gaze untrusted (head displaced)
  else if (wantWarp) { mode = "WARP-ARMED"; }

  let off = [0, 0];
  if (rawHead) { const fy = filtYaw.filter(rawHead.yaw, now), fp = filtPitch.filter(rawHead.pitch, now); off = [(invertYaw() ? -1 : 1) * TUNE.gain * (fy - st.headNeutral.yaw), (invertPitch() ? -1 : 1) * TUNE.gain * (fp - st.headNeutral.pitch)]; }
  let cx = Math.max(0, Math.min(st.W, st.anchor[0] + off[0])), cy = Math.max(0, Math.min(st.H, st.anchor[1] + off[1]));
  if (TUNE.deadzone > 0 && Math.hypot(cx - st.cursor[0], cy - st.cursor[1]) <= TUNE.deadzone) { cx = st.cursor[0]; cy = st.cursor[1]; }
  st.cursor = [cx, cy];

  if (tRel % 33 < 17) st.samples.push([Math.round(tRel), Math.round(cx), Math.round(cy), gazePt ? Math.round(gazePt[0]) : null, gazePt ? Math.round(gazePt[1]) : null, Math.round(headSpeed), mode[0]]);
  drawFusion(st, gazePt, mode, headSpeed);
}
function drawFusion(st, gazePt, mode, headSpeed) {
  fctx.clearRect(0, 0, st.W, st.H);
  for (const [tx, ty, r] of st.targets) {
    const hit = Math.hypot(st.cursor[0] - tx, st.cursor[1] - ty) <= r;
    fctx.beginPath(); fctx.arc(tx, ty, r, 0, 2 * Math.PI); if (hit) { fctx.fillStyle = "rgba(46,204,113,0.25)"; fctx.fill(); }
    fctx.strokeStyle = "#4a5261"; fctx.lineWidth = 2; fctx.stroke();
  }
  if (gazePt) { fctx.beginPath(); fctx.arc(gazePt[0], gazePt[1], 7, 0, 2 * Math.PI); fctx.strokeStyle = "rgba(255,210,80,0.7)"; fctx.lineWidth = 2; fctx.stroke(); }
  fctx.beginPath(); fctx.arc(st.anchor[0], st.anchor[1], 5, 0, 2 * Math.PI); fctx.strokeStyle = "#7a8699"; fctx.stroke();
  fctx.beginPath(); fctx.arc(st.cursor[0], st.cursor[1], 10, 0, 2 * Math.PI); fctx.fillStyle = "#4da3ff"; fctx.fill();
  fctx.beginPath(); fctx.arc(st.cursor[0], st.cursor[1], 3, 0, 2 * Math.PI); fctx.fillStyle = "#fff"; fctx.fill();
  $("fusion-mode").textContent = `${mode} · head ${headSpeed.toFixed(0)}°/s · re-anchors ${st.reanchors}`;
  $("t-stats").textContent = `re-anchors: ${st.reanchors}`;
}
async function endFusion() {
  const st = fusionState; if (st && st.raf) cancelAnimationFrame(st.raf); if (st) st.aborted = true;
  showTunePanel(false); fctx.clearRect(0, 0, fcanvas.width, fcanvas.height);
  if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ignore */ } }
  await saveSession(st);
}
async function saveSession(st) {
  if (!st) { show("landing"); startPreview(); return; }
  overlay("Saving session…");
  const meta = {
    screen_px: [st.W, st.H], screen_mm: [parseFloat($("width_mm").value), parseFloat($("height_mm").value)],
    viewing_distance_mm: parseFloat($("viewing_cm").value) * 10, gaze_source: "webgazer",
    tune: { ...TUNE, invert_yaw: invertYaw(), invert_pitch: invertPitch(), filter: "one_euro" },
    gates: { ...GATES }, reanchors: st.reanchors, user_agent: navigator.userAgent,
  };
  try {
    const r = await fetch("/api/fusion_session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ meta, samples: st.samples, events: st.events }) });
    const j = r.ok ? await r.json() : { session_id: "(save failed)" };
    overlay("");
    $("verdict").textContent = `WebGazer-fusion session saved. ${st.reanchors} gaze re-anchors over ${((performance.now() - st.t0) / 1000).toFixed(0)}s.`;
    $("results-meta").textContent = `${j.session_id} · gaze=WebGazer · head gain ${TUNE.gain} · re-anchor ${GATES.reanchorDeg}° · head-quiet ${GATES.headQuietDegps}°/s. Tell me: did stable coarse + head fine feel like enough?`;
    show("results");
  } catch (e) { overlay(`Error saving: ${e.message}`); }
}

// ============================================================
// Tuning panel (identical to fusion.js)
// ============================================================
const steadyToCut = (s) => 6.0 - (s / 100) * (6.0 - 0.3), cutToSteady = (c) => Math.round((6.0 - c) / (6.0 - 0.3) * 100);
function refreshTunePanel() {
  $("t-gain").value = TUNE.gain; $("t-gain-val").textContent = Math.round(TUNE.gain);
  $("t-steady").value = cutToSteady(TUNE.minCutoff); $("t-steady-val").textContent = cutToSteady(TUNE.minCutoff);
  $("t-beta").value = TUNE.beta; $("t-beta-val").textContent = TUNE.beta.toFixed(3);
  $("t-dz").value = TUNE.deadzone; $("t-dz-val").textContent = TUNE.deadzone;
  $("t-red").value = GATES.reanchorDeg; $("t-red-val").textContent = GATES.reanchorDeg;
  $("t-hq").value = GATES.headQuietDegps; $("t-hq-val").textContent = GATES.headQuietDegps;
  $("t-fix").value = GATES.fixationMs; $("t-fix-val").textContent = GATES.fixationMs;
  $("t-hn").value = GATES.headNearDeg; $("t-hn-val").textContent = GATES.headNearDeg;
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
  $("t-hn").addEventListener("input", (e) => { GATES.headNearDeg = +e.target.value; saveTune(); refreshTunePanel(); });
}
function tuneStep(obj, p, d, lo, hi) { obj[p] = Math.max(lo, Math.min(hi, obj[p] + d)); saveTune(); refreshTunePanel(); }

// ============================================================
// Wiring
// ============================================================
async function init() {
  try { CFG = await (await fetch("/api/fusion_config")).json(); } catch (e) { overlay(`Failed to load config: ${e.message}`); return; }
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
    headNearDeg: CFG.fusion?.head_near_deg ?? GATES.headNearDeg,
  });
  loadTune(); wireTunePanel(); refreshTunePanel(); prefillGeometry();

  try { await loadLandmarker(); } catch (e) { overlay(`MediaPipe failed: ${e.message}`); return; }
  try { await initWebGazer(); } catch (e) { overlay(`WebGazer/camera failed: ${e.message}`); return; }
  startPreview();

  $("diag-apply").addEventListener("click", applyDiagonal);
  $("neutral-btn").addEventListener("click", captureNeutral);
  $("gain").addEventListener("input", (e) => { TUNE.gain = +e.target.value; saveTune(); refreshTunePanel(); });
  $("calib-btn").addEventListener("click", () => { if (previewLoop) cancelAnimationFrame(previewLoop); runGazeCalibration(); });
  $("start-btn").addEventListener("click", async () => {
    if (!(neutral && geometryValid() && calibrated)) return;
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
    "[": () => tuneStep(TUNE, "gain", -250, TUNE_MIN.gain, TUNE_MAX.gain), "]": () => tuneStep(TUNE, "gain", 250, TUNE_MIN.gain, TUNE_MAX.gain),
    "-": () => tuneStep(TUNE, "minCutoff", -0.3, TUNE_MIN.minCutoff, TUNE_MAX.minCutoff), "=": () => tuneStep(TUNE, "minCutoff", 0.3, TUNE_MIN.minCutoff, TUNE_MAX.minCutoff),
    ";": () => tuneStep(TUNE, "beta", -0.002, TUNE_MIN.beta, TUNE_MAX.beta), "'": () => tuneStep(TUNE, "beta", 0.002, TUNE_MIN.beta, TUNE_MAX.beta),
    ",": () => tuneStep(TUNE, "deadzone", -2, TUNE_MIN.deadzone, TUNE_MAX.deadzone), ".": () => tuneStep(TUNE, "deadzone", 2, TUNE_MIN.deadzone, TUNE_MAX.deadzone),
    "9": () => tuneStep(GATES, "reanchorDeg", -0.5, TUNE_MIN.reanchorDeg, TUNE_MAX.reanchorDeg), "0": () => tuneStep(GATES, "reanchorDeg", 0.5, TUNE_MIN.reanchorDeg, TUNE_MAX.reanchorDeg),
  };
  if (t[e.key]) { e.preventDefault(); t[e.key](); }
});
window.addEventListener("resize", () => { if (screens.fusion.classList.contains("active") && fusionState && !fusionState.aborted) { fusionState.W = window.innerWidth; fusionState.H = window.innerHeight; fcanvas.width = fusionState.W; fcanvas.height = fusionState.H; } });

window.addEventListener("pagehide", () => { try { webgazer.end(); } catch { /* ignore */ } });
init();
