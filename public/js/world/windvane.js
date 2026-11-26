// Skyward Windvane Loft: align 3 windmill sails to incoming gusts + daily breeze check.
import { esc, today } from "../util.js";

const DIRS = ["N", "E", "S", "W"];
const TRIMS = ["Low", "Mid", "High"];

function makeDuetBeats(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return [0, 1, 2, 3].map(() => {
    h = (Math.imul(h ^ (h >>> 13), 1274126177) + 17) >>> 0;
    return { dir: h % 4, trim: (h >>> 3) % 3 };
  });
}

export function createWindvane(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.windvane ||= {});
  st.tuned ||= 0;
  st.duets ||= 0;
  st.breezeDay ||= "";

  let rig = null;
  let duet = null;

  function startDuet(seed = Math.random().toString(36).slice(2, 6).toUpperCase()) {
    duet = { seed, beats: makeDuetBeats(seed), step: 0, p1: 0, p2: 0, over: false };
    rig = null;
    open();
  }

  function startRig() {
    duet = null;
    const target = [0, 1, 2].map(() => Math.floor(Math.random() * 4));
    const vanes = [0, 1, 2].map(() => Math.floor(Math.random() * 4));
    if (vanes.every((v, i) => v === target[i])) vanes[0] = (vanes[0] + 1) % 4;
    rig = { target, vanes, turns: 0, over: false };
    open();
  }

  function open() {
    const canCheck = st.breezeDay !== today();
    let body = "";

    if (duet) {
      const beat = duet.beats[duet.step] || duet.beats[duet.beats.length - 1];
      const matched = !duet.over && duet.p1 === beat.dir && duet.p2 === beat.trim;
      const shareUrl = `${location.origin}${location.pathname}#world?duet=${encodeURIComponent(duet.seed)}`;
      body = `
        <p class="muted"><strong>Lantern Weather Vane Duet</strong> · Seed: <b>${esc(duet.seed)}</b> · Beat <b>${Math.min(duet.step + 1, duet.beats.length)}/${duet.beats.length}</b></p>
        <p class="muted">P1 steers Heading (<b>A / D</b> or buttons) · P2 trims Sails (<b>J / L</b> or buttons). Match both to the wind rhythm!</p>
        <div class="se-mkt" style="margin:10px 0">
          <div class="se-good">
            <span><strong>Target Wind Rhythm</strong><small>Heading: <b>${DIRS[beat.dir]}</b> · Sail Trim: <b>${TRIMS[beat.trim]}</b></small></span>
            <span class="pill ${matched ? "pill-done" : ""}">${duet.over ? "Duet Complete ✓" : matched ? "In Sync!" : "Adjusting..."}</span>
          </div>
          <div class="se-good">
            <span><strong>Player 1 (Pilot)</strong><small>Steering: <b>${DIRS[duet.p1]}</b></small></span>
            <div class="px-row">
              <button type="button" class="btn btn-sm" id="wv-p1l">◀ A</button>
              <button type="button" class="btn btn-sm" id="wv-p1r">D ▶</button>
            </div>
          </div>
          <div class="se-good">
            <span><strong>Player 2 (Sail Trimmer)</strong><small>Trim: <b>${TRIMS[duet.p2]}</b></small></span>
            <div class="px-row">
              <button type="button" class="btn btn-sm" id="wv-p2l">◀ J</button>
              <button type="button" class="btn btn-sm" id="wv-p2r">L ▶</button>
            </div>
          </div>
        </div>
        <div class="px-row">
          <button type="button" class="btn btn-sm" id="wv-copy">Copy Duet Link</button>
          <button type="button" class="btn btn-sm" id="wv-back">Solo Rig</button>
        </div>
        <small class="muted" style="display:block;margin-top:6px;word-break:break-all">${esc(shareUrl)}</small>`;
    } else if (!rig) {
      body = `
        <p class="muted">Turn the three canvas windmill sails (N, E, S, W) to catch the mountain gusts. Aligning all three pays <strong>55 mon</strong> &amp; <strong>+25 Renown</strong>.</p>
        <p>Gusts harnessed: <strong>${st.tuned}</strong> · Duets won: <strong>${st.duets}</strong></p>
        <div class="px-row" style="margin-bottom:10px">
          <button type="button" class="btn btn-accent" id="wv-go">Trim Sails</button>
          <button type="button" class="btn btn-accent" id="wv-duet">2P Lantern Duet</button>
          <button type="button" class="btn" id="wv-day" ${canCheck ? "" : "disabled"}>${canCheck ? "Daily Breeze Check (+20 mon)" : "Checked Today ✓"}</button>
        </div>
        <div class="px-row">
          <input type="text" id="wv-seed-in" placeholder="Duet Seed (e.g. K7M2)" maxlength="8" style="max-width:160px">
          <button type="button" class="btn btn-sm" id="wv-join">Join Seed</button>
        </div>`;
    } else {
      const rows = [0, 1, 2].map((i) => `
        <div class="se-good">
          <span><strong>🌬️ Sail ${i + 1}: ${DIRS[rig.vanes[i]]}</strong> <small>(Gust: ${DIRS[rig.target[i]]})</small></span>
          <button type="button" class="btn btn-sm btn-accent" data-wv="${i}" ${rig.over ? "disabled" : ""}>Rotate ↻</button>
        </div>`).join("");

      body = `
        <p class="muted">Rotations: <strong>${rig.turns}/10</strong></p>
        <div class="se-mkt" style="margin:10px 0">${rows}</div>
        ${rig.over ? `<button type="button" class="btn btn-accent" id="wv-go">Catch Next Gust</button>` : ""}`;
    }

    panel("Skyward Windvane Loft", body, (e) => {
      const go = e.querySelector("#wv-go");
      if (go) go.onclick = startRig;

      const dBtn = e.querySelector("#wv-duet");
      if (dBtn) dBtn.onclick = () => startDuet();

      const jBtn = e.querySelector("#wv-join");
      if (jBtn) jBtn.onclick = () => {
        const val = (e.querySelector("#wv-seed-in")?.value || "").trim().toUpperCase();
        startDuet(val || undefined);
      };

      if (duet) {
        const checkBeat = () => {
          if (!duet || duet.over) return;
          const beat = duet.beats[duet.step];
          if (duet.p1 === beat.dir && duet.p2 === beat.trim) {
            duet.step++;
            ping("done");
            if (duet.step >= duet.beats.length) {
              duet.over = true;
              st.duets++;
              s.mon += 85;
              addRenown?.(40);
              toast("Wind rhythms matched! Duet victory: +85 mon & +40 Renown!");
              save(); hud();
            } else {
              toast(`Beat ${duet.step}/${duet.beats.length} locked in!`);
            }
          } else {
            ping("blip");
          }
          open();
        };
        const p1 = (delta) => { if (!duet || duet.over) return; duet.p1 = (duet.p1 + delta + 4) % 4; checkBeat(); };
        const p2 = (delta) => { if (!duet || duet.over) return; duet.p2 = (duet.p2 + delta + 3) % 3; checkBeat(); };
        e.querySelector("#wv-p1l").onclick = () => p1(-1);
        e.querySelector("#wv-p1r").onclick = () => p1(1);
        e.querySelector("#wv-p2l").onclick = () => p2(-1);
        e.querySelector("#wv-p2r").onclick = () => p2(1);
        e.querySelector("#wv-copy").onclick = () => {
          const shareUrl = `${location.origin}${location.pathname}#world?duet=${encodeURIComponent(duet.seed)}`;
          navigator.clipboard?.writeText?.(shareUrl);
          toast(`Copied duet link (Seed ${duet.seed})!`);
        };
        e.querySelector("#wv-back").onclick = () => { duet = null; open(); };
        const onKey = (ev) => {
          const k = ev.key.toLowerCase();
          if (k === "a") p1(-1);
          else if (k === "d") p1(1);
          else if (k === "j") p2(-1);
          else if (k === "l") p2(1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }

      const dayBtn = e.querySelector("#wv-day");
      if (dayBtn) dayBtn.onclick = () => {
        if (st.breezeDay === today()) return;
        st.breezeDay = today();
        s.mon += 20;
        addRenown?.(15);
        ping("done");
        toast("Logged a brisk tailwind from Saltwick! +20 mon & +15 Renown.");
        save(); hud(); open();
      };

      e.querySelectorAll("[data-wv]").forEach((btn) => {
        btn.onclick = () => {
          if (!rig || rig.over) return;
          const idx = Number(btn.dataset.wv);
          rig.turns++;
          rig.vanes[idx] = (rig.vanes[idx] + 1) % 4;
          ping("blip");

          if (rig.vanes.every((v, i) => v === rig.target[i])) {
            rig.over = true;
            st.tuned++;
            s.mon += 55;
            addRenown?.(25);
            ping("done");
            toast("The sails catch the full updraft! +55 mon & +25 Renown.");
            save(); hud();
          } else if (rig.turns >= 10) {
            rig.over = true;
            ping("close");
            toast("The gust passed before the sails locked in.");
          }
          open();
        };
      });
    });
  }

  return { open };
}
