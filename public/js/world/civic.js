// Foxhold Civic Center: Town Renovation, Fox Statue Commission, Fox-Run Festival, Nine-Tails NG+ Modifiers & Unhurried Accessibility Mode.
import { esc } from "../util.js";
import { settings, saveSettings } from "../store.js";

export const RENOVATIONS = [
  { id: "roads", name: "Paved Cobble Roads", cost: 300, desc: "Warm stone paving across Foxhold Plaza" },
  { id: "bridge", name: "Oak & Brass Bridge", cost: 500, desc: "Reinforced timber bridge with brass lanterns" },
  { id: "lamps", name: "Lit Streetlamps", cost: 400, desc: "Wrought-iron foxfire lamps lighting the square" },
  { id: "planters", name: "Sakura Flower Planters", cost: 250, desc: "Blossom boxes along Foxhold lanes" },
];

export const NINE_TAIL_MODS = [
  { id: "swift", name: "Tail I · Swift Paws", desc: "+20% overworld walking speed" },
  { id: "gold", name: "Tail II · Golden Magnet", desc: "+35% mon from orb pickups" },
  { id: "glow", name: "Tail III · Starlit Lantern", desc: "+45% night lantern light radius" },
  { id: "luck", name: "Tail IV · Scholar's Luck", desc: "+15% passive Lucky Ripple bonus" },
  { id: "renown", name: "Tail V · Double Renown", desc: "2× Renown from civic & world activities" },
  { id: "calm", name: "Tail VI · Unhurried Pace", desc: "Widens reflex minigame timing windows" },
  { id: "stamina", name: "Tail VII · Endless Wind", desc: "Extra stamina comfort in races" },
  { id: "feast", name: "Tail VIII · Harvest Aura", desc: "Festival turnout +15 visitors" },
  { id: "crown", name: "Tail IX · Sovereign Flame", desc: "Golden foxfire trail aura" },
];

export function createCivic(o) {
  const { s, people, panel, toast, ping, save, hud, fireworks, addRenown, fur } = o;
  const st = (s.civic ||= {});
  st.reno ||= {};
  st.statue ||= null;
  st.festivals ||= [];
  st.tailMods ||= [];

  let festDraft = { stall: "Tea Stall", music: "Koto Ensemble", shell: "Foxfire Gold", host: people[0]?.n?.[2] || "Kitsu" };

  function open(tab = "reno") {
    const tabs = [
      ["reno", "Town Renovation"],
      ["statue", "Fox Statue"],
      ["festival", "Organise Festival"],
      ["ng", "Nine-Tails Mode"],
      ["a11y", "Accessibility"],
    ];
    const tabBar = `<div class="chips" style="margin-bottom:10px">${tabs.map(([k, l]) => `<button type="button" class="chip${tab === k ? " on" : ""}" data-ct="${k}">${l}</button>`).join("")}</div>`;

    let body = "";
    if (tab === "reno") {
      const doneN = RENOVATIONS.filter((r) => st.reno[r.id]).length;
      body = `
        <p class="muted">Permanently rebuild Foxhold piece by piece (${doneN}/${RENOVATIONS.length} built). Every upgrade appears directly on the town map!</p>
        <div class="se-mkt">${RENOVATIONS.map((r) => {
          const built = !!st.reno[r.id];
          return `<div class="se-good">
            <span><strong>🏗️ ${esc(r.name)}</strong><small>${esc(r.desc)}</small></span>
            ${built ? `<span class="pill pill-done">Built ✓</span>` : `<button type="button" class="btn btn-sm btn-accent" data-reno="${r.id}" ${s.mon < r.cost ? "disabled" : ""}>Build (${r.cost} mon)</button>`}
          </div>`;
        }).join("")}</div>`;
    } else if (tab === "statue") {
      body = st.statue
        ? `<div class="se-good"><span><strong>🦊 Your Fox Statue Stands in Foxhold Square!</strong><small>Carved wearing hat: <b>${esc(st.statue.hat || "None")}</b> · Fur: <b>${esc(st.statue.fur)}</b></small></span><span class="pill pill-done">Forever ✓</span></div>`
        : `<p class="muted">Commission a permanent bronze-and-gold statue of your fox — wearing your current hat (<b>${esc(s.hat || "None")}</b>) — in Foxhold Town Square forever.</p>
           <button type="button" class="btn btn-accent" id="cv-statue" ${s.mon < 1500 ? "disabled" : ""}>Commission Statue (1,500 mon)</button>`;
    } else if (tab === "festival") {
      const stalls = ["Tea Stall", "Origami Booth", "Ramen Cart"];
      const musics = ["Koto Ensemble", "Taiko Drums", "Wind-Bells"];
      const shells = ["Foxfire Gold", "Crimson Peony", "Azure Willow"];
      const hosts = people.slice(0, 6).map((p) => p.n[2]);
      body = `
        <p class="muted">Organise a fox-run festival! Pick stalls, music, Pyrotechnics Tent shells, and hire a resident host (180 mon).</p>
        <div class="se-mkt" style="margin-bottom:10px">
          <div class="se-good"><span><strong>Stall</strong></span><div class="chips">${stalls.map((x) => `<button type="button" class="chip${festDraft.stall === x ? " on" : ""}" data-fs="stall:${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
          <div class="se-good"><span><strong>Music</strong></span><div class="chips">${musics.map((x) => `<button type="button" class="chip${festDraft.music === x ? " on" : ""}" data-fs="music:${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
          <div class="se-good"><span><strong>Fireworks Shell</strong></span><div class="chips">${shells.map((x) => `<button type="button" class="chip${festDraft.shell === x ? " on" : ""}" data-fs="shell:${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
          <div class="se-good"><span><strong>Resident Host</strong></span><div class="chips">${hosts.map((x) => `<button type="button" class="chip${festDraft.host === x ? " on" : ""}" data-fs="host:${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
        </div>
        <button type="button" class="btn btn-accent" id="cv-fest" ${s.mon < 180 ? "disabled" : ""}>Launch Festival (180 mon)</button>
        ${st.festivals.length ? `<h4 style="margin-top:12px">Past Festivals</h4><div class="se-mkt">${st.festivals.slice(0, 5).map((f) => `<div class="se-good"><span><strong>🎆 ${esc(f.stall)} &amp; ${esc(f.music)}</strong><small>Hosted by ${esc(f.host)} · ${f.visitors} visitors · ${esc(f.shell)}</small></span></div>`).join("")}</div>` : ""}`;
    } else if (tab === "ng") {
      const unlocked = !!(s.final || s.realm?.["delve-stair"]?.beat);
      body = unlocked
        ? `<p class="muted"><strong>Nine-Tails Mode (NG+)</strong>: toggle any of the nine tail modifiers below.</p>
           <div class="se-mkt">${NINE_TAIL_MODS.map((m) => {
             const on = st.tailMods.includes(m.id);
             return `<div class="se-good"><span><strong>🦊 ${esc(m.name)}</strong><small>${esc(m.desc)}</small></span><button type="button" class="btn btn-sm ${on ? "btn-accent" : ""}" data-tm="${m.id}">${on ? "Active ✓" : "Enable"}</button></div>`;
           }).join("")}</div>`
        : `<p class="muted">Light the Ninth Lantern (Final Shrine) or clear the Bottomless Stair to unlock <strong>Nine-Tails Mode (NG+)</strong>.</p>`;
    } else {
      const unhurried = !!settings.world?.unhurried;
      body = `
        <p class="muted">Accessibility options for reflex and timing-based minigames across Kitsune World.</p>
        <div class="se-good">
          <span><strong>🐢 Unhurried Mode</strong><small>Widens timing windows and eases countdown speed in reflex minigames (Windvane, Daycare Shift, World Events, Derby)</small></span>
          <button type="button" class="btn btn-sm ${unhurried ? "btn-accent" : ""}" id="cv-a11y">${unhurried ? "Unhurried ON ✓" : "Enable Unhurried"}</button>
        </div>`;
    }

    panel(`Foxhold Civic Center · ${s.mon} mon`, tabBar + body, (e) => {
      e.querySelectorAll("[data-ct]").forEach((b) => (b.onclick = () => open(b.dataset.ct)));
      e.querySelectorAll("[data-reno]").forEach((b) => (b.onclick = () => {
        const r = RENOVATIONS.find((q) => q.id === b.dataset.reno);
        if (!r || st.reno[r.id] || s.mon < r.cost) return;
        s.mon -= r.cost;
        st.reno[r.id] = true;
        addRenown?.(45);
        ping("done");
        toast(`Renovated Foxhold: ${r.name}! Visible on the town map!`);
        save(); hud(); open("reno");
      }));
      const stBtn = e.querySelector("#cv-statue");
      if (stBtn) stBtn.onclick = () => {
        if (st.statue || s.mon < 1500) return;
        s.mon -= 1500;
        st.statue = { fur: fur || "#e0782c", hat: s.hat || "", at: Date.now() };
        s.gazetteExtra = "unveils a grand Fox Statue in Foxhold Square";
        addRenown?.(120);
        fireworks?.();
        ping("done");
        toast("Commissioned your Fox Statue in Foxhold Square! +120 Renown!");
        save(); hud(); open("statue");
      };
      e.querySelectorAll("[data-fs]").forEach((b) => (b.onclick = () => {
        const [k, v] = b.dataset.fs.split(":");
        festDraft[k] = v;
        ping("blip"); open("festival");
      }));
      const fBtn = e.querySelector("#cv-fest");
      if (fBtn) fBtn.onclick = () => {
        if (s.mon < 180) return;
        s.mon -= 180;
        const visitors = 24 + Math.floor(Math.random() * 25) + (st.tailMods.includes("feast") ? 15 : 0) + Object.keys(st.reno).length * 5;
        st.festivals.unshift({ ...festDraft, visitors, at: Date.now() });
        if (st.festivals.length > 10) st.festivals.length = 10;
        s.gazetteExtra = `hosts a ${festDraft.stall} festival drawing ${visitors} visitors`;
        addRenown?.(60);
        fireworks?.();
        ping("done");
        toast(`Festival launched! ${visitors} visitors cheered for ${festDraft.shell} fireworks! +60 Renown.`);
        save(); hud(); open("festival");
      };
      e.querySelectorAll("[data-tm]").forEach((b) => (b.onclick = () => {
        const id = b.dataset.tm;
        st.tailMods = st.tailMods.includes(id) ? st.tailMods.filter((x) => x !== id) : [...st.tailMods, id];
        ping("choice"); save(); open("ng");
      }));
      const aBtn = e.querySelector("#cv-a11y");
      if (aBtn) aBtn.onclick = () => {
        settings.world ||= {};
        settings.world.unhurried = !settings.world.unhurried;
        saveSettings?.();
        ping("choice");
        toast(settings.world.unhurried ? "Unhurried Mode enabled — wider timing windows!" : "Standard timing restored.");
        open("a11y");
      };
    });
  }

  return { open, state: st };
}
