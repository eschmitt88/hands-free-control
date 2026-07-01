/*
 * In-browser webcam gaze / head-pose calibration collector.
 *
 * MediaPipe Tasks-Vision FaceLandmarker runs entirely client-side (WebGL/WASM).
 * For each calibration/validation/test dot we settle for `warmup_frames`, then
 * capture `frames_per_target` frames, extract two feature channels per frame,
 * average them across frames, and emit ONE aggregated sample per dot in the
 * exact jsonl schema analyze.py consumes:
 *   {phase, target_norm:[x,y], gaze_features:[6], headpose_features:[5]}
 *
 * ------------------------------------------------------------------------
 * Feature layout (must be internally consistent between calibration and
 * validation; exact definitions are otherwise free — see EXP README):
 *
 * gaze_features (len 6) = [Ldx, Ldy, Rdx, Rdy, openL, openR]
 *   Ldx,Ldy : left-iris center (mean of landmarks 468..472) minus the midpoint
 *             of that eye's corners (33,133), normalized by inter-ocular
 *             distance = dist(landmark 33, landmark 263).
 *   Rdx,Rdy : right-iris center (mean of 473..477) minus midpoint(263,362),
 *             same normalization.
 *   openL   : vertical eyelid gap (159,145) / horizontal corner span (33,133).
 *   openR   : vertical eyelid gap (386,374) / horizontal corner span (263,362).
 *   Normalizing by inter-ocular distance makes the features scale-invariant to
 *   how close the face sits to the camera.
 *
 * headpose_features (len 5) = [yaw, pitch, roll, nose_x, nose_y]
 *   yaw,pitch,roll : decomposed (radians) from the rigid rotation in
 *                    facialTransformationMatrixes[0] (4x4, column-major).
 *   nose_x,nose_y  : nose-tip landmark (1), normalized coords minus image
 *                    center (0.5,0.5) -> translational head pointing.
 * ------------------------------------------------------------------------
 */

const TASKS_VISION_VERSION = "0.10.20";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}`;
const MODEL_URL_REMOTE =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/" +
  "face_landmarker/float16/1/face_landmarker.task";

// Prefer vendored assets under /static/vendor/ (offline), else jsDelivr CDN.
const VENDOR_BUNDLE = "/static/vendor/tasks-vision/vision_bundle.mjs";
const VENDOR_WASM = "/static/vendor/tasks-vision/wasm";
const VENDOR_MODEL = "/static/vendor/models/face_landmarker.task";

// ---- DOM ----
const $ = (id) => document.getElementById(id);
const screens = {
  landing: $("landing"),
  collector: $("collector"),
  results: $("results"),
};
function show(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle("active", k === name);
}
function overlay(msg) {
  $("overlay-msg").textContent = msg;
  $("overlay").classList.toggle("hidden", !msg);
}

// ---- global state ----
let CFG = null;               // /api/config payload
let landmarker = null;        // FaceLandmarker instance
let stream = null;            // MediaStream
const video = $("preview");   // shared <video> (hidden but running in collector)
let lastTs = 0;               // monotonic timestamp for detectForVideo

// ============================================================
// MediaPipe loading
// ============================================================
async function fileExists(url) {
  try {
    const r = await fetch(url, { method: "GET", cache: "force-cache" });
    return r.ok;
  } catch {
    return false;
  }
}

async function loadLandmarker() {
  overlay("Loading MediaPipe FaceLandmarker…");
  const vendored = await fileExists(VENDOR_BUNDLE);
  let vision;
  try {
    vision = await import(vendored ? VENDOR_BUNDLE : `${CDN_BASE}/vision_bundle.mjs`);
  } catch (e) {
    // Fall back to CDN if the vendored bundle import fails at parse/load time.
    vision = await import(`${CDN_BASE}/vision_bundle.mjs`);
  }
  const { FilesetResolver, FaceLandmarker } = vision;

  const wasmBase = vendored ? VENDOR_WASM : `${CDN_BASE}/wasm`;
  const modelPath = (vendored && (await fileExists(VENDOR_MODEL)))
    ? VENDOR_MODEL
    : MODEL_URL_REMOTE;

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

// ============================================================
// Camera
// ============================================================
async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
}

function cameraResolution() {
  const t = stream && stream.getVideoTracks()[0];
  const s = t ? t.getSettings() : {};
  return [s.width || video.videoWidth || 1280, s.height || video.videoHeight || 720];
}

// detectForVideo requires strictly increasing timestamps.
function detectNow() {
  if (!landmarker || video.readyState < 2) return null;
  let ts = performance.now();
  if (ts <= lastTs) ts = lastTs + 1;
  lastTs = ts;
  try {
    return landmarker.detectForVideo(video, ts);
  } catch {
    return null;
  }
}

// ============================================================
// Feature extraction
// ============================================================
function extractFeatures(res) {
  if (!res || !res.faceLandmarks || res.faceLandmarks.length === 0) return null;
  const L = res.faceLandmarks[0];
  if (!L || L.length < 478) return null;

  const pt = (i) => L[i];
  const dist = (a, b) => Math.hypot(pt(a).x - pt(b).x, pt(a).y - pt(b).y);
  const midpoint = (a, b) => [(pt(a).x + pt(b).x) / 2, (pt(a).y + pt(b).y) / 2];
  const meanPts = (idxs) => {
    let sx = 0, sy = 0;
    for (const i of idxs) { sx += pt(i).x; sy += pt(i).y; }
    return [sx / idxs.length, sy / idxs.length];
  };

  const iod = dist(33, 263) || 1e-6;

  const lIris = meanPts([468, 469, 470, 471, 472]);
  const rIris = meanPts([473, 474, 475, 476, 477]);
  const lMid = midpoint(33, 133);
  const rMid = midpoint(263, 362);
  const Ldx = (lIris[0] - lMid[0]) / iod;
  const Ldy = (lIris[1] - lMid[1]) / iod;
  const Rdx = (rIris[0] - rMid[0]) / iod;
  const Rdy = (rIris[1] - rMid[1]) / iod;

  const openL = dist(159, 145) / (dist(33, 133) || 1e-6);
  const openR = dist(386, 374) / (dist(263, 362) || 1e-6);

  const gaze = [Ldx, Ldy, Rdx, Rdy, openL, openR];

  // Head pose from the rigid transform matrix (column-major 4x4).
  let yaw = 0, pitch = 0, roll = 0;
  const mats = res.facialTransformationMatrixes;
  if (mats && mats.length && mats[0].data && mats[0].data.length >= 16) {
    const m = mats[0].data;
    const R00 = m[0], R10 = m[1], R20 = m[2];
    const R21 = m[6], R22 = m[10];
    const sy = Math.hypot(R00, R10);
    pitch = Math.atan2(-R20, sy);
    yaw = Math.atan2(R10, R00);
    roll = Math.atan2(R21, R22);
  }
  const nose = pt(1);
  const head = [yaw, pitch, roll, nose.x - 0.5, nose.y - 0.5];

  if (![...gaze, ...head].every(Number.isFinite)) return null;
  return { gaze, head };
}

function averageFeatures(frames) {
  if (frames.length === 0) return null;
  const n = frames.length;
  const gaze = new Array(6).fill(0);
  const head = new Array(5).fill(0);
  for (const f of frames) {
    for (let i = 0; i < 6; i++) gaze[i] += f.gaze[i];
    for (let i = 0; i < 5; i++) head[i] += f.head[i];
  }
  return { gaze: gaze.map((v) => v / n), head: head.map((v) => v / n) };
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
  // 16:9 panel: width:height = 16:9, diagonal in inches -> mm.
  const ratioW = 16, ratioH = 9;
  const norm = Math.hypot(ratioW, ratioH);
  const diagMm = diag * 25.4;
  $("width_mm").value = Math.round((diagMm * ratioW) / norm);
  $("height_mm").value = Math.round((diagMm * ratioH) / norm);
}

let previewLoop = null;
function startPreviewDetection() {
  const badge = $("face-indicator");
  const tick = () => {
    const res = detectNow();
    const ok = res && res.faceLandmarks && res.faceLandmarks.length > 0;
    badge.textContent = ok ? "face detected ✓" : "face: searching…";
    badge.classList.toggle("good", !!ok);
    badge.classList.toggle("bad", !ok);
    $("start-btn").disabled = !ok || !geometryValid();
    previewLoop = requestAnimationFrame(tick);
  };
  previewLoop = requestAnimationFrame(tick);
}

function geometryValid() {
  const wm = parseFloat($("width_mm").value);
  const hm = parseFloat($("height_mm").value);
  const vc = parseFloat($("viewing_cm").value);
  return [wm, hm, vc].every((v) => Number.isFinite(v) && v > 0);
}

// ============================================================
// Collector
// ============================================================
const canvas = $("stage");
const ctx = canvas.getContext("2d");

let collectState = null; // built in runCollection()

function buildQueue() {
  const order = ["calibration", "validation", "test"];
  const queue = [];
  for (const phase of order) {
    const targets = (CFG.splits && CFG.splits[phase]) || [];
    targets.forEach((t, i) => {
      queue.push({ phase, target: [t[0], t[1]], idx: i + 1, total: targets.length });
    });
  }
  return queue;
}

async function enterFullscreen() {
  try {
    await document.documentElement.requestFullscreen();
  } catch {
    /* non-fatal: proceed windowed */
  }
}

function sizeCanvas() {
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  return [w, h];
}

function drawDot(cx, cy, radius, progress) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // shrinking progress ring (outer -> collapses as progress -> 1)
  const ringR = radius + 26 * (1 - progress);
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress);
  ctx.strokeStyle = "#4da3ff";
  ctx.lineWidth = 4;
  ctx.stroke();
  // solid target dot
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#ff4d6d";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

function runCollection() {
  const [W, H] = sizeCanvas();
  const radius = CFG.target_radius_px || 20;
  const warmupN = CFG.warmup_frames || 10;
  const captureN = CFG.frames_per_target || 30;

  collectState = {
    queue: buildQueue(),
    pos: 0,
    W, H, radius, warmupN, captureN,
    warmupLeft: warmupN,
    frames: [],
    samples: [],
    aborted: false,
    raf: null,
  };
  $("hint-hud").textContent = "look at the dot · Space = next · Esc = abort";
  loop();
}

function currentDot() {
  return collectState.queue[collectState.pos];
}

function advanceDot(finalizeCurrent) {
  const st = collectState;
  const dot = currentDot();
  if (finalizeCurrent && dot) {
    const agg = averageFeatures(st.frames);
    if (agg) {
      st.samples.push({
        phase: dot.phase,
        target_norm: [dot.target[0], dot.target[1]],
        gaze_features: agg.gaze,
        headpose_features: agg.head,
      });
    }
  }
  st.pos += 1;
  st.warmupLeft = st.warmupN;
  st.frames = [];
  if (st.pos >= st.queue.length) finishCollection();
}

function loop() {
  const st = collectState;
  if (!st || st.aborted) return;
  st.raf = requestAnimationFrame(loop);

  const dot = currentDot();
  if (!dot) return;

  const cx = dot.target[0] * st.W;
  const cy = dot.target[1] * st.H;

  const res = detectNow();

  if (st.warmupLeft > 0) {
    st.warmupLeft -= 1;
    drawDot(cx, cy, st.radius, 0);
  } else {
    const feat = extractFeatures(res);
    if (feat) st.frames.push(feat);
    const progress = Math.min(1, st.frames.length / st.captureN);
    drawDot(cx, cy, st.radius, progress);
    if (st.frames.length >= st.captureN) {
      advanceDot(true);
    }
  }

  $("phase-hud").textContent = `${dot.phase} ${dot.idx}/${dot.total}`;
}

function stopCollectionLoop() {
  if (collectState && collectState.raf) cancelAnimationFrame(collectState.raf);
}

async function finishCollection() {
  const st = collectState;
  stopCollectionLoop();
  st.aborted = true; // guard the loop
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (document.fullscreenElement) {
    try { await document.exitFullscreen(); } catch { /* ignore */ }
  }
  await submitAndScore(st.samples);
}

function abortCollection() {
  const st = collectState;
  if (!st) return;
  st.aborted = true;
  stopCollectionLoop();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  overlay("");
  show("landing");
}

// ============================================================
// Submit + score
// ============================================================
async function submitAndScore(samples) {
  if (!samples.length) {
    overlay("No samples were collected. Returning to start…");
    setTimeout(() => { overlay(""); show("landing"); }, 1500);
    return;
  }
  overlay("Saving session…");

  const wm = parseFloat($("width_mm").value);
  const hm = parseFloat($("height_mm").value);
  const vcm = parseFloat($("viewing_cm").value);
  const meta = {
    screen_px: [collectState.W, collectState.H],
    screen_mm: [wm, hm],
    viewing_distance_mm: vcm * 10,
    camera: cameraResolution(),
    user_agent: navigator.userAgent,
  };

  let sessionId;
  try {
    const r = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meta, samples }),
    });
    if (!r.ok) throw new Error(`session save failed: ${r.status} ${await r.text()}`);
    sessionId = (await r.json()).session_id;
  } catch (e) {
    overlay(`Error saving session: ${e.message}`);
    return;
  }

  overlay("Scoring (calibration → validation)…");
  try {
    const r = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    if (!r.ok) throw new Error(`analyze failed: ${r.status} ${await r.text()}`);
    const metrics = await r.json();
    overlay("");
    renderResults(metrics, sessionId);
  } catch (e) {
    overlay(`Error scoring session: ${e.message}`);
  }
}

// ============================================================
// Results
// ============================================================
function fmt(v, d = 2) {
  return v == null || Number.isNaN(v) ? "–" : Number(v).toFixed(d);
}

function methodTable(title, m) {
  if (!m) return "";
  // metrics.json carries mean/median/p95 in DEGREES and mean-only in cm.
  return `
    <table>
      <caption>${title}</caption>
      <thead><tr><th>statistic</th><th>error (°)</th><th>error (cm)</th></tr></thead>
      <tbody>
        <tr><td>mean</td><td>${fmt(m.mean_error_deg)}</td><td>${fmt(m.mean_error_cm)}</td></tr>
        <tr><td>median</td><td>${fmt(m.median_error_deg)}</td><td>–</td></tr>
        <tr><td>p95</td><td>${fmt(m.p95_error_deg)}</td><td>–</td></tr>
        <tr><td>false-activation rate</td><td colspan="2" style="text-align:right">${fmt(m.false_activation_rate, 3)}</td></tr>
      </tbody>
    </table>`;
}

function verdictLine(metrics) {
  const g = metrics.method_gaze, h = metrics.method_headpose;
  const parts = [];
  if (g) {
    let q = "coarse region targeting, not pixel-precise";
    if (g.mean_error_deg <= 2) q = "fairly precise pointing";
    else if (g.mean_error_deg >= 7) q = "very coarse — large regions only";
    parts.push(`gaze mean ${fmt(g.mean_error_deg, 1)}° (${fmt(g.mean_error_cm, 1)} cm) — ${q}`);
  }
  if (h) parts.push(`head-pose mean ${fmt(h.mean_error_deg, 1)}° (${fmt(h.mean_error_cm, 1)} cm)`);
  return parts.join("; ") + ".";
}

function renderResults(metrics, sessionId) {
  $("verdict").textContent = verdictLine(metrics);
  $("metrics-tables").innerHTML =
    methodTable("Gaze (iris/eye landmarks)", metrics.method_gaze) +
    methodTable("Head pose (rigid transform)", metrics.method_headpose);
  const meta = metrics.meta || {};
  $("results-meta").textContent =
    `session ${sessionId} · n_validation=${meta.n_validation ?? "?"} ` +
    `· n_calibration=${meta.n_calibration ?? "?"} ` +
    `· viewing_distance=${meta.viewing_distance_mm ?? "?"} mm. ` +
    `Validation split only (test held out for a later final pass).`;
  show("results");
}

// ============================================================
// Wiring
// ============================================================
async function init() {
  try {
    CFG = await (await fetch("/api/config")).json();
  } catch (e) {
    overlay(`Failed to load /api/config: ${e.message}`);
    return;
  }
  prefillGeometry();

  try {
    await startCamera();
  } catch (e) {
    overlay(`Camera access denied or unavailable: ${e.message}`);
    return;
  }
  try {
    await loadLandmarker();
  } catch (e) {
    overlay(`Failed to load MediaPipe: ${e.message}`);
    return;
  }
  startPreviewDetection();

  // geometry inputs revalidate the Start button
  for (const id of ["width_mm", "height_mm", "viewing_cm"]) {
    $(id).addEventListener("input", () => {
      // start-btn enable is re-evaluated each preview tick; nothing else needed
    });
  }
  $("diag-apply").addEventListener("click", () => { applyDiagonal(); });

  $("start-btn").addEventListener("click", async () => {
    if (!geometryValid()) return;
    if (previewLoop) cancelAnimationFrame(previewLoop);
    show("collector");
    await enterFullscreen();
    // brief settle so the fullscreen layout is final before we size the canvas
    setTimeout(runCollection, 120);
  });

  $("again-btn").addEventListener("click", () => {
    show("landing");
    startPreviewDetection();
  });

  updatePxReadout();
}

// keyboard: Space advances current dot, Esc aborts
window.addEventListener("keydown", (e) => {
  if (!screens.collector.classList.contains("active")) return;
  if (e.code === "Space") {
    e.preventDefault();
    if (collectState && !collectState.aborted) advanceDot(true);
  } else if (e.code === "Escape") {
    e.preventDefault();
    abortCollection();
  }
});

window.addEventListener("resize", () => {
  if (screens.collector.classList.contains("active") && collectState && !collectState.aborted) {
    const [w, h] = sizeCanvas();
    collectState.W = w;
    collectState.H = h;
  }
});

init();
