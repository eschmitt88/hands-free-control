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
const TUNE = { gain: 1200, minCutoff: 1.0, beta: 0.007, deadzone: 0,
  winkMargin: 0.30, winkAbsMin: 0.25, winkMethod: "spike", winkRate: 1.5,
  jawThr: 0.45, smileThr: 0.40, browThr: 0.40, scrollRate: 14 };
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
const wink = { baseD: 0, prevD: null, prevT: 0, armedL: true, armedR: true, lastFire: 0 };
function resetWink() { wink.baseD = 0; wink.prevD = null; wink.prevT = 0; wink.armedL = true; wink.armedR = true; wink.lastFire = 0; }
function detectWink(bl, br, now) {
  const d = bl - br, dev = d - wink.baseD;
  // rate of change of the asymmetry (per second) — a wink is a FAST spike
  let rate = 0;
  if (wink.prevD != null) { const dt = Math.max(1e-3, (now - wink.prevT) / 1000); rate = (d - wink.prevD) / dt; }
  wink.prevD = d; wink.prevT = now;
  // "level" = deviation from adaptive baseline; "spike" = level AND fast onset
  const levelL = dev > TUNE.winkMargin && bl > TUNE.winkAbsMin;
  const levelR = -dev > TUNE.winkMargin && br > TUNE.winkAbsMin;
  const spike = TUNE.winkMethod === "spike";
  const leftCand = levelL && (!spike || rate > TUNE.winkRate);
  const rightCand = levelR && (!spike || -rate > TUNE.winkRate);
  let fired = null;
  if (now - wink.lastFire > 250) {                 // refractory: no double-fire
    if (leftCand && wink.armedL) { fired = "L"; wink.armedL = false; wink.lastFire = now; }
    else if (rightCand && wink.armedR) { fired = "R"; wink.armedR = false; wink.lastFire = now; }
  }
  if (dev < TUNE.winkMargin * 0.5) wink.armedL = true;   // re-arm on relax (hysteresis)
  if (-dev < TUNE.winkMargin * 0.5) wink.armedR = true;
  if (!levelL && !levelR) wink.baseD = 0.97 * wink.baseD + 0.03 * d;  // adapt only when calm
  return fired;
}

// simple edge trigger for toggle gestures (smile)
function makeEdge() { return { on: false }; }
function edgeRise(state, active) { if (active && !state.on) { state.on = true; return true; } if (!active) state.on = false; return false; }

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
const smileEdge = makeEdge();
function runDesk() {
  const W = window.innerWidth, H = window.innerHeight; canvas.width = W; canvas.height = H;
  resetFilters(); resetWink(); smileEdge.on = false;
  st = {
    W, H, neutralHead: { ...neutral }, cursor: [W / 2, H / 2], cursorAnchor: [W / 2, H / 2], clutch: false, frozen: false,
    targets: makeTargets(W, H), clicks: 0, hits: 0, lastClick: 0, raf: null, aborted: false,
    // smile-drag demo: a box you grab (smile-toggle) and drop in the zone
    dragging: false, dragBox: { x: W * 0.30, y: H * 0.72, s: 54, placed: false },
    dropZone: { x: W * 0.70, y: H * 0.72, s: 74 },
    // brows-scroll demo: a list with a scroll offset
    scroll: { x: W * 0.82, y: H * 0.10, w: W * 0.14, h: H * 0.5, off: 0, itemH: 34, n: 30 },
  };
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
    // The cursor is FROZEN while jaw-clutching OR while a smile is being performed
    // (smiling physically dips the head — freeze so grab/drop use the pre-smile
    // position). Any freeze->unfreeze re-anchors at the current cursor (relative
    // ratchet), so the head returning from its dip doesn't jerk the cursor.
    const jaw = (f.bs.jawOpen || 0) > TUNE.jawThr;
    const smileScore = ((f.bs.mouthSmileLeft || 0) + (f.bs.mouthSmileRight || 0)) / 2;
    const smileActive = smileScore > TUNE.smileThr * 0.35;   // low activity gate: catch the dip early
    const frozen = jaw || smileActive;
    if (!frozen && st.frozen) { st.cursorAnchor = [...st.cursor]; st.neutralHead = { yaw: f.yaw, pitch: f.pitch }; resetFilters(); }
    st.frozen = frozen; st.clutch = jaw;

    if (!frozen) {
      const fy = filtYaw.filter(f.yaw, now), fp = filtPitch.filter(f.pitch, now);
      const sx = invertYaw() ? -1 : 1, sy = invertPitch() ? -1 : 1;
      let cx = st.cursorAnchor[0] + sx * TUNE.gain * (fy - st.neutralHead.yaw);
      let cy = st.cursorAnchor[1] + sy * TUNE.gain * (fp - st.neutralHead.pitch);
      cx = Math.max(0, Math.min(st.W, cx)); cy = Math.max(0, Math.min(st.H, cy));
      if (!(TUNE.deadzone > 0 && Math.hypot(cx - st.cursor[0], cy - st.cursor[1]) <= TUNE.deadzone)) st.cursor = [cx, cy];
    }
    mode = jaw ? "CLUTCH · recenter head" : (smileActive ? "SMILE (cursor locked)" : "MOVE");

    // winks -> click (adaptive differential detector; natural both-eye blinks ignored)
    const w = detectWink(f.bs.eyeBlinkLeft || 0, f.bs.eyeBlinkRight || 0, now);
    if (w) doClick(w);

    // smile -> drag-lock toggle (fires at the full threshold; cursor already frozen
    // by the activity gate above, so grab/drop use the pre-dip position)
    if (edgeRise(smileEdge, smileScore > TUNE.smileThr)) {
      if (!st.dragging) {
        const b = st.dragBox;
        if (Math.abs(st.cursor[0] - b.x) < b.s && Math.abs(st.cursor[1] - b.y) < b.s) st.dragging = true;
      } else {
        st.dragging = false;
        const dz = st.dropZone;
        st.dragBox.placed = Math.abs(st.dragBox.x - dz.x) < dz.s && Math.abs(st.dragBox.y - dz.y) < dz.s;
      }
    }
    if (st.dragging) { st.dragBox.x = st.cursor[0]; st.dragBox.y = st.cursor[1]; mode = "DRAG (smile to drop)"; }

    // brows up/down -> scroll the list (continuous while held)
    const browUp = Math.max(f.bs.browInnerUp || 0, f.bs.browOuterUpLeft || 0, f.bs.browOuterUpRight || 0);
    const browDn = ((f.bs.browDownLeft || 0) + (f.bs.browDownRight || 0)) / 2;
    const sc = st.scroll, maxOff = Math.max(0, sc.n * sc.itemH - sc.h);
    if (browUp > TUNE.browThr && browUp > browDn) { sc.off = Math.max(0, sc.off - TUNE.scrollRate); if (!st.dragging) mode = "SCROLL ↑"; }
    else if (browDn > TUNE.browThr) { sc.off = Math.min(maxOff, sc.off + TUNE.scrollRate); if (!st.dragging) mode = "SCROLL ↓"; }
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
  // drag demo: drop zone + draggable box
  const dz = st.dropZone;
  ctx.setLineDash([6, 6]); ctx.strokeStyle = "#5a6472"; ctx.lineWidth = 2;
  ctx.strokeRect(dz.x - dz.s, dz.y - dz.s, dz.s * 2, dz.s * 2); ctx.setLineDash([]);
  ctx.fillStyle = "#6a7280"; ctx.font = "12px system-ui"; ctx.textAlign = "center";
  ctx.fillText("drop zone (smile)", dz.x, dz.y + dz.s + 16);
  const b = st.dragBox;
  ctx.fillStyle = b.placed ? "rgba(46,204,113,0.5)" : (st.dragging ? "#e0a030" : "#4da3ff");
  ctx.fillRect(b.x - b.s, b.y - b.s, b.s * 2, b.s * 2);
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.strokeRect(b.x - b.s, b.y - b.s, b.s * 2, b.s * 2);
  ctx.fillStyle = "#fff"; ctx.fillText(b.placed ? "placed ✓" : "grab", b.x, b.y + 4);
  // scroll demo: a clipped list
  const sc = st.scroll;
  ctx.save(); ctx.beginPath(); ctx.rect(sc.x, sc.y, sc.w, sc.h); ctx.clip();
  ctx.fillStyle = "#0b0e12"; ctx.fillRect(sc.x, sc.y, sc.w, sc.h);
  for (let i = 0; i < sc.n; i++) {
    const yy = sc.y + i * sc.itemH - sc.off;
    if (yy > sc.y - sc.itemH && yy < sc.y + sc.h) {
      ctx.fillStyle = i % 2 ? "#161b22" : "#1b2130"; ctx.fillRect(sc.x, yy, sc.w, sc.itemH - 2);
      ctx.fillStyle = "#9aa7b4"; ctx.textAlign = "left"; ctx.fillText(`item ${i + 1}`, sc.x + 10, yy + 21);
    }
  }
  ctx.restore();
  ctx.strokeStyle = "#4a5261"; ctx.lineWidth = 1; ctx.strokeRect(sc.x, sc.y, sc.w, sc.h);
  ctx.textAlign = "center"; ctx.fillStyle = "#6a7280"; ctx.fillText("brows ↑/↓ scroll", sc.x + sc.w / 2, sc.y - 8);
  ctx.textAlign = "start";
  const flash = performance.now() - st.lastClick < 120;
  ctx.beginPath(); ctx.arc(st.cursor[0], st.cursor[1], st.frozen ? 13 : 10, 0, 2 * Math.PI);
  ctx.fillStyle = st.frozen ? "#e0a030" : (flash ? "#fff" : "#4da3ff"); ctx.fill();
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
  $("t-winkmethod").value = TUNE.winkMethod;
  $("t-winkrate").value = TUNE.winkRate; $("t-winkrate-val").textContent = TUNE.winkRate.toFixed(1);
  $("t-winkrate").parentElement.style.opacity = TUNE.winkMethod === "spike" ? "1" : "0.4";
  $("t-jaw").value = TUNE.jawThr; $("t-jaw-val").textContent = TUNE.jawThr.toFixed(2);
  $("t-smile").value = TUNE.smileThr; $("t-smile-val").textContent = TUNE.smileThr.toFixed(2);
  $("t-brow").value = TUNE.browThr; $("t-brow-val").textContent = TUNE.browThr.toFixed(2);
  if ($("gain")) { $("gain").value = TUNE.gain; $("gain-readout").textContent = Math.round(TUNE.gain); }
}
function wireTune() {
  $("t-gain").addEventListener("input", (e) => { TUNE.gain = +e.target.value; saveTune(); refreshTune(); });
  $("t-steady").addEventListener("input", (e) => { TUNE.minCutoff = steadyToCut(+e.target.value); saveTune(); refreshTune(); });
  $("t-dz").addEventListener("input", (e) => { TUNE.deadzone = +e.target.value; saveTune(); refreshTune(); });
  $("t-wink").addEventListener("input", (e) => { TUNE.winkMargin = +e.target.value; saveTune(); refreshTune(); });
  $("t-winkmethod").addEventListener("change", (e) => { TUNE.winkMethod = e.target.value; saveTune(); refreshTune(); });
  $("t-winkrate").addEventListener("input", (e) => { TUNE.winkRate = +e.target.value; saveTune(); refreshTune(); });
  $("t-jaw").addEventListener("input", (e) => { TUNE.jawThr = +e.target.value; saveTune(); refreshTune(); });
  $("t-smile").addEventListener("input", (e) => { TUNE.smileThr = +e.target.value; saveTune(); refreshTune(); });
  $("t-brow").addEventListener("input", (e) => { TUNE.browThr = +e.target.value; saveTune(); refreshTune(); });
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
