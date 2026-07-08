/*
 * Gesture lab: live meter of MediaPipe FaceLandmarker blendshapes (52 ARKit
 * coefficients) to discover which facial gestures are crisp + separable enough
 * to use as discrete commands in a head-pointing + gesture control scheme.
 *
 * Enables outputFaceBlendshapes (off in the pointing pages). Own camera; no gaze.
 */
const TASKS_VISION_VERSION = "0.10.20";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}`;
const MODEL_URL_REMOTE =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const VENDOR_BUNDLE = "/static/vendor/tasks-vision/vision_bundle.mjs";
const VENDOR_WASM = "/static/vendor/tasks-vision/wasm";
const VENDOR_MODEL = "/static/vendor/models/face_landmarker.task";

const $ = (id) => document.getElementById(id);
const overlay = (m) => { $("overlay-msg").textContent = m; $("overlay").classList.toggle("hidden", !m); };
const video = $("preview");
let landmarker = null, lastTs = 0, stream = null;
const peaks = {};          // categoryName -> decaying peak
const PEAK_DECAY = 0.985;  // per frame

async function fileExists(url) { try { const r = await fetch(url, { method: "GET", cache: "force-cache" }); return r.ok; } catch { return false; } }
async function loadLandmarker() {
  overlay("Loading MediaPipe (with blendshapes)…");
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
    numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: false,
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

const meterEl = $("meter");
const rows = {};   // categoryName -> {wrap, bar, peakTick, val}
function ensureRow(name) {
  if (rows[name]) return rows[name];
  const wrap = document.createElement("div"); wrap.className = "gl-row";
  const label = document.createElement("span"); label.className = "gl-name"; label.textContent = name;
  const track = document.createElement("div"); track.className = "gl-track";
  const bar = document.createElement("div"); bar.className = "gl-bar";
  const tick = document.createElement("div"); tick.className = "gl-peak";
  const val = document.createElement("span"); val.className = "gl-val";
  track.appendChild(bar); track.appendChild(tick);
  wrap.appendChild(label); wrap.appendChild(track); wrap.appendChild(val);
  rows[name] = { wrap, bar, tick, val };
  return rows[name];
}

function render(cats) {
  const thr = parseFloat($("thr").value);
  const showAll = $("show-all").checked;
  // update peaks
  for (const c of cats) {
    peaks[c.categoryName] = Math.max((peaks[c.categoryName] || 0) * PEAK_DECAY, c.score);
  }
  let list = [...cats];
  if (!showAll) list.sort((a, b) => b.score - a.score);
  else list.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  const shown = showAll ? list : list.slice(0, 16);
  // clear + re-append in order
  meterEl.innerHTML = "";
  for (const c of shown) {
    const r = ensureRow(c.categoryName);
    const pct = Math.round(c.score * 100);
    r.bar.style.width = pct + "%";
    const hot = c.score >= thr;
    r.bar.classList.toggle("hot", hot);
    r.tick.style.left = Math.round((peaks[c.categoryName] || 0) * 100) + "%";
    r.val.textContent = c.score.toFixed(2);
    r.wrap.classList.toggle("triggered", hot);
    meterEl.appendChild(r.wrap);
  }
}

function loop() {
  requestAnimationFrame(loop);
  const res = detect();
  const badge = $("face-indicator");
  const cats = res && res.faceBlendshapes && res.faceBlendshapes[0] && res.faceBlendshapes[0].categories;
  const ok = !!(cats && cats.length);
  badge.textContent = ok ? "face detected ✓" : "face: searching…";
  badge.classList.toggle("good", ok); badge.classList.toggle("bad", !ok);
  if (ok) render(cats.filter((c) => c.categoryName !== "_neutral"));
}

async function init() {
  try { await startCamera(); } catch (e) { overlay(`Camera denied/unavailable: ${e.message}`); return; }
  try { await loadLandmarker(); } catch (e) { overlay(`MediaPipe failed: ${e.message}`); return; }
  $("thr").addEventListener("input", (e) => { $("thr-val").textContent = parseFloat(e.target.value).toFixed(2); });
  $("reset-peaks").addEventListener("click", () => { for (const k of Object.keys(peaks)) peaks[k] = 0; });
  loop();
}
init();
