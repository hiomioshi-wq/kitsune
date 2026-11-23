// Reading Sanctuary: Focus Timer, Web Audio Ambient Mixer, Reading Mood Log, and Safety Controls.
import { $, $$, esc, toast } from "../util.js";
import { setCrumbs } from "../main.js";

const STORE_KEY = "kitsune.sanctuary.v1";
const PROMPTS = [
  "Read one chapter somewhere quiet, with no notifications.",
  "Pick a story you've never opened before and give it ten minutes.",
  "Revisit a favourite passage and note one line that stayed with you.",
  "Read at a slower pace tonight — let the dialogue breathe.",
  "Explore a new genre or realm you usually skip.",
  "Finish a short script or one-shot before bed.",
  "Take a break after your next chapter and stretch your shoulders.",
];
const MOODS = [
  ["cozy", "Cozy", "#f2b23a"],
  ["curious", "Curious", "#58b888"],
  ["tense", "Tense", "#e0483c"],
  ["nostalgic", "Nostalgic", "#a88fe0"],
  ["focused", "Focused", "#6cc8ff"],
  ["sleepy", "Sleepy", "#7b8290"],
];

function loadState() {
  try {
    return { sessions: 0, minutes: 0, mood: "cozy", notes: [], ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return { sessions: 0, minutes: 0, mood: "cozy", notes: [] };
  }
}
function saveState(st) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch {}
}

function createMixer() {
  let ctx = null;
  const channels = new Map();
  const ensureCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };
  const makeNoise = (c, type) => {
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (type === "brown") {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2;
      } else if (type === "pink") {
        last = 0.96 * last + 0.04 * white;
        data[i] = last * 2.4;
      } else {
        data[i] = white * 0.6;
      }
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  };
  const setLevel = (id, vol) => {
    const v = Math.max(0, Math.min(1, vol));
    if (v <= 0.01) {
      const ch = channels.get(id);
      if (ch) {
        try { ch.src.stop(); } catch {}
        try { ch.gain.disconnect(); } catch {}
        channels.delete(id);
      }
      return;
    }
    const c = ensureCtx();
    let ch = channels.get(id);
    if (!ch) {
      const gain = c.createGain();
      const filter = c.createBiquadFilter();
      let src;
      if (id === "rain") {
        src = makeNoise(c, "pink");
        filter.type = "bandpass";
        filter.frequency.value = 1100;
        filter.Q.value = 0.7;
      } else if (id === "fire") {
        src = makeNoise(c, "brown");
        filter.type = "lowpass";
        filter.frequency.value = 420;
      } else if (id === "waves") {
        src = makeNoise(c, "brown");
        filter.type = "lowpass";
        filter.frequency.value = 680;
      } else {
        src = c.createOscillator();
        src.type = "sine";
        src.frequency.value = id === "chime" ? 432 : 220;
        filter.type = "lowpass";
        filter.frequency.value = 900;
      }
      src.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      src.start();
      ch = { src, gain, filter };
      channels.set(id, ch);
    }
    ch.gain.gain.setTargetAtTime(v * 0.25, c.currentTime, 0.08);
  };
  const stopAll = () => {
    for (const id of [...channels.keys()]) setLevel(id, 0);
  };
  return { setLevel, stopAll };
}

export async function render(view) {
  setCrumbs([["Reading Sanctuary", "sanctuary"]]);
  const st = loadState();
  const mixer = createMixer();
  const dayIdx = Math.floor(Date.now() / 86_400_000) % PROMPTS.length;

  let totalSec = 25 * 60;
  let leftSec = totalSec;
  let timerId = 0;
  let running = false;

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  view.innerHTML = `
    <div class="page-head">
      <div><p class="eyebrow">Quiet corner</p><h1 class="h1">Reading Sanctuary</h1></div>
      <a class="btn" href="#world">Open Kitsune World</a>
    </div>
    <div class="settings">
      <div class="panel">
        <h3 class="h3">Focus Reading Timer</h3>
        <p class="muted">Today's prompt: <strong>${esc(PROMPTS[dayIdx])}</strong></p>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:12px 0">
          <div id="sn-clock" style="font:800 42px/1 var(--f-display, system-ui);letter-spacing:1px">${fmt(leftSec)}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn btn-accent" id="sn-toggle">Start</button>
            <button type="button" class="btn" id="sn-reset">Reset</button>
            <button type="button" class="btn" data-min="15">15m</button>
            <button type="button" class="btn" data-min="25">25m</button>
            <button type="button" class="btn" data-min="45">45m</button>
          </div>
        </div>
        <p class="muted" id="sn-stats">Completed sessions: <strong>${st.sessions}</strong> · Total focused reading: <strong>${st.minutes} min</strong></p>
      </div>

      <div class="panel">
        <h3 class="h3">Ambient Soundscape Mixer</h3>
        <p class="muted">Synthesized locally in your browser — works offline with zero tracking.</p>
        <div style="display:grid;gap:10px;max-width:460px;margin:10px 0">
          ${[
            ["rain", "Rain on Window"],
            ["fire", "Warm Fireplace"],
            ["waves", "Night Ocean Waves"],
            ["chime", "432Hz Shrine Hum"],
          ].map(([id, label]) => `
            <label style="display:flex;align-items:center;justify-content:space-between;gap:12px">
              <span>${esc(label)}</span>
              <input type="range" min="0" max="100" value="0" data-snd="${id}" style="width:180px;accent-color:var(--accent)">
            </label>
          `).join("")}
        </div>
        <button type="button" class="btn btn-sm" id="sn-mute">Silence all</button>
      </div>

      <div class="panel">
        <h3 class="h3">Reading Mood &amp; Quick Note</h3>
        <div class="chips" id="sn-moods" style="margin-bottom:10px">
          ${MOODS.map(([k, label, col]) => `<button type="button" class="chip${st.mood === k ? " on" : ""}" data-mood="${k}" style="border-color:${col}">${esc(label)}</button>`).join("")}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input class="field" id="sn-note" type="text" maxlength="140" placeholder="Jot down a favourite line or thought…" style="flex:1;min-width:220px">
          <button type="button" class="btn btn-accent" id="sn-save-note">Save note</button>
        </div>
        <ul id="sn-notes" class="wd-list" style="margin-top:12px"></ul>
      </div>
    </div>
  `;

  const paintNotes = () => {
    const ul = $("#sn-notes", view);
    if (!ul) return;
    ul.innerHTML = st.notes.length
      ? st.notes.map((n, i) => `<li><strong>${esc(n.mood)}</strong><span>${esc(n.text)}</span><button type="button" class="btn btn-sm" data-del="${i}">×</button></li>`).join("")
      : `<li class="muted">No reading notes yet.</li>`;
    $$("[data-del]", ul).forEach((b) => {
      b.onclick = () => {
        st.notes.splice(+b.dataset.del, 1);
        saveState(st);
        paintNotes();
      };
    });
  };
  paintNotes();

  const stopTimer = () => {
    if (timerId) { clearInterval(timerId); timerId = 0; }
    running = false;
    const btn = $("#sn-toggle", view);
    if (btn) btn.textContent = "Start";
  };

  $("#sn-toggle", view).onclick = () => {
    if (running) { stopTimer(); return; }
    running = true;
    $("#sn-toggle", view).textContent = "Pause";
    timerId = setInterval(() => {
      leftSec--;
      const clk = $("#sn-clock", view);
      if (clk) clk.textContent = fmt(Math.max(0, leftSec));
      if (leftSec <= 0) {
        stopTimer();
        st.sessions++;
        st.minutes += Math.round(totalSec / 60);
        saveState(st);
        const stats = $("#sn-stats", view);
        if (stats) stats.innerHTML = `Completed sessions: <strong>${st.sessions}</strong> · Total focused reading: <strong>${st.minutes} min</strong>`;
        toast("Reading session complete!");
        leftSec = totalSec;
        if (clk) clk.textContent = fmt(leftSec);
      }
    }, 1000);
  };

  $("#sn-reset", view).onclick = () => {
    stopTimer();
    leftSec = totalSec;
    $("#sn-clock", view).textContent = fmt(leftSec);
  };

  $$("[data-min]", view).forEach((b) => {
    b.onclick = () => {
      stopTimer();
      totalSec = +b.dataset.min * 60;
      leftSec = totalSec;
      $("#sn-clock", view).textContent = fmt(leftSec);
    };
  });

  $$("[data-snd]", view).forEach((r) => {
    r.oninput = () => mixer.setLevel(r.dataset.snd, +r.value / 100);
  });
  $("#sn-mute", view).onclick = () => {
    mixer.stopAll();
    $$("[data-snd]", view).forEach((r) => { r.value = "0"; });
  };

  $$("[data-mood]", view).forEach((b) => {
    b.onclick = () => {
      st.mood = b.dataset.mood;
      saveState(st);
      $$("[data-mood]", view).forEach((x) => x.classList.toggle("on", x === b));
    };
  });

  $("#sn-save-note", view).onclick = () => {
    const inp = $("#sn-note", view);
    const text = inp.value.trim();
    if (!text) return;
    st.notes.unshift({ mood: st.mood, text, at: Date.now() });
    st.notes = st.notes.slice(0, 20);
    saveState(st);
    inp.value = "";
    paintNotes();
    toast("Note saved.");
  };

  return () => {
    stopTimer();
    mixer.stopAll();
  };
}
