// Ambient wandering townsfolk, traveling item buyers & resident strolling behavior across Kitsune World.
import { esc, today } from "../util.js";
import { ITEMS, MEALS } from "./extras.js";

const BUYERS = [
  { id: "b_goro", name: "Goro", role: "Curio Peddler", region: "village", baseMul: 1.4, favMul: 2.0, favs: ["acorn", "mushroom", "berry", "honey", "pinecone", "herb"], style: { c: "#9c5a32", a: "#f5d98c", st: 2, sk: 2, h: "#2b1d14", e: "#1f1812", f: "apron" }, line: "Looking to lighten your pack? I pay double for woodland & town curios!" },
  { id: "b_sera", name: "Sera", role: "Silk & Spice Broker", region: "market", baseMul: 1.4, favMul: 2.2, favs: ["silk", "spice", "ink", "ticket", "coal", "skewer", "bento"], style: { c: "#683d8a", a: "#ffd27a", st: 3, sk: 1, h: "#1f1629", e: "#1a1421", f: "coat" }, line: "Night Market caravans always need silk, spice, ink, and train goods." },
  { id: "b_brine", name: "Capt. Brine", role: "Coastal Collector", region: "shore", baseMul: 1.4, favMul: 2.2, favs: ["shell", "kelp", "pearl", "driftwood", "reed", "lily", "page", "broth"], style: { c: "#2f6c85", a: "#e8f6ff", st: 1, sk: 2, h: "#3b4248", e: "#1b2429", f: "vest" }, line: "Tide treasures, pearls, and river finds — I'll buy the lot for fair mon!" },
  { id: "b_cog", name: "Master Cogsworth", role: "Brass Appraiser", region: "clock", baseMul: 1.4, favMul: 2.2, favs: ["gear", "spring", "iron", "gold", "quartz", "clockwork"], style: { c: "#b88a2e", a: "#d8e0e8", st: 4, sk: 1, h: "#4a4338", e: "#221f1a", f: "smart" }, line: "Gears, springs, ores, and quartz — every spare part keeps Brask ticking." },
  { id: "b_emerald", name: "Lady Emerald", role: "Oz Reliquarian", region: "oz", baseMul: 1.4, favMul: 2.2, favs: ["emerald", "poppy", "patch", "emeraldcake", "feast"], style: { c: "#2e8f62", a: "#fff0b3", st: 2, sk: 0, h: "#1c3829", e: "#14261c", f: "robe" }, line: "Emerald chips, poppies, and fine confections fetch royal prices with me." },
  { id: "b_koji", name: "Koji", role: "Caravan Chef", region: "capital", baseMul: 1.5, favMul: 2.5, favs: ["tea", "jam", "stew", "broth", "pie", "soup", "skewer", "cocoa", "bento", "emeraldcake", "feast", "clockwork"], style: { c: "#d14d3a", a: "#ffffff", st: 1, sk: 1, h: "#261b18", e: "#1a1412", f: "apron" }, line: "Hungry travelers pay top mon for home-cooked meals — and I'll buy any spare ingredients too!" },
];

const ALL_ITEMS = [
  ...ITEMS.map((q) => ({ id: q[0], name: q[1], color: q[2], val: Math.max(2, q[4] || 3) })),
  ...MEALS.map((q) => ({ id: q[0], name: q[1], color: q[2], val: Math.max(6, q[5] || 10) })),
];

const TRAVELERS = [
  { id: "w_taro", name: "Taro", role: "Lantern Sweeper", region: "village", style: { c: "#c96f44", a: "#f2dec0", st: 1, sk: 1, h: "#2d241e", e: "#1f1c18", f: "casual" }, lines: ["Keeping the cobblestones swept so nobody trips at dusk.", "Have you checked the Town Council projects lately?", "A clean lantern burns half a candle brighter."] },
  { id: "w_kiku", name: "Kiku", role: "Kite Maker", region: "market", style: { c: "#4d7ea8", a: "#f6e6b4", st: 3, sk: 0, h: "#1f2738", e: "#1c222e", f: "coat" }, lines: ["The Night Market breeze is just right for silk kites.", "I traded two spools of thread for a peach bun earlier.", "If a kite gets stuck on a roof, tell Ponzu it's art."] },
  { id: "w_sora", name: "Sora", role: "Cloud Counter", region: "peaks", style: { c: "#7f9bb3", a: "#eef5ff", st: 2, sk: 2, h: "#3a4556", e: "#202833", f: "scarf" }, lines: ["Fourteen cumulus, two cirrus, and one suspiciously fox-shaped.", "Up here the wind tells you tomorrow's weather first.", "Watch your step near the quarry rim."] },
  { id: "w_pip", name: "Pip", role: "Shell Collector", region: "shore", style: { c: "#e09f5a", a: "#bfe8f2", st: 0, sk: 1, h: "#4a3321", e: "#241d17", f: "vest" }, lines: ["The tidepool left three spiral shells and a very stubborn crab.", "If you hear the Saltwick Beacon hum, a ship's coming in.", "Every pebble here was once a mountain in no hurry."] },
  { id: "w_hana", name: "Hana", role: "Petal Harpist", region: "sakura", style: { c: "#d97a9c", a: "#fff0f4", st: 2, sk: 0, h: "#2b1d28", e: "#241620", f: "robe" }, lines: ["Cherry blossoms fall at five centimeters per second — ideal tempo.", "The Origami Studio smells like cedar and fresh ink.", "Listen closely and you can hear the wind chime in fifths."] },
  { id: "w_bramble", name: "Bramble", role: "Herb Forager", region: "bamboo", style: { c: "#4f8a5b", a: "#e3d6b4", st: 1, sk: 2, h: "#2e3d28", e: "#1c2418", f: "cloak" }, lines: ["Moonroot only opens after sunset, or when nobody's looking.", "The bamboo grove creaks like an old library floor.", "Brewing tea with spring water doubles the calm."] },
  { id: "w_mochi", name: "Mochi", role: "Express Runner", region: "station", style: { c: "#d45d4a", a: "#ffe8c2", st: 3, sk: 1, h: "#3b231d", e: "#241512", f: "cap" }, lines: ["Platform Zero leaves on time, even when time is running late.", "Lost luggage usually finds its way to Foxhold Post.", "Haru told me a story so good I forgot which stop was mine."] },
  { id: "w_ren", name: "Ren", role: "Gear Polisher", region: "clock", style: { c: "#b58b3c", a: "#d9e2ec", st: 2, sk: 1, h: "#332b20", e: "#1e1a14", f: "apron" }, lines: ["Brask runs three seconds slow, and we polish every tooth to keep it that way.", "Tibb says the pendulum sighs at midnight.", "Nothing beats the smell of warm brass oil."] },
  { id: "w_nori", name: "Nori", role: "Pier Angler", region: "lake", style: { c: "#3f6e8c", a: "#dce8f0", st: 0, sk: 2, h: "#212e38", e: "#141d24", f: "hat" }, lines: ["Carp are biting near the sunken steps today.", "If the Librarian surfaces, remind them I returned that atlas.", "Moonwake Lake stays calmest just before dawn."] },
  { id: "w_glint", name: "Glint", role: "Emerald Mason", region: "oz", style: { c: "#3ca374", a: "#fff4c7", st: 1, sk: 0, h: "#1f3b2c", e: "#14261c", f: "tunic" }, lines: ["Every emerald brick gets buffed with poppy oil twice a season.", "The Botanical Garden's looking brighter every morning.", "Don't tell Bungle, but the glasswork here is mostly quartz."] },
  { id: "w_yuzu", name: "Yuzu", role: "Festival Herald", region: "capital", style: { c: "#d99b26", a: "#7a2e3a", st: 2, sk: 1, h: "#2e1f1b", e: "#1f1411", f: "sash" }, lines: ["The Nine-Tail Monument draws visitors from all nine realms.", "Check the World Bulletin if you want to see how far you've come.", "A true traveler always keeps spare mon for tea."] },
  { id: "w_cora", name: "Cora", role: "Reef Diver", region: "coral", style: { c: "#e06d7a", a: "#b8f2e6", st: 3, sk: 1, h: "#3d222c", e: "#26141a", f: "vest" }, lines: ["Coral branches sing softly when the current shifts.", "I spotted a pearlescent ray gliding past the reef arch.", "Saltwater fixes almost any bad mood."] },
];

function pickWalkTarget(cx, cy, radiusPx, blocked, tries = 10) {
  for (let i = 0; i < tries; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (0.35 + Math.random() * 0.65) * radiusPx;
    const nx = cx + Math.cos(a) * r;
    const ny = cy + Math.sin(a) * r;
    if (!blocked(nx, ny)) return [nx, ny];
  }
  return [cx, cy];
}

function stepWalker(w, dt, s, blocked, busy, radiusPx, speed) {
  if (w.hx === undefined) {
    w.hx = w.x;
    w.hy = w.y;
    w.wait = 0.6 + Math.random() * 2.2;
    w.walkT = 0;
    w.moving = false;
  }
  const distPlayer = Math.hypot(w.x - s.x, w.y - s.y);
  if (busy() || distPlayer < 64) {
    w.moving = false;
    return;
  }
  if (w.tx === undefined || w.ty === undefined) {
    w.wait -= dt;
    w.moving = false;
    if (w.wait <= 0) {
      const [nx, ny] = pickWalkTarget(w.hx, w.hy, radiusPx, blocked);
      w.tx = nx;
      w.ty = ny;
    }
    return;
  }
  const dx = w.tx - w.x;
  const dy = w.ty - w.y;
  const d = Math.hypot(dx, dy);
  if (d < 5) {
    w.tx = undefined;
    w.ty = undefined;
    w.moving = false;
    w.wait = 1.6 + Math.random() * 3.2;
    return;
  }
  const step = Math.min(d, speed * dt);
  const nx = w.x + (dx / d) * step;
  const ny = w.y + (dy / d) * step;
  let moved = false;
  if (!blocked(nx, w.y)) { w.x = nx; moved = true; }
  if (!blocked(w.x, ny)) { w.y = ny; moved = true; }
  if (!moved) {
    w.tx = undefined;
    w.ty = undefined;
    w.moving = false;
    w.wait = 1.0 + Math.random() * 2.0;
    return;
  }
  w.moving = true;
  w.walkT += dt;
}

export function updateResidents(people, dt, s, blocked, T, busy) {
  for (const p of people) stepWalker(p, dt, s, blocked, busy, T * 2.4, 34);
}

export function createWanderers(o) {
  const { s, REGIONS, T, blocked, characterSvg, panel, say, closeTalk, ping, toast, save, hud, calm } = o;
  const st = (s.wanderers ||= {});
  st.day ||= "";
  st.tipped ||= {};

  const spawnList = [
    ...TRAVELERS.map((t) => ({ ...t, buyer: false })),
    ...BUYERS.map((b) => ({ ...b, buyer: true })),
  ];

  const npcs = spawnList.map((t, i) => {
    const reg = REGIONS[t.region] || REGIONS.village || ["Foxhold", 60, 47];
    const hx = (reg[1] + ((i % 3) - 1) * 2 + 0.5) * T;
    const hy = (reg[2] + (Math.floor(i / 3) % 2 ? 2 : -2) + 0.5) * T;
    const [sx, sy] = blocked(hx, hy) ? pickWalkTarget(reg[1] * T, reg[2] * T, T * 5, blocked, 20) : [hx, hy];
    const svg = characterSvg(t.name, t.style, "calm");
    const img = new Image();
    img.src = "data:image/svg+xml," + encodeURIComponent(svg.replace('width="100%" height="100%"', 'width="300" height="420"'));
    return {
      ...t,
      n: [t.id, t.name, `${t.name} (${t.role})`],
      d: t.style,
      x: sx,
      y: sy,
      hx: sx,
      hy: sy,
      img,
      tw: i * 1.7,
      wait: 0.4 + (i % 4) * 0.6,
      walkT: 0,
      moving: false,
      line: 0,
    };
  });

  function update(dt, busy) {
    for (const w of npcs) stepWalker(w, dt, s, blocked, busy, T * 6.5, 44);
  }

  function draw(g, things, camX, camY, vw, vh, now) {
    for (const w of npcs) {
      if (w.x < camX - 60 || w.x > camX + vw + 60 || w.y < camY - 60 || w.y > camY + vh + 60) continue;
      things.push([w.y + 13, () => {
        const idleBob = calm() ? 0 : Math.sin(now / 620 + w.tw) * 1.1;
        const walkBob = w.moving && !calm() ? Math.abs(Math.sin(w.walkT * 9)) * 3.2 : 0;
        const b = idleBob - walkBob;
        g.fillStyle = "rgba(0,0,0,.22)";
        g.beginPath();
        g.ellipse(w.x, w.y + 14, 13, 4.5, 0, 0, 7);
        g.fill();
        if (w.img.complete && w.img.naturalWidth) {
          g.drawImage(w.img, w.x - 24, w.y - 52 + b, 48, 68);
        }
        if (w.buyer) {
          g.fillStyle = "#ffd27a";
          g.strokeStyle = "#1b1d33";
          g.lineWidth = 2;
          g.beginPath();
          g.arc(w.x + 16, w.y - 52 + b, 8, 0, 7);
          g.fill();
          g.stroke();
          g.font = "900 10px system-ui";
          g.textAlign = "center";
          g.fillStyle = "#1b1d33";
          g.fillText("$", w.x + 16, w.y - 48.5 + b);
        }
        if (Math.hypot(w.x - s.x, w.y - s.y) < 120) {
          g.font = "700 10px system-ui";
          g.textAlign = "center";
          const label = w.buyer ? `${w.name} · Buyer` : w.name;
          const tw = g.measureText(label).width + 10;
          g.fillStyle = "rgba(15,14,24,.82)";
          g.fillRect(w.x - tw / 2, w.y - 68 + b, tw, 14);
          g.fillStyle = w.buyer ? "#9effc6" : "#ffe8b3";
          g.fillText(label, w.x, w.y - 57 + b);
        }
      }]);
    }
  }

  function priceFor(b, itemId, baseVal) {
    const isFav = b.favs.includes(itemId);
    const mul = isFav ? b.favMul : b.baseMul;
    return { price: Math.max(3, Math.round(baseVal * mul)), isFav };
  }

  function sellPanel(b) {
    const x2 = (s.x2 ||= {});
    const bag = (x2.bag ||= {});
    const entries = Object.entries(bag)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const meta = ALL_ITEMS.find((it) => it.id === id) || { id, name: id.replace(/[_-]/g, " "), color: "#ffd27a", val: 4 };
        const { price, isFav } = priceFor(b, id, meta.val);
        return { id, name: meta.name, color: meta.color, qty, price, isFav };
      })
      .sort((a, z) => (z.isFav - a.isFav) || (z.price - a.price));

    const favNames = b.favs
      .map((id) => ALL_ITEMS.find((it) => it.id === id)?.name || id)
      .slice(0, 6)
      .join(", ");

    const rows = entries.length
      ? entries.map((it) => `
          <div class="se-good">
            <span>
              <strong style="color:${it.color}">${esc(it.name)}</strong> ×${it.qty}
              ${it.isFav ? `<em>★ ${b.favMul}×</em>` : ""}
              <small>${it.price} mon each</small>
            </span>
            <div style="display:flex;gap:6px">
              <button type="button" class="btn btn-sm" data-sell="${esc(it.id)}:1">Sell 1 (+${it.price})</button>
              ${it.qty > 1 ? `<button type="button" class="btn btn-sm btn-accent" data-sell="${esc(it.id)}:${it.qty}">All (+${it.price * it.qty})</button>` : ""}
            </div>
          </div>`).join("")
      : `<p class="muted">Your bag is empty! Forage items, mine ore, or cook meals to sell here.</p>`;

    panel(`${b.name} · ${b.role}`, `
      <p class="muted">"${esc(b.line)}"</p>
      <p style="font-size:12px;margin-bottom:8px"><strong>Specialty (${b.favMul}×):</strong> ${esc(favNames)} · <strong>Other items:</strong> ${b.baseMul}×</p>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      e.querySelectorAll("[data-sell]").forEach((btn) => {
        btn.onclick = () => {
          const [id, rawCount] = btn.dataset.sell.split(":");
          const count = Math.min(bag[id] || 0, Number(rawCount) || 1);
          if (count <= 0) return;
          const meta = ALL_ITEMS.find((it) => it.id === id) || { name: id, val: 4 };
          const { price } = priceFor(b, id, meta.val);
          const total = price * count;
          bag[id] -= count;
          if (bag[id] <= 0) delete bag[id];
          s.mon += total;
          x2.t ||= {};
          x2.t.sell = (x2.t.sell || 0) + count;
          ping("done");
          toast(`Sold ${count}× ${meta.name} to ${b.name} for +${total} mon!`);
          save(); hud(); sellPanel(b);
        };
      });
    });
  }

  function chat(w) {
    if (w.buyer) return sellPanel(w);
    const d = today();
    if (st.day !== d) {
      st.day = d;
      st.tipped = {};
    }
    const line = w.lines[w.line % w.lines.length];
    w.line++;
    const canTip = !st.tipped[w.id];
    const btns = canTip
      ? [["Accept pocket charm (+5 mon)", () => {
          st.tipped[w.id] = 1;
          s.mon += 5;
          ping("done");
          toast(`${w.name} shares a lucky 5 mon coin!`);
          save(); hud(); closeTalk();
        }], ["Goodbye", closeTalk]]
      : [["Goodbye", closeTalk]];
    say({ n: [w.id, w.name, `${w.name} · ${w.role}`], d: w.style }, line, btns);
  }

  function target() {
    let best = null;
    let bestD = 54;
    for (const w of npcs) {
      const d = Math.hypot(w.x - s.x, w.y - s.y);
      if (d < bestD) {
        bestD = d;
        best = { label: w.buyer ? `Sell items to ${w.name}` : `Chat with ${w.name}`, go: () => chat(w) };
      }
    }
    return best;
  }

  return { update, draw, target, list: npcs };
}
