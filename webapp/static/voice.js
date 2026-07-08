/*
 * Voice command prototype: Web Speech transcription -> LLM intent -> action.
 *
 * The browser transcribes speech (Web Speech API); each final utterance is sent
 * to /api/voice_intent, which maps it to a structured command via `claude -p`
 * (the LLM intent layer — the differentiated piece). The command runs on a demo
 * surface (numbered/colored targets, a scroll list, a dictation field). Pairs
 * with head-point + gestures; real OS control + local Whisper come with the
 * native workstation app.
 */
const $ = (id) => document.getElementById(id);

const TARGETS = [
  { id: 1, color: "red", label: "one" },
  { id: 2, color: "green", label: "two" },
  { id: 3, color: "blue", label: "three" },
  { id: 4, color: "yellow", label: "four" },
  { id: 5, color: "purple", label: "five" },
  { id: 6, color: "orange", label: "six" },
];
const COLORS = { red: "#e74c3c", green: "#2ecc71", blue: "#4da3ff", yellow: "#f1c40f", purple: "#9b59b6", orange: "#e67e22" };
const lit = new Set();

function renderTargets() {
  $("targets").innerHTML = TARGETS.map((t) =>
    `<div class="vc-target ${lit.has(t.id) ? "lit" : ""}" style="--c:${COLORS[t.color]}">
       <span class="vc-num">${t.id}</span></div>`).join("");
}
function renderScroll() {
  const el = $("scroll");
  if (!el.dataset.built) {
    el.innerHTML = Array.from({ length: 40 }, (_, i) => `<div class="vc-item">item ${i + 1}</div>`).join("");
    el.dataset.built = "1";
  }
}

// ---- action execution ----
function log(utt, intent, note) {
  const row = document.createElement("div"); row.className = "vc-logrow";
  row.innerHTML = `<span class="vc-utt">“${utt}”</span> <span class="vc-arrow">→</span> ` +
    `<code>${JSON.stringify(intent)}</code> <span class="vc-note">${note || ""}</span>`;
  $("log").prepend(row);
  while ($("log").children.length > 8) $("log").lastChild.remove();
}
function execute(utt, intent) {
  let note = "";
  switch (intent.action) {
    case "click": {
      const t = TARGETS.find((x) => x.id === Number(intent.which));
      if (t) { lit.add(t.id); renderTargets(); note = `clicked #${t.id} (${t.color})`; }
      else note = "no such target";
      break;
    }
    case "scroll": {
      const el = $("scroll"); el.scrollTop += (intent.direction === "up" ? -1 : 1) * el.clientHeight * 0.8;
      note = `scrolled ${intent.direction || "down"}`; break;
    }
    case "type": {
      const d = $("dictation"); d.value += (d.value && !d.value.endsWith(" ") ? " " : "") + (intent.text || "");
      note = "typed"; break;
    }
    case "clear": { $("dictation").value = ""; note = "cleared"; break; }
    default: note = "no match";
  }
  log(utt, intent, note);
}

async function handleUtterance(utt) {
  $("mic-status").textContent = "thinking…";
  try {
    const r = await fetch("/api/voice_intent", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utterance: utt, targets: TARGETS }),
    });
    if (!r.ok) { log(utt, { action: "error" }, `${r.status}`); return; }
    const j = await r.json();
    execute(utt, j.intent || { action: "none" });
  } catch (e) { log(utt, { action: "error" }, e.message); }
  finally { $("mic-status").textContent = listening ? "listening…" : "idle"; }
}

// ---- Web Speech ----
let rec = null, listening = false;
function setupSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { overlay("This browser has no Web Speech API — use Chrome for the voice prototype."); $("mic-btn").disabled = true; return; }
  rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
  rec.onresult = (e) => {
    let interim = "", finalTxt = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const seg = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalTxt += seg; else interim += seg;
    }
    $("interim").textContent = (finalTxt || interim || "—");
    if (finalTxt.trim()) handleUtterance(finalTxt.trim());
  };
  rec.onerror = (e) => { $("mic-status").textContent = `error: ${e.error}`; };
  rec.onend = () => { if (listening) { try { rec.start(); } catch { /* already starting */ } } };
}
function overlay(m) { $("overlay-msg").textContent = m; $("overlay").classList.toggle("hidden", !m); }

$("mic-btn").addEventListener("click", () => {
  if (!rec) return;
  listening = !listening;
  if (listening) { try { rec.start(); } catch { /* ignore */ } $("mic-btn").textContent = "⏹ Stop listening"; $("mic-status").textContent = "listening…"; }
  else { rec.stop(); $("mic-btn").textContent = "🎙 Start listening"; $("mic-status").textContent = "idle"; }
});

renderTargets(); renderScroll(); setupSpeech();
