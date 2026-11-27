// Foxhold Botanical Conservatory: live animated greenhouse, 12 rare seeds, cross-breeding lab, misting/harvest-all, and herbarium dex.
import { esc, today } from "../util.js";

const SEEDS = [
  { id: "lotus", name: "Moonlight Lotus", icon: "🪷", cost: 10, sell: 28, ren: 12, col: "#f7b2d9", desc: "Floats in shallow moonlit basins." },
  { id: "orchid", name: "Foxfire Orchid", icon: "🌺", cost: 16, sell: 44, ren: 18, col: "#ff8a3a", desc: "Petals glow warm orange at dusk." },
  { id: "rose", name: "Brask Brass-Rose", icon: "🌹", cost: 22, sell: 60, ren: 22, col: "#e04858", desc: "Petals chime softly like clock springs." },
  { id: "sealily", name: "Saltwick Sea-Lily", icon: "💠", cost: 28, sell: 78, ren: 28, col: "#7fe8d0", desc: "Thrives on coastal sea-spray." },
  { id: "epoppy", name: "Emerald Poppy", icon: "🌷", cost: 36, sell: 105, ren: 35, col: "#35d68a", desc: "Cultivated along the Emerald Road." },
  { id: "nightshade", name: "Blackwood Nightshade", icon: "🪻", cost: 44, sell: 125, ren: 40, col: "#a478f0", desc: "Grown in Professor Briar's greenhouse." },
  { id: "clover8", name: "Eight-Leaf Clover", icon: "🍀", cost: 52, sell: 150, ren: 48, col: "#67d6a4", desc: "Picked from Biscuit's Meadow beyond the wall." },
  { id: "kelpfern", name: "Kelp-Silk Fern", icon: "🌿", cost: 64, sell: 185, ren: 56, col: "#4fc49a", desc: "Drapes like sea-silk in humid air." },
  { id: "bellflower", name: "Whispering Bellflower", icon: "🔔", cost: 75, sell: 215, ren: 64, col: "#ffd84d", desc: "Rings once when misted." },
  // Hybrid-only or high-tier seeds
  { id: "edelweiss", name: "Starfall Edelweiss", icon: "❄️", cost: 90, sell: 265, ren: 80, col: "#bfe8ff", hybrid: ["lotus", "sealily"], desc: "Cross-bred from Moonlight Lotus × Saltwick Sea-Lily." },
  { id: "harrow", name: "Harrow Velvet-Orchid", icon: "🥀", cost: 110, sell: 330, ren: 95, col: "#d94a7a", hybrid: ["orchid", "nightshade"], desc: "Cross-bred from Foxfire Orchid × Blackwood Nightshade." },
  { id: "sunburst", name: "Sovereign Sunburst", icon: "🌻", cost: 140, sell: 420, ren: 120, col: "#ffe28a", hybrid: ["epoppy", "bellflower"], desc: "Cross-bred from Emerald Poppy × Whispering Bellflower." },
];

export function createBotanical(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.botanical ||= {});
  st.pots ||= [null, null, null, null]; // { id, stage: 0..2 }
  st.harvested ||= 0;
  st.dex ||= {};
  st.unlocked ||= {};
  st.mistDay ||= "";

  let tab = "pots"; // "pots" | "breed" | "dex"
  let seedId = "lotus";
  let raf = 0;

  const canUse = (sd) => !sd.hybrid || !!st.unlocked[sd.id];

  function startCanvas(canvas) {
    cancelAnimationFrame(raf);
    if (!canvas) return;
    const g = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const motes = Array.from({ length: 18 }, (_, i) => ({ x: (i * 53) % W, y: (i * 31) % H, sp: 10 + (i % 4) * 6, p: i }));

    const frame = (now) => {
      if (!canvas.isConnected) return;
      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#173226");
      grad.addColorStop(1, "#0b1712");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);

      // Glasshouse panes
      g.strokeStyle = "rgba(180,240,210,.12)";
      g.lineWidth = 2;
      for (let x = 70; x < W; x += 70) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }

      // Wooden bench
      g.fillStyle = "#5a3d28";
      g.fillRect(0, H - 30, W, 30);

      // Draw each pot
      const n = st.pots.length;
      const spacing = W / (n + 1);
      st.pots.forEach((pot, i) => {
        const cx = spacing * (i + 1), by = H - 24;
        g.fillStyle = "#9a5236";
        g.beginPath(); g.moveTo(cx - 18, by - 26); g.lineTo(cx + 18, by - 26); g.lineTo(cx + 13, by); g.lineTo(cx - 13, by); g.closePath(); g.fill();
        g.fillStyle = "#b86442";
        g.fillRect(cx - 21, by - 31, 42, 7);
        if (!pot) return;
        const sd = SEEDS.find((x) => x.id === pot.id) || SEEDS[0];
        const sway = Math.sin(now / 480 + i) * 3;
        g.strokeStyle = "#57b86a";
        g.lineWidth = 3;
        const h = pot.stage === 0 ? 16 : pot.stage === 1 ? 32 : 46;
        g.beginPath(); g.moveTo(cx, by - 31); g.quadraticCurveTo(cx + sway, by - 31 - h / 2, cx + sway * 1.4, by - 31 - h); g.stroke();
        if (pot.stage >= 1) {
          g.fillStyle = "#57b86a";
          g.beginPath(); g.ellipse(cx - 8, by - 46, 8, 4, -0.4, 0, 7); g.ellipse(cx + 8, by - 46, 8, 4, 0.4, 0, 7); g.fill();
        }
        if (pot.stage >= 2) {
          g.fillStyle = sd.col;
          g.beginPath(); g.arc(cx + sway * 1.4, by - 31 - h, 10, 0, 7); g.fill();
          g.fillStyle = "rgba(255,255,255,.35)";
          g.beginPath(); g.arc(cx + sway * 1.4, by - 31 - h, 15 + Math.sin(now / 300 + i) * 2, 0, 7); g.fill();
        }
      });

      // Fireflies / pollen
      g.fillStyle = "rgba(255,235,150,.55)";
      for (const m of motes) {
        const x = (m.x + now / 1000 * m.sp) % W;
        const y = m.y + Math.sin(now / 420 + m.p) * 8;
        g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  function open(nextTab = tab) {
    tab = nextTab;
    cancelAnimationFrame(raf);
    const avail = SEEDS.filter(canUse);
    if (!avail.some((x) => x.id === seedId)) seedId = avail[0].id;
    const tabs = [
      ["pots", `Greenhouse (${st.pots.length} Pots)`],
      ["breed", "Cross-Breeding Lab"],
      ["dex", `Herbarium (${Object.keys(st.dex).length}/${SEEDS.length})`],
    ].map(([k, l]) => `<button type="button" class="chip${tab === k ? " on" : ""}" data-tab="${k}">${l}</button>`).join("");

    let body = "";
    if (tab === "pots") {
      const canExpand = st.pots.length < 8;
      const expandCost = st.pots.length * 60;
      const canMist = st.mistDay !== today();
      const seedBtns = avail.map((sd) =>
        `<button type="button" class="chip${seedId === sd.id ? " on" : ""}" data-sd="${sd.id}">${sd.icon} ${esc(sd.name)} (${sd.cost}→${sd.sell})</button>`
      ).join("");

      const potsHtml = st.pots.map((pot, i) => {
        if (!pot) {
          const sd = SEEDS.find((x) => x.id === seedId) || SEEDS[0];
          return `<div class="se-good">
            <span><strong>🪴 Pot ${i + 1} · Empty</strong><small>Plant ${esc(sd.name)} for ${sd.cost} mon</small></span>
            <button type="button" class="btn btn-sm btn-accent" data-pl="${i}" ${s.mon < sd.cost ? "disabled" : ""}>Plant (${sd.cost})</button>
          </div>`;
        }
        const sd = SEEDS.find((x) => x.id === pot.id) || SEEDS[0];
        const ready = pot.stage >= 2;
        return `<div class="se-good">
          <span><strong>${ready ? sd.icon : "🌱"} Pot ${i + 1} · ${esc(sd.name)}</strong><small>${ready ? `In full bloom! Harvest for +${sd.sell} mon & +${sd.ren} Renown` : `Growth stage ${pot.stage}/2 — water to grow`}</small></span>
          ${ready
            ? `<button type="button" class="btn btn-sm btn-accent" data-hv="${i}">Harvest (+${sd.sell})</button>`
            : `<button type="button" class="btn btn-sm btn-accent" data-wt="${i}">Water 💧</button>`}
        </div>`;
      }).join("");

      body = `
        <canvas id="bot-canvas" width="560" height="150" style="width:100%;height:auto;border-radius:10px;border:1px solid rgba(255,255,255,.15);display:block;margin-bottom:10px"></canvas>
        <div class="px-row" style="margin-bottom:8px">
          <button type="button" class="btn btn-accent" id="bot-mist" ${canMist ? "" : "disabled"}>${canMist ? "Daily Glasshouse Mist (Grow All +1)" : "Misted Today ✓"}</button>
          <button type="button" class="btn" id="bot-hvall">Harvest All Ready</button>
          ${canExpand ? `<button type="button" class="btn" id="bot-exp" ${s.mon >= expandCost ? "" : "disabled"}>Add Pot (${expandCost} mon)</button>` : ""}
        </div>
        <div class="chips" style="margin:8px 0">${seedBtns}</div>
        <div class="se-mkt">${potsHtml}</div>`;
    } else if (tab === "breed") {
      const hybrids = SEEDS.filter((x) => x.hybrid);
      body = `<p class="muted">Once you've harvested both parent species, cross-breed them here to permanently unlock rare Hybrid Seeds!</p>
        <div class="se-mkt">${hybrids.map((h) => {
          const own = !!st.unlocked[h.id];
          const [p1, p2] = h.hybrid.map((id) => SEEDS.find((x) => x.id === id));
          const hasParents = !!st.dex[p1.id] && !!st.dex[p2.id];
          return `<div class="se-good${own ? " cheap" : ""}"><span><strong>${h.icon} ${esc(h.name)}</strong><small>${esc(p1.name)} (${st.dex[p1.id] ? "✓" : "needed"}) × ${esc(p2.name)} (${st.dex[p2.id] ? "✓" : "needed"}) · Sells for ${h.sell} mon</small></span>${own ? `<span class="pill pill-done">Unlocked ✓</span>` : `<button type="button" class="btn btn-sm btn-accent" data-br="${h.id}" ${hasParents ? "" : "disabled"}>Cross-Breed</button>`}</div>`;
        }).join("")}</div>`;
    } else {
      body = `<p class="muted">Discovered <strong>${Object.keys(st.dex).length}</strong> of <strong>${SEEDS.length}</strong> botanical species · Total Harvested: <strong>${st.harvested}</strong></p>
        <div class="se-mkt">${SEEDS.map((sd) => {
          const n = st.dex[sd.id] || 0;
          return `<div class="se-good${n ? " cheap" : ""}"><span><strong>${n ? `${sd.icon} ${esc(sd.name)}` : "???"}</strong><small>${n ? `${esc(sd.desc)} · Harvested ×${n}` : sd.hybrid ? "Unlock in Cross-Breeding Lab" : `Grow from ${sd.cost} mon seed`}</small></span></div>`;
        }).join("")}</div>`;
    }

    panel(`Foxhold Botanical Conservatory · ${st.harvested} Harvested`, `<div class="chips" style="margin-bottom:10px">${tabs}</div>${body}`, (e) => {
      e.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => open(b.dataset.tab)));
      const canvas = e.querySelector("#bot-canvas");
      if (canvas) startCanvas(canvas);

      e.querySelector("#bot-mist")?.addEventListener("click", () => {
        if (st.mistDay === today()) return;
        st.mistDay = today();
        for (const p of st.pots) if (p && p.stage < 2) p.stage++;
        ping("done"); toast("Warm greenhouse mist nourishes every pot!");
        save(); open("pots");
      });

      e.querySelector("#bot-hvall")?.addEventListener("click", () => {
        let count = 0, cash = 0, ren = 0;
        st.pots.forEach((pot, i) => {
          if (!pot || pot.stage < 2) return;
          const sd = SEEDS.find((x) => x.id === pot.id) || SEEDS[0];
          st.pots[i] = null; st.harvested++; st.dex[sd.id] = (st.dex[sd.id] || 0) + 1;
          cash += sd.sell; ren += sd.ren; count++;
        });
        if (!count) return toast("No blooms ready to harvest yet.");
        s.mon += cash; addRenown?.(ren); ping("done");
        toast(`Harvested ${count} blooms! +${cash} mon & +${ren} Renown!`);
        save(); hud(); open("pots");
      });

      e.querySelector("#bot-exp")?.addEventListener("click", () => {
        const cost = st.pots.length * 60;
        if (st.pots.length >= 8 || s.mon < cost) return;
        s.mon -= cost; st.pots.push(null);
        ping("done"); toast(`Added Pot ${st.pots.length}!`);
        save(); hud(); open("pots");
      });

      e.querySelectorAll("[data-sd]").forEach((b) => (b.onclick = () => { seedId = b.dataset.sd; open("pots"); }));
      e.querySelectorAll("[data-pl]").forEach((b) => (b.onclick = () => {
        const i = +b.dataset.pl, sd = SEEDS.find((x) => x.id === seedId);
        if (!sd || st.pots[i] || s.mon < sd.cost) return;
        s.mon -= sd.cost; st.pots[i] = { id: sd.id, stage: 0 };
        ping("choice"); save(); hud(); open("pots");
      }));
      e.querySelectorAll("[data-wt]").forEach((b) => (b.onclick = () => {
        const pot = st.pots[+b.dataset.wt];
        if (!pot || pot.stage >= 2) return;
        pot.stage++; ping("blip"); save(); open("pots");
      }));
      e.querySelectorAll("[data-hv]").forEach((b) => (b.onclick = () => {
        const i = +b.dataset.hv, pot = st.pots[i];
        if (!pot || pot.stage < 2) return;
        const sd = SEEDS.find((x) => x.id === pot.id) || SEEDS[0];
        st.pots[i] = null; st.harvested++; st.dex[sd.id] = (st.dex[sd.id] || 0) + 1;
        s.mon += sd.sell; addRenown?.(sd.ren);
        ping("done"); toast(`Harvested ${sd.name}! +${sd.sell} mon & +${sd.ren} Renown!`);
        save(); hud(); open("pots");
      }));
      e.querySelectorAll("[data-br]").forEach((b) => (b.onclick = () => {
        const h = SEEDS.find((x) => x.id === b.dataset.br);
        if (!h || !h.hybrid || st.unlocked[h.id]) return;
        if (!h.hybrid.every((id) => st.dex[id])) return;
        st.unlocked[h.id] = 1; ping("done");
        toast(`Unlocked Hybrid Seed: ${h.name}!`);
        save(); open("breed");
      }));
    });
  }

  return { open, state: st };
}
