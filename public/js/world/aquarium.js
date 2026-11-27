// Moonwake Sanctuary Aquarium: live animated tank, cross-realm species gallery, tank decor & biomes, daily visitor revenue, and specimen trivia.
import { esc, today } from "../util.js";
import { FISH } from "./data.js";
import { DEEP_FISH } from "./deepcore.js";
import { SKY_FISH } from "./skycore.js";
import { CATCHES } from "./seacore.js";

const BIOMES = [
  { id: "fresh", name: "Moonwake Freshwater", cost: 0, top: "#1b4a68", bot: "#091b2a", sand: "#c7b48a", ray: "rgba(180,235,255,.08)" },
  { id: "coral", name: "Coral Tidepool", cost: 160, top: "#1d6b7a", bot: "#0b2838", sand: "#e2cba0", ray: "rgba(120,255,220,.09)" },
  { id: "abyss", name: "Abyssal Trench", cost: 340, top: "#0c1b36", bot: "#03060e", sand: "#3a4052", ray: "rgba(120,160,255,.09)" },
  { id: "star", name: "Starlight Sky-Tank", cost: 520, top: "#221848", bot: "#0a071a", sand: "#9fb0d8", ray: "rgba(255,220,140,.1)" },
];

const DECOR = [
  { id: "kelp", name: "Swaying Kelp Forest", cost: 80, appeal: 8, desc: "Tall emerald kelp fronds." },
  { id: "lantern", name: "Sunken Paper Lantern", cost: 130, appeal: 12, desc: "Glows warm amber underwater." },
  { id: "coral_arch", name: "Pink Coral Arch", cost: 180, appeal: 16, desc: "A reef arch fish love to dart through." },
  { id: "clam", name: "Giant Pearl Clam", cost: 240, appeal: 20, desc: "Opens slowly to show a glowing pearl." },
  { id: "wreck", name: "Brass Bellwreck", cost: 320, appeal: 26, desc: "Half-buried diver's bell from Saltwick." },
  { id: "vent", name: "Bioluminescent Vent", cost: 420, appeal: 34, desc: "Releases shimmering star-bubbles." },
];

const SPECIMENS = [
  { name: "Lantern Carp", clue: "Glows faint amber near sunken steps", zone: "Moonwake Lake" },
  { name: "Saltwick Ray", clue: "Glides flat over shallow tidepools", zone: "Saltwick Shore" },
  { name: "Glacier Trout", clue: "Thrives in icy northern currents", zone: "Whiteback Peaks" },
  { name: "Emerald Koi", clue: "Swims through Oz's green canals", zone: "Emerald Road" },
  { name: "Clockwork Eel", clue: "Coils around submerged brass gears", zone: "Brask Canal" },
  { name: "Bookworm Trout", clue: "Known to nibble overdue library slips", zone: "Moonwake Lake" },
  { name: "Nine-tail Koi", clue: "Leaves nine golden ripples in its wake", zone: "All Waters" },
  { name: "Chrome Nautilus", clue: "Spirals past hydrothermal vents in the deep", zone: "Sunken Deep" },
  { name: "Moonwell Wraith", clue: "Translucent shimmer around the Moonwell", zone: "Sunken Deep" },
  { name: "Comet Koi", clue: "Trails stardust between cloud islands", zone: "Skyward Isles" },
  { name: "Eight-Legged Cloud-Hound", clue: "Paddles through cirrus clouds with eight fins", zone: "Skyward Isles" },
  { name: "Foxfire Ribbon-Eel", clue: "Coils like orange flame beneath ocean swells", zone: "High Seas" },
];

const FISH_COLORS = ["#ff8a5c", "#ffd25a", "#67d6a4", "#6eb8ff", "#ff8fb8", "#b58cff", "#7fe8d0", "#ffe8b0"];

export function createAquarium(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.aquarium ||= {});
  st.trivia ||= 0;
  st.feedDay ||= "";
  st.ticketDay ||= "";
  st.biome ||= "fresh";
  st.biomes ||= { fresh: 1 };
  st.decor ||= { kelp: 1 };
  st.display ||= {};

  let tab = "tank"; // "tank" | "gallery" | "shop" | "quiz"
  let round = null;
  let raf = 0;

  const catalog = () => [
    ...FISH.map((f) => ({ key: `w:${f[0]}`, name: f[1], src: "World Waters", worth: f[3] || 5, caught: !!(s.fish?.[f[0]]) })),
    ...DEEP_FISH.map((f) => ({ key: `d:${f[0]}`, name: f[1], src: "Sunken Deep", worth: f[2] || 20, caught: !!(s.deep?.fish?.[f[0]]) })),
    ...SKY_FISH.map((f) => ({ key: `k:${f[0]}`, name: f[1], src: "Skyward Isles", worth: f[2] || 20, caught: !!(s.sky?.fish?.[f[0]]) })),
    ...CATCHES.map((f) => ({ key: `s:${f[0]}`, name: f[1], src: "High Seas", worth: f[3] || 120, caught: !!(s.sea?.caught?.[f[0]]) })),
  ];

  const appeal = () => {
    const don = Object.keys(st.display).length;
    const dec = DECOR.filter((d) => st.decor[d.id]).reduce((a, d) => a + d.appeal, 0);
    const bio = st.biome === "fresh" ? 0 : 12;
    return 10 + don * 4 + dec + bio;
  };

  function startQuiz() {
    const pick = SPECIMENS[Math.floor(Math.random() * SPECIMENS.length)];
    const others = SPECIMENS.filter((x) => x.name !== pick.name).sort(() => Math.random() - 0.5).slice(0, 2);
    round = { pick, opts: [pick, ...others].sort(() => Math.random() - 0.5), done: false };
    open("quiz");
  }

  function startTankCanvas(canvas, foodRef) {
    cancelAnimationFrame(raf);
    if (!canvas) return;
    const g = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const biome = BIOMES.find((b) => b.id === st.biome) || BIOMES[0];
    const all = catalog();
    const activeFish = Object.keys(st.display)
      .map((k, i) => {
        const meta = all.find((x) => x.key === k);
        return {
          name: meta?.name || k,
          x: 40 + ((i * 73) % (W - 80)),
          y: 34 + ((i * 41) % (H - 76)),
          vx: (i % 2 ? 1 : -1) * (24 + (i % 5) * 9),
          vy: ((i % 3) - 1) * 8,
          col: FISH_COLORS[i % FISH_COLORS.length],
          sz: 7 + (i % 4) * 2.2,
          phase: i * 1.1,
        };
      });
    // Always show 2 sanctuary starter koi if player hasn't donated any yet
    if (!activeFish.length) {
      activeFish.push(
        { name: "Sanctuary Koi", x: 140, y: 80, vx: 32, vy: 5, col: "#ff8a5c", sz: 10, phase: 0 },
        { name: "Moonwake Minnow", x: 340, y: 120, vx: -28, vy: -4, col: "#7fe8d0", sz: 8, phase: 2 },
      );
    }
    const bubbles = Array.from({ length: 16 }, (_, i) => ({ x: 30 + (i * 37) % (W - 60), y: H - 20 - (i * 29) % (H - 40), r: 1.5 + (i % 3) }));
    let last = performance.now();

    const frame = (now) => {
      if (!canvas.isConnected) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, biome.top);
      grad.addColorStop(1, biome.bot);
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);

      // Sunbeams
      g.fillStyle = biome.ray;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        const x = 60 + i * 130 + Math.sin(now / 1800 + i) * 12;
        g.moveTo(x, 0); g.lineTo(x + 36, 0); g.lineTo(x + 88, H); g.lineTo(x + 18, H);
        g.closePath(); g.fill();
      }

      // Sand floor
      g.fillStyle = biome.sand;
      g.fillRect(0, H - 22, W, 22);

      // Tank Decor
      if (st.decor.kelp) {
        g.strokeStyle = "#3fa86a"; g.lineWidth = 4;
        for (const kx of [36, 54, W - 46, W - 64]) {
          g.beginPath(); g.moveTo(kx, H - 18);
          g.quadraticCurveTo(kx + Math.sin(now / 500 + kx) * 10, H - 55, kx + Math.sin(now / 420 + kx) * 14, H - 92);
          g.stroke();
        }
      }
      if (st.decor.coral_arch) {
        g.strokeStyle = "#ff7a9a"; g.lineWidth = 10;
        g.beginPath(); g.arc(W * 0.5, H - 16, 42, Math.PI, 0); g.stroke();
      }
      if (st.decor.wreck) {
        g.fillStyle = "#b58a3a"; g.fillRect(W * 0.72, H - 44, 28, 26);
        g.fillStyle = "#49d0ff"; g.fillRect(W * 0.72 + 8, H - 38, 12, 10);
      }
      if (st.decor.lantern) {
        g.fillStyle = "#ffd27a"; g.beginPath(); g.arc(110, H - 36, 9, 0, 7); g.fill();
        g.fillStyle = "rgba(255,210,120,.25)"; g.beginPath(); g.arc(110, H - 36, 22, 0, 7); g.fill();
      }
      if (st.decor.clam) {
        g.fillStyle = "#e8c8d8"; g.beginPath(); g.ellipse(W * 0.32, H - 20, 16, 9, 0, 0, 7); g.fill();
        g.fillStyle = "#fff"; g.beginPath(); g.arc(W * 0.32, H - 22, 4, 0, 7); g.fill();
      }
      if (st.decor.vent) {
        g.fillStyle = "#3a3844"; g.beginPath(); g.moveTo(W * 0.86 - 14, H - 18); g.lineTo(W * 0.86, H - 42); g.lineTo(W * 0.86 + 14, H - 18); g.fill();
        g.fillStyle = "#7fe8d0"; g.beginPath(); g.arc(W * 0.86, H - 46 - ((now / 40) % 45), 3, 0, 7); g.fill();
      }

      // Food pellets
      for (const p of foodRef.list) {
        p.y += 28 * dt;
        g.fillStyle = "#ffe28a";
        g.beginPath(); g.arc(p.x, p.y, 3, 0, 7); g.fill();
      }
      foodRef.list = foodRef.list.filter((p) => p.y < H - 22);

      // Fish
      for (const f of activeFish) {
        const food = foodRef.list[0];
        if (food) {
          const dx = food.x - f.x, dy = food.y - f.y, d = Math.hypot(dx, dy) || 1;
          if (d < 14) { foodRef.list.shift(); }
          else { f.vx += (dx / d) * 80 * dt; f.vy += (dy / d) * 60 * dt; }
        }
        f.vx = Math.max(-75, Math.min(75, f.vx));
        f.vy = Math.max(-30, Math.min(30, f.vy));
        f.x += f.vx * dt; f.y += f.vy * dt + Math.sin(now / 420 + f.phase) * 0.15;
        if (f.x < 24 || f.x > W - 24) { f.vx *= -1; f.x = Math.max(24, Math.min(W - 24, f.x)); }
        if (f.y < 24 || f.y > H - 36) { f.vy *= -1; f.y = Math.max(24, Math.min(H - 36, f.y)); }
        const dir = f.vx >= 0 ? 1 : -1;
        g.save();
        g.translate(f.x, f.y);
        g.scale(dir, 1);
        g.fillStyle = f.col;
        g.beginPath(); g.ellipse(0, 0, f.sz * 1.35, f.sz * 0.72, 0, 0, 7); g.fill();
        const wag = Math.sin(now / 110 + f.phase) * 3;
        g.beginPath(); g.moveTo(-f.sz * 1.1, 0); g.lineTo(-f.sz * 1.9, -f.sz * 0.65 + wag); g.lineTo(-f.sz * 1.9, f.sz * 0.65 + wag); g.closePath(); g.fill();
        g.fillStyle = "#111"; g.beginPath(); g.arc(f.sz * 0.7, -f.sz * 0.18, 1.8, 0, 7); g.fill();
        g.restore();
      }

      // Bubbles
      g.fillStyle = "rgba(220,245,255,.45)";
      for (const b of bubbles) {
        b.y -= (18 + b.r * 6) * dt;
        if (b.y < 8) b.y = H - 22;
        g.beginPath(); g.arc(b.x + Math.sin(now / 300 + b.y * 0.05) * 3, b.y, b.r, 0, 7); g.fill();
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  function open(nextTab = tab) {
    tab = nextTab;
    cancelAnimationFrame(raf);
    const all = catalog();
    const caughtCount = all.filter((x) => x.caught).length;
    const dispCount = Object.keys(st.display).length;
    const canFeed = st.feedDay !== today();
    const canTicket = st.ticketDay !== today();
    const ticketPay = Math.round(15 + appeal() * 1.4);
    const tabs = [
      ["tank", `Live Tank (${dispCount})`],
      ["gallery", `Species (${caughtCount}/${all.length})`],
      ["shop", "Decor & Biomes"],
      ["quiz", "Specimen Quiz"],
    ].map(([k, l]) => `<button type="button" class="chip${tab === k ? " on" : ""}" data-tab="${k}">${l}</button>`).join("");

    let body = "";
    const foodRef = { list: [] };

    if (tab === "tank") {
      const undonated = all.filter((x) => x.caught && !st.display[x.key]);
      body = `
        <canvas id="aq-canvas" width="560" height="200" style="width:100%;height:auto;border-radius:10px;border:1px solid rgba(255,255,255,.15);cursor:pointer;display:block;margin-bottom:10px" title="Click the water to drop food!"></canvas>
        <p class="muted">Tank Appeal: <strong>${appeal()}</strong> · Displayed Species: <strong>${dispCount}</strong> · Click the water to feed your fish!</p>
        <div class="px-row" style="margin-bottom:10px">
          <button type="button" class="btn btn-accent" id="aq-feed" ${canFeed ? "" : "disabled"}>${canFeed ? "Daily Tank Feeding (+25 mon)" : "Fed Today ✓"}</button>
          <button type="button" class="btn btn-accent" id="aq-ticket" ${canTicket ? "" : "disabled"}>${canTicket ? `Collect Ticket Box (+${ticketPay} mon)` : "Tickets Collected ✓"}</button>
          ${undonated.length ? `<button type="button" class="btn" id="aq-donate-all">Donate All Caught (${undonated.length})</button>` : ""}
        </div>`;
    } else if (tab === "gallery") {
      body = `
        <p class="muted">Caught <strong>${caughtCount}</strong> of <strong>${all.length}</strong> aquatic &amp; sky species across all realms. Donate caught fish to watch them swim in your Live Tank!</p>
        <div class="se-mkt">${all.map((f) => {
          const inTank = !!st.display[f.key];
          return `<div class="se-good${inTank ? " cheap" : ""}"><span><strong>${f.caught ? esc(f.name) : "???"}</strong><small>${esc(f.src)}${f.caught ? ` · Worth ${f.worth} mon` : " · Not caught yet"}</small></span>${inTank ? `<button class="btn btn-sm" type="button" data-rem="${esc(f.key)}">In Tank ✓</button>` : f.caught ? `<button class="btn btn-sm btn-accent" type="button" data-add="${esc(f.key)}">Add to Tank</button>` : `<span class="pill">Uncaught</span>`}</div>`;
        }).join("")}</div>`;
    } else if (tab === "shop") {
      body = `
        <h4>Tank Biomes</h4>
        <div class="se-mkt" style="margin-bottom:12px">${BIOMES.map((b) => {
          const own = !!st.biomes[b.id], on = st.biome === b.id;
          return `<div class="se-good${on ? " cheap" : ""}"><span><strong>${esc(b.name)}</strong><small>${b.id === "fresh" ? "Included" : "+12 Tank Appeal when active"}</small></span>${own ? `<button class="btn btn-sm${on ? "" : " btn-accent"}" type="button" data-bio="${b.id}">${on ? "Active ✓" : "Use"}</button>` : `<button class="btn btn-sm btn-accent" type="button" data-buybio="${b.id}" ${s.mon >= b.cost ? "" : "disabled"}>${b.cost} mon</button>`}</div>`;
        }).join("")}</div>
        <h4>Tank Decorations</h4>
        <div class="se-mkt">${DECOR.map((d) => {
          const own = !!st.decor[d.id];
          return `<div class="se-good${own ? " cheap" : ""}"><span><strong>${esc(d.name)}</strong><small>${esc(d.desc)} (+${d.appeal} Appeal)</small></span>${own ? `<span class="pill pill-done">Placed ✓</span>` : `<button class="btn btn-sm btn-accent" type="button" data-buydec="${d.id}" ${s.mon >= d.cost ? "" : "disabled"}>${d.cost} mon</button>`}</div>`;
        }).join("")}</div>`;
    } else {
      body = !round
        ? `<p class="muted">Test your aquatic knowledge across all 12 specimen clues! Quizzes solved: <strong>${st.trivia}</strong>.</p><button type="button" class="btn btn-accent" id="aq-go">Guess the Specimen (+45 mon)</button>`
        : `<div class="se-mkt" style="margin-bottom:12px"><div class="se-good"><span><strong>🐠 Tank Clue (${esc(round.pick.zone)})</strong><small>${esc(round.pick.clue)}</small></span></div></div><div class="px-row">${round.opts.map((sp) => `<button type="button" class="btn btn-accent" data-aq="${esc(sp.name)}" ${round.done ? "disabled" : ""}>${esc(sp.name)}</button>`).join("")}</div>${round.done ? `<div style="margin-top:10px"><button type="button" class="btn btn-accent" id="aq-go">Next Specimen</button></div>` : ""}`;
    }

    panel("Moonwake Sanctuary Aquarium", `<div class="chips" style="margin-bottom:10px">${tabs}</div>${body}`, (e) => {
      e.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => open(b.dataset.tab)));

      const canvas = e.querySelector("#aq-canvas");
      if (canvas) {
        startTankCanvas(canvas, foodRef);
        canvas.onclick = (ev) => {
          const r = canvas.getBoundingClientRect();
          foodRef.list.push({ x: (ev.clientX - r.left) * (canvas.width / r.width), y: (ev.clientY - r.top) * (canvas.height / r.height) });
          ping("blip");
        };
      }

      e.querySelector("#aq-feed")?.addEventListener("click", () => {
        if (st.feedDay === today()) return;
        st.feedDay = today(); s.mon += 25; addRenown?.(15);
        for (let i = 0; i < 6; i++) foodRef.list.push({ x: 80 + i * 75, y: 20 + (i % 2) * 14 });
        ping("done"); toast("The tank swirls for feeding time! +25 mon & +15 Renown.");
        save(); hud(); open("tank");
      });

      e.querySelector("#aq-ticket")?.addEventListener("click", () => {
        if (st.ticketDay === today()) return;
        st.ticketDay = today(); s.mon += ticketPay; addRenown?.(Math.round(appeal() / 4));
        ping("done"); toast(`Collected ${ticketPay} mon from today's Aquarium visitors!`);
        save(); hud(); open("tank");
      });

      e.querySelector("#aq-donate-all")?.addEventListener("click", () => {
        let added = 0;
        for (const f of all) if (f.caught && !st.display[f.key]) { st.display[f.key] = 1; added++; }
        if (!added) return;
        ping("done"); toast(`Added ${added} species to the Live Tank!`);
        save(); open("tank");
      });

      e.querySelectorAll("[data-add]").forEach((b) => (b.onclick = () => { st.display[b.dataset.add] = 1; ping("done"); save(); open("gallery"); }));
      e.querySelectorAll("[data-rem]").forEach((b) => (b.onclick = () => { delete st.display[b.dataset.rem]; ping("blip"); save(); open("gallery"); }));
      e.querySelectorAll("[data-bio]").forEach((b) => (b.onclick = () => { st.biome = b.dataset.bio; ping("choice"); save(); open("shop"); }));
      e.querySelectorAll("[data-buybio]").forEach((b) => (b.onclick = () => { const bi = BIOMES.find((x) => x.id === b.dataset.buybio); if (!bi || st.biomes[bi.id] || s.mon < bi.cost) return; s.mon -= bi.cost; st.biomes[bi.id] = 1; st.biome = bi.id; ping("done"); save(); hud(); open("shop"); }));
      e.querySelectorAll("[data-buydec]").forEach((b) => (b.onclick = () => { const dc = DECOR.find((x) => x.id === b.dataset.buydec); if (!dc || st.decor[dc.id] || s.mon < dc.cost) return; s.mon -= dc.cost; st.decor[dc.id] = 1; ping("done"); toast(`Placed ${dc.name} in the tank!`); save(); hud(); open("shop"); }));

      e.querySelector("#aq-go")?.addEventListener("click", startQuiz);
      e.querySelectorAll("[data-aq]").forEach((btn) => {
        btn.onclick = () => {
          if (!round || round.done) return;
          round.done = true;
          if (btn.dataset.aq === round.pick.name) {
            st.trivia++; s.mon += 45; addRenown?.(20); ping("done");
            toast(`Correct — ${round.pick.name}! +45 mon & +20 Renown.`);
            save(); hud();
          } else { ping("close"); toast(`Not quite! That was the ${round.pick.name}.`); }
          open("quiz");
        };
      });
    });
  }

  return { open };
}
