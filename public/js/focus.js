// Focus timer: a small countdown that stays on screen in every view and reader.
import { toast, fmtDuration } from "./util.js";

let end = 0, iv = 0, pill = null, length = 0;

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [660, 880, 990].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.28);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.28 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.28 + 0.9);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + i * 0.28); o.stop(ctx.currentTime + i * 0.28 + 1);
    });
  } catch {}
}

function draw() {
  if (!pill) return;
  const left = Math.max(0, Math.round((end - Date.now()) / 1000));
  pill.querySelector("span").textContent = fmtDuration(left);
  pill.style.setProperty("--p", `${100 - (left / (length * 60)) * 100}%`);
  if (left <= 0) {
    stopFocus(true);
    chime();
    toast(`Focus session done: ${length} minutes. Stretch, then go again?`, { action: "Again", onAction: () => startFocus(length), ms: 9000 });
  }
}

export function startFocus(minutes) {
  stopFocus(true);
  length = minutes;
  end = Date.now() + minutes * 60_000;
  pill = document.createElement("button");
  pill.type = "button";
  pill.className = "focus-pill";
  pill.title = "Focus timer. Click to stop.";
  pill.innerHTML = `<i></i><span></span>`;
  pill.onclick = () => { stopFocus(); };
  document.body.append(pill);
  draw();
  iv = setInterval(draw, 1000);
  toast(`Focus timer: ${minutes} minutes. Happy reading.`);
}

export function stopFocus(silent = false) {
  clearInterval(iv); iv = 0;
  if (pill) { pill.remove(); pill = null; if (!silent) toast("Focus timer stopped."); }
}

export const focusRunning = () => !!pill;
