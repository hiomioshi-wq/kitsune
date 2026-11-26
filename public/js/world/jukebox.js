// Lantern Jukebox & Soundstage: 6 offline WebAudio synth tracks for Kitsune World + a 4-lane Rhythm Encore mini-game.
import { esc } from "../util.js";

const TRACKS = [
  { id: "dusk", name: "Hollow Pine Dusk", bpm: 92, notes: [261.6, 329.6, 392.0, 493.9, 392.0, 329.6, 293.7, 349.2], wave: "triangle" },
  { id: "market", name: "Night Market Lanterns", bpm: 112, notes: [293.7, 349.2, 440.0, 523.3, 440.0, 392.0, 329.6, 293.7], wave: "sine" },
  { id: "sky", name: "Starlight Airship", bpm: 124, notes: [329.6, 392.0, 493.9, 659.3, 587.3, 493.9, 392.0, 329.6], wave: "triangle" },
  { id: "nexus", name: "Astral Nexus", bpm: 132, notes: [220.0, 329.6, 440.0, 523.3, 659.3, 523.3, 440.0, 329.6], wave: "sawtooth" },
  { id: "tavern", name: "Fox & Lantern Rag", bpm: 138, notes: [261.6, 329.6, 392.0, 523.3, 440.0, 349.2, 392.0, 293.7], wave: "square" },
  { id: "winter", name: "Winterfest Bells", bpm: 100, notes: [523.3, 493.9, 440.0, 392.0, 440.0, 523.3, 659.3, 587.3], wave: "sine" },
];

export function createJukebox(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.jukebox ||= {});
  st.best ||= 0;
  st.plays ||= 0;

  let ctx = null;
  let playing = null;
  let timer = 0;
  let step = 0;
  let vol = 0.14;

  const ensureCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };

  function playNote(freq, wave = "triangle", dur = 0.25) {
    try {
      const c = ensureCtx();
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      osc.connect(g);
      g.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur);
    } catch {}
  }

  function stopMusic() {
    if (timer) { clearInterval(timer); timer = 0; }
    playing = null;
  }

  function startTrack(id) {
    stopMusic();
    const tr = TRACKS.find((t) => t.id === id);
    if (!tr) return;
    playing = tr.id;
    step = 0;
    const ms = Math.round(60000 / tr.bpm / 2);
    timer = setInterval(() => {
      if (playing !== tr.id) return;
      const f = tr.notes[step % tr.notes.length];
      playNote(f, tr.wave, ms / 1000 * 1.4);
      step++;
    }, ms);
  }

  function open() {
    let encore = null;

    const draw = () => {
      const trackRows = TRACKS.map((tr) => {
        const on = playing === tr.id;
        return `<div class="se-good">
          <span><strong>${on ? "🔊 " : "🎵 "}${esc(tr.name)}</strong><small>${tr.bpm} BPM · ${tr.wave}</small></span>
          <button type="button" class="btn ${on ? "" : "btn-accent"}" data-tr="${tr.id}">${on ? "Stop" : "Play"}</button>
        </div>`;
      }).join("");

      const pads = [0, 1, 2, 3].map((i) => {
        const active = encore && encore.target === i;
        return `<button type="button" data-pad="${i}" style="height:68px;border-radius:12px;border:2px solid ${active ? "#ffd84d" : "rgba(255,255,255,.2)"};background:${active ? "#ff9a3a" : "rgba(255,255,255,.06)"};color:#fff;font:900 18px system-ui;cursor:pointer">${["🏮", "🦊", "⭐", "🔔"][i]}</button>`;
      }).join("");

      panel("Lantern Jukebox & Soundstage", `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
          <label style="display:flex;align-items:center;gap:8px">Volume <input type="range" id="jb-vol" min="0" max="0.4" step="0.02" value="${vol}"></label>
          <span class="muted">Encore Best: <strong>${st.best}</strong> · Shows: <strong>${st.plays}</strong></span>
        </div>
        <div class="se-mkt">${trackRows}</div>
        <h3 style="margin-top:14px">Stage Encore (Rhythm Mini-Game)</h3>
        <p class="muted">Tap the lit lantern pad as fast as you can for 15 seconds. Pays mon + Renown!</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0">${pads}</div>
        <div class="px-row">
          <button type="button" class="btn btn-accent" id="jb-go" ${encore ? "disabled" : ""}>${encore ? `Score: ${encore.score} · ${encore.left}s` : "Start Encore"}</button>
        </div>
      `, (e) => {
        e.querySelector("#jb-vol").oninput = (ev) => { vol = +ev.target.value; };
        e.querySelectorAll("[data-tr]").forEach((b) => {
          b.onclick = () => {
            if (playing === b.dataset.tr) stopMusic();
            else startTrack(b.dataset.tr);
            draw();
          };
        });

        e.querySelectorAll("[data-pad]").forEach((b) => {
          b.onclick = () => {
            if (!encore) return;
            const i = +b.dataset.pad;
            if (i === encore.target) {
              encore.score++;
              playNote([392, 440, 523.3, 659.3][i], "triangle", 0.16);
              encore.target = Math.floor(Math.random() * 4);
              draw();
            } else {
              playNote(140, "sawtooth", 0.12);
            }
          };
        });

        const goBtn = e.querySelector("#jb-go");
        if (goBtn) goBtn.onclick = () => {
          if (encore) return;
          encore = { score: 0, left: 15, target: Math.floor(Math.random() * 4) };
          ping("choice");
          draw();
          const t = setInterval(() => {
            if (!e.isConnected) { clearInterval(t); encore = null; return; }
            encore.left--;
            if (encore.left <= 0) {
              clearInterval(t);
              const sc = encore.score;
              encore = null;
              st.plays++;
              st.best = Math.max(st.best, sc);
              const pay = sc * 3;
              s.mon += pay;
              addRenown?.(Math.min(40, sc * 2));
              ping("done");
              toast(`Encore complete! ${sc} hits -> +${pay} mon!`);
              save(); hud();
            }
            draw();
          }, 1000);
        };
      });
    };

    draw();
  }

  return { open, stop: stopMusic, state: st };
}
