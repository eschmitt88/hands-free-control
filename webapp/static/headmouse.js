/*
 * Head-mouse + facial gestures (no gaze) — feel prototype.
 *
 *   pointer  = head pose (low-gain, One-Euro filtered, closed-loop)
 *   clutch   = jaw-open HELD: freeze cursor, move head freely, release re-zeros
 *              neutral -> ratchet across the whole screen at low gain
 *   click    = wink (single-eye blink; both-eyes natural blink is ignored)
 *
 * Browser can't drive the real OS cursor, so this exercises the scheme on a
 * target grid (wink to click the highlighted button). Real control = native
 * workstation app (pynput) reusing this same detection logic.
 */
const TASKS_VISION_VERSION = "0.10.20";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}`;
const MODEL_URL_REMOTE =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const VENDOR_BUNDLE = "/static/vendor/tasks-vision/vision_bundle.mjs";
const VENDOR_WASM = "/static/vendor/tasks-vision/wasm";
const VENDOR_MODEL = "/static/vendor/models/face_landmarker.task";

const $ = (id) => document.getElementById(id);
const screens = { landing: $("landing"), desk: $("desk"), results: $("results") };
const show = (n) => { for (const [k, el] of Object.entries(screens)) el.classList.toggle("active", k === n); };
const showTunePanel = (on) => $("tune-panel").classList.toggle("hidden", !on);
const overlay = (m) => { $("overlay-msg").textContent = m; $("overlay").classList.toggle("hidden", !m); };

const video = $("preview");
let landmarker = null, lastTs = 0, stream = null, neutral = null, previewLoop = null;

// ---- tunables ----
const TUNE = { gain: 1200, minCutoff: 1.0, beta: 0.007, deadzone: 0, winkMargin: 0.30, winkAbsMin: 0.25, jawThr: 0.45 };
const LIM = { gain: [400, 12000], minCutoff: [0.3, 6], deadzone: [0, 40] };
function loadTune() { try { Object.assign(TUNE, JSON.parse(localStorage.getItem("headmouse_tune") || "{}")); } catch { /* ignore */ } }
function saveTune() { try { localStorage.setItem("headmouse_tune", JSON.stringify(TUNE)); } catch { /* ignore */ } }

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
function resetFilters() { filtYaw = new OneEuro(TUNE.minCutoff, TUNE.beta); filtPitch = new OneEuro(TUNE.minCutoff, TUNE.beta); }

// ---- MediaPipe (head pose + blendshapes) ----
async function fileExists(url) { try { const r = await fetch(url, { method: "GET", cache: "force-cache" }); return r.ok; } catch { return false; } }
async function loadLandmarker() {
  overlay("Loading MediaPipe…");
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
    numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true,
  });
  overlay("");
}
async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
  video.srcObject = stream; await video.play();
}
function detect() {
  if (!landmarker || video.readyState < 2) return null;
  let ts = performance.now(); if (ts <= lastTs) ts = lastTs + 1; lastTs = ts;
  try { return landmarker.detectForVideo(video, ts); } catch { return null; }
}
function readFace(res) {
  if (!res) return null;
  const mats = res.facialTransformationMatrixes;
  if (!mats || !mats.length || !mats[0].data || mats[0].data.length < 16) return null;
  const m = mats[0].data;
  const yaw = Math.atan2(m[8], m[10]), pitch = Math.atan2(m[9], m[10]);
  const bs = {};
  const cats = res.faceBlendshapes && res.faceBlendshapes[0] && res.faceBlendshapes[0].categories;
  if (cats) for (const c of cats) bs[c.categoryName] = c.score;
  if (![yaw, pitch].every(Number.isFinite)) return null;
  return { yaw, pitch, bs };
}

// ---- adaptive wink detector -------------------------------------------------
// A static threshold on eyeBlinkL/R fails: the baseline shifts with head angle.
// Instead track the ASYMMETRY d = blinkL - blinkR against a slow baseline, and
// fire on a spike RELATIVE to that baseline. Full blinks move both eyes -> d flat
// -> ignored; head-angle bias drifts into the baseline -> cancelled. Self-calibrating.
const wink = { baseD: 0, armedL: true, armedR: true, lastFire: 0 };
function resetWink() { wink.baseD = 0; wink.armedL = true; wink.armedR = true; wink.lastFire = 0; }
function detectWink(bl, br, now) {
  const d = bl - br, dev = d - wink.baseD;
  const leftCand = dev > TUNE.winkMargin && bl > TUNE.winkAbsMin;
  const rightCand = -dev > TUNE.winkMargin && br > TUNE.winkAbsMin;
  let fired = null;
  if (now - wink.lastFire > 250) {                 // refractory: no double-fire
    if (leftCand && wink.armedL) { fired = "L"; wink.armedL = false; wink.lastFire = now; }
    else if (rightCand && wink.armedR) { fired = "R"; wink.armedR = false; wink.lastFire = now; }
  }
  if (dev < TUNE.winkMargin * 0.5) wink.armedL = true;   // re-arm on relax (hysteresis)
  if (-dev < TUNE.winkMargin * 0.5) wink.armedR = true;
  if (!leftCand && !rightCand) wink.baseD = 0.97 * wink.baseD + 0.03 * d;  // adapt only when calm
  return fired;
}

// ---- geometry / landing ----
const invertYaw = () => $("invert_yaw").checked, invertPitch = () => $("invert_pitch").checked;
function startPreview() {
  const badge = $("face-indicator");
  const tick = () => {
    const f = readFace(detect()); const ok = !!f;
    badge.textContent = ok ? "face detected ✓" : "face: searching…";
    badge.classList.toggle("good", ok); badge.classList.toggle("bad", !ok);
    $("gain-readout").textContent = Math.round(TUNE.gain);
    $("neutral-btn").disabled = !ok;
    $("start-btn").disabled = !neutral;
    previewLoop = requestAnimationFrame(tick);
  };
  previewLoop = requestAnimationFrame(tick);
}
async function captureNeutral() {
  $("neutral-status").textContent = "hold still…";
  const dur = 1000, t0 = performance.now(), s = [];
  await new Promise((res) => { const g = () => { const f = readFace(detect()); if (f) s.push(f); (performance.now() - t0 < dur) ? requestAnimationFrame(g) : res(); }; requestAnimationFrame(g); });
  if (s.length < 3) { $("neutral-status").textContent = "no face — try again"; return; }
  neutral = { yaw: s.reduce((a, f) => a + f.yaw, 0) / s.length, pitch: s.reduce((a, f) => a + f.pitch, 0) / s.length };
  resetFilters(); $("neutral-status").textContent = "captured ✓";
}

// ---- desk (target grid) ----
const canvas = $("stage"), ctx = canvas.getContext("2d");
let st = null;

function makeTargets(W, H) {
  const t = [], cols = 5, rows = 3, mx = W * 0.12, my = H * 0.16;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    t.push({ x: mx + (W - 2 * mx) * c / (cols - 1), y: my + (H - 2 * my) * r / (rows - 1), r: 34, lit: false });
  return t;
}
function runDesk() {
  const W = window.innerWidth, H = window.innerHeight; canvas.width = W; canvas.height = H;
  resetFilters(); resetWink();
  st = { W, H, neutralHead: { ...neutral }, cursor: [W / 2, H / 2], cursorAnchor: [W / 2, H / 2], clutch: false,
         targets: makeTargets(W, H), clicks: 0, hits: 0, lastClick: 0, raf: null, aborted: false };
  showTunePanel(true);
  st.raf = requestAnimationFrame(deskLoop);
}
function deskLoop() {
  if (!st || st.aborted) return;
  st.raf = requestAnimationFrame(deskLoop);
  const now = performance.now();
  const f = readFace(detect());

  let mode = "MOVE";
  if (f) {
    // clutch: jaw-open HELD freezes the cursor; release RE-ANCHORS at the current
    // cursor position (relative ratchet), so the cursor stays put — not recentered.
    const jaw = (f.bs.jawOpen || 0) > TUNE.jawThr;
    if (jaw && !st.clutch) { st.clutch = true; }
    if (!jaw && st.clutch) { st.clutch = false; st.cursorAnchor = [...st.cursor]; st.neutralHead = { yaw: f.yaw, pitch: f.pitch }; resetFilters(); }
    mode = st.clutch ? "CLUTCH · recenter head" : "MOVE";

    if (!st.clutch) {
      const fy = filtYaw.filter(f.yaw, now), fp = filtPitch.filter(f.pitch, now);
      const sx = invertYaw() ? -1 : 1, sy = invertPitch() ? -1 : 1;
      let cx = st.cursorAnchor[0] + sx * TUNE.gain * (fy - st.neutralHead.yaw);
      let cy = st.cursorAnchor[1] + sy * TUNE.gain * (fp - st.neutralHead.pitch);
      cx = Math.max(0, Math.min(st.W, cx)); cy = Math.max(0, Math.min(st.H, cy));
      if (!(TUNE.deadzone > 0 && Math.hypot(cx - st.cursor[0], cy - st.cursor[1]) <= TUNE.deadzone)) st.cursor = [cx, cy];
    }

    // winks -> click (adaptive differential detector; natural both-eye blinks ignored)
    const w = detectWink(f.bs.eyeBlinkLeft || 0, f.bs.eyeBlinkRight || 0, now);
    if (w) doClick(w);
  }
  draw(mode);
}
function doClick(which) {
  st.clicks++; st.lastClick = performance.now();
  for (const t of st.targets) {
    if (!t.lit && Math.hypot(st.cursor[0] - t.x, st.cursor[1] - t.y) <= t.r) { t.lit = true; st.hits++; break; }
  }
  $("t-stats").textContent = `clicks: ${st.clicks} · hits: ${st.hits}/${st.targets.length}`;
}
function draw(mode) {
  ctx.clearRect(0, 0, st.W, st.H);
  for (const t of st.targets) {
    const hot = Math.hypot(st.cursor[0] - t.x, st.cursor[1] - t.y) <= t.r;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, 2 * Math.PI);
    ctx.fillStyle = t.lit ? "rgba(46,204,113,0.35)" : (hot ? "rgba(77,163,255,0.18)" : "transparent"); ctx.fill();
    ctx.strokeStyle = t.lit ? "#2ecc71" : (hot ? "#4da3ff" : "#4a5261"); ctx.lineWidth = hot ? 3 : 2; ctx.stroke();
  }
  const flash = performance.now() - st.lastClick < 120;
  ctx.beginPath(); ctx.arc(st.cursor[0], st.cursor[1], st.clutch ? 13 : 10, 0, 2 * Math.PI);
  ctx.fillStyle = st.clutch ? "#e0a030" : (flash ? "#fff" : "#4da3ff"); ctx.fill();
  ctx.beginPath(); ctx.arc(st.cursor[0], st.cursor[1], 3, 0, 2 * Math.PI); ctx.fillStyle = "#fff"; ctx.fill();
  $("mode-hud").textContent = `${mode} · ${st.hits}/${st.targets.length} hit`;
}
async function endDesk() {
  if (st && st.raf) cancelAnimationFrame(st.raf);
  const hits = st ? st.hits : 0, clicks = st ? st.clicks : 0, n = st ? st.targets.length : 0;
  if (st) st.aborted = true;
  showTunePanel(false); ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ignore */ } }
  $("verdict").textContent = `Hit ${hits}/${n} targets with ${clicks} winks. Did head-point + jaw-clutch + wink-click feel usable?`;
  show("results");
}

// ---- tune panel ----
const steadyToCut = (s) => 6.0 - (s / 100) * 5.7, cutToSteady = (c) => Math.round((6.0 - c) / 5.7 * 100);
function refreshTune() {
  $("t-gain").value = TUNE.gain; $("t-gain-val").textContent = Math.round(TUNE.gain);
  $("t-steady").value = cutToSteady(TUNE.minCutoff); $("t-steady-val").textContent = cutToSteady(TUNE.minCutoff);
  $("t-dz").value = TUNE.deadzone; $("t-dz-val").textContent = TUNE.deadzone;
  $("t-wink").value = TUNE.winkMargin; $("t-wink-val").textContent = TUNE.winkMargin.toFixed(2);
  $("t-jaw").value = TUNE.jawThr; $("t-jaw-val").textContent = TUNE.jawThr.toFixed(2);
  if ($("gain")) { $("gain").value = TUNE.gain; $("gain-readout").textContent = Math.round(TUNE.gain); }
}
function wireTune() {
  $("t-gain").addEventListener("input", (e) => { TUNE.gain = +e.target.value; saveTune(); refreshTune(); });
  $("t-steady").addEventListener("input", (e) => { TUNE.minCutoff = steadyToCut(+e.target.value); saveTune(); refreshTune(); });
  $("t-dz").addEventListener("input", (e) => { TUNE.deadzone = +e.target.value; saveTune(); refreshTune(); });
  $("t-wink").addEventListener("input", (e) => { TUNE.winkMargin = +e.target.value; saveTune(); refreshTune(); });
  $("t-jaw").addEventListener("input", (e) => { TUNE.jawThr = +e.target.value; saveTune(); refreshTune(); });
}
function clampStep(k, d) { TUNE[k] = Math.max(LIM[k][0], Math.min(LIM[k][1], TUNE[k] + d)); saveTune(); refreshTune(); }

// ---- wiring ----
async function init() {
  loadTune(); wireTune(); refreshTune();
  try { await startCamera(); } catch (e) { overlay(`Camera denied/unavailable: ${e.message}`); return; }
  try { await loadLandmarker(); } catch (e) { overlay(`MediaPipe failed: ${e.message}`); return; }
  startPreview();
  $("neutral-btn").addEventListener("click", captureNeutral);
  $("gain").addEventListener("input", (e) => { TUNE.gain = +e.target.value; saveTune(); refreshTune(); });
  $("start-btn").addEventListener("click", async () => {
    if (!neutral) return; if (previewLoop) cancelAnimationFrame(previewLoop);
    show("desk"); await document.documentElement.requestFullscreen().catch(() => {});
    setTimeout(runDesk, 120);
  });
  $("again-btn").addEventListener("click", () => { neutral = null; $("neutral-status").textContent = ""; show("landing"); startPreview(); });
}
window.addEventListener("keydown", (e) => {
  if (!screens.desk.classList.contains("active")) return;
  if (e.code === "Escape") { e.preventDefault(); endDesk(); return; }
  const t = { "[": ["gain", -250], "]": ["gain", 250], "-": ["minCutoff", -0.3], "=": ["minCutoff", 0.3], ",": ["deadzone", -2], ".": ["deadzone", 2] };
  if (t[e.key]) { e.preventDefault(); clampStep(t[e.key][0], t[e.key][1]); }
});
window.addEventListener("resize", () => { if (screens.desk.classList.contains("active") && st && !st.aborted) { st.W = window.innerWidth; st.H = window.innerHeight; canvas.width = st.W; canvas.height = st.H; } });
init();
