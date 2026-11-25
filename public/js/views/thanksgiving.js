// Harvest & Thanksgiving Festival (#thanksgiving): Grand Feast Kitchen, Leaf-Trot Arcade, Gratitude Tree, and Festival Rewards.
import { $, $$, esc, toast } from "../util.js";
import { setCrumbs } from "../main.js";
import { kvGet, kvSet } from "../store.js";

const STORE_KEY = "kitsune.thanksgiving.v1";

const DISHES = [
  ["squash", "Roasted Acorn Squash", "🎃", 15, 25, "Brushed with maple and cracked pepper."],
  ["cider", "Spiced Apple Cider", "🍎", 12, 20, "Simmered with cinnamon bark and star anise."],
  ["cranberry", "Cranberry Lantern Tart", "🍒", 22, 40, "Sharp, ruby-bright, and glazed in honey."],
  ["cornbread", "Golden Cornbread", "🌽", 18, 32, "Warm from the iron skillet with salted butter."],
  ["stuffing", "Chestnut Herb Stuffing", "🌰", 28, 55, "Toasted sourdough, sage, and roasted chestnuts."],
  ["yampie", "Maple Yam Pie", "🥧", 35, 70, "Velvet sweet potato under toasted meringue."],
  ["broth", "Autumn Root Broth", "🥣", 20, 36, "Slow-simmered parsnips, thyme, and wild mushrooms."],
  ["turnip", "Honey-Glazed Turnips", "🍯", 24, 45, "Caramelized in Hollow Pine wildflower honey."],
  ["souffle", "Pumpkin Soufflé", "🧁", 45, 95, "Rises three inches above the ramekin."],
  ["banquet", "Nine-Lantern Grand Banquet", "🕯️", 80, 200, "A table set for every resident in the country."],
];

const REWARDS = [
  ["harvestcrown", "hat", "Maple Leaf Crown", "🍁", 40, "A woven crown of crimson and gold maple leaves."],
  ["pilgrimbow", "hat", "Harvest Ribbon", "🎀", 60, "A velvet autumn ribbon tied neatly behind the ears."],
  ["acornberet", "hat", "Acorn Cap Beret", "🌰", 90, "Stitched from felted wool in Brask."],
  ["cornucopia", "furn", "Golden Cornucopia", "🧺", 75, "Overflowing with squash, apples, and wheat."],
  ["harvestwreath", "furn", "Autumn Door Wreath", "🍂", 55, "Dried berries, pinecones, and cinnamon sticks."],
  ["pumpkintable", "furn", "Lantern Feast Table", "🕯️", 120, "A long cedar table set for Thanksgiving."],
];

function loadState() {
  try {
    return {
      tokens: 45,
      feastPts: 0,
      cooked: {},
      owned: {},
      leaves: [
        { text: "Warm tea on a rainy afternoon", at: Date.now() - 86400000 },
        { text: "All nine lanterns burning bright", at: Date.now() - 3600000 },
      ],
      bestTrot: 0,
      ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}"),
    };
  } catch {
    return { tokens: 45, feastPts: 0, cooked: {}, owned: {}, leaves: [], bestTrot: 0 };
  }
}

function saveState(st) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch {}
}

export async function render(view) {
  setCrumbs([["Thanksgiving Festival", "thanksgiving"]]);
  const st = loadState();
  let tab = "feast";
  let raf = 0;

  const grantWorld = async (kind, id, monBonus = 0) => {
    try {
      const w = (await kvGet("world", null)) || {};
      if (kind === "hat") {
        w.hats ||= [];
        if (!w.hats.includes(id)) w.hats.push(id);
        w.hat = id;
      } else if (kind === "furn") {
        w.furn ||= {};
        w.furn[id] = (w.furn[id] || 0) + 1;
      }
      if (monBonus) w.mon = (w.mon || 0) + monBonus;
      await kvSet("world", w);
    } catch {}
  };

  const paint = () => {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    const cookedCount = Object.keys(st.cooked).length;

    view.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow" style="color:#ff9a3a">Seasonal Event</p>
          <h1 class="h1">Thanksgiving Harvest Festival</h1>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <span class="pill" style="border-color:#ff9a3a">🍂 Harvest Tokens: <strong id="tg-tok">${st.tokens}</strong></span>
          <span class="pill">🥧 Feast Score: <strong>${st.feastPts}</strong></span>
          <a class="btn" href="#world">Kitsune World</a>
        </div>
      </div>

      <div class="chips" style="margin-bottom:14px">
        <button type="button" class="chip${tab === "feast" ? " on" : ""}" data-tab="feast">Grand Feast Kitchen (${cookedCount}/${DISHES.length})</button>
        <button type="button" class="chip${tab === "trot" ? " on" : ""}" data-tab="trot">Turkey &amp; Leaf Trot (Best: ${st.bestTrot})</button>
        <button type="button" class="chip${tab === "tree" ? " on" : ""}" data-tab="tree">Gratitude Tree (${st.leaves.length})</button>
        <button type="button" class="chip${tab === "shop" ? " on" : ""}" data-tab="shop">Festival Rewards (${Object.keys(st.owned).length}/${REWARDS.length})</button>
      </div>

      <div id="tg-body" class="settings"></div>
    `;

    $$("[data-tab]", view).forEach((b) => {
      b.onclick = () => { tab = b.dataset.tab; paint(); };
    });

    const body = $("#tg-body", view);

    if (tab === "feast") {
      body.innerHTML = `
        <div class="panel">
          <h3 class="h3">The Grand Harvest Table</h3>
          <p class="muted">Spend Harvest Tokens to prepare festive dishes. Every dish adds Feast Score and sends bonus Mon to your Kitsune World purse!</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-top:12px">
            ${DISHES.map(([id, name, icon, cost, pts, desc]) => {
              const count = st.cooked[id] || 0;
              return `<article style="padding:12px;border-radius:12px;border:1px solid ${count ? "#ff9a3a" : "rgba(255,255,255,.15)"};display:flex;flex-direction:column;gap:6px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:28px">${icon}</span>
                  <div>
                    <strong>${esc(name)}</strong>
                    <small class="muted" style="display:block">Prepared ${count}× · +${pts} Feast Score</small>
                  </div>
                </div>
                <p class="muted" style="margin:0;font-size:13px">${esc(desc)}</p>
                <button type="button" class="btn btn-sm btn-accent" data-cook="${id}" ${st.tokens < cost ? "disabled" : ""} style="margin-top:auto">Cook (${cost} 🍂)</button>
              </article>`;
            }).join("")}
          </div>
        </div>
      `;
      $$("[data-cook]", body).forEach((b) => {
        b.onclick = async () => {
          const d = DISHES.find((x) => x[0] === b.dataset.cook);
          if (!d || st.tokens < d[3]) return;
          st.tokens -= d[3];
          st.feastPts += d[4];
          st.cooked[d[0]] = (st.cooked[d[0]] || 0) + 1;
          saveState(st);
          await grantWorld(null, null, Math.round(d[4] / 2));
          toast(`Served ${d[1]}! +${d[4]} Feast Score & +${Math.round(d[4] / 2)} World Mon`);
          paint();
        };
      });
    } else if (tab === "trot") {
      body.innerHTML = `
        <div class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
            <div>
              <h3 class="h3" style="margin:0">Turkey &amp; Leaf Trot</h3>
              <p class="muted" style="margin:4px 0 0">Move with <strong>A/D</strong> or <strong>Left/Right</strong> (or drag/tap). Catch 🥧 Pies &amp; 🌰 Acorns (+Tokens), dodge 🦃 Grumpy Turkeys!</p>
            </div>
            <button type="button" class="btn btn-accent" id="tg-start">Start 30s Run</button>
          </div>
          <canvas id="tg-canvas" width="760" height="360" style="width:100%;height:auto;border-radius:12px;background:#1c120d;display:block;touch-action:none"></canvas>
          <p class="muted" id="tg-hud" style="margin-top:8px">Score: 0 · Time: 30s</p>
        </div>
      `;
      const canvas = $("#tg-canvas", body);
      const g = canvas.getContext("2d");
      const hud = $("#tg-hud", body);
      let fx = 380, score = 0, timeLeft = 30, active = false, items = [], spawnT = 0, keys = new Set();

      const drawIdle = () => {
        g.fillStyle = "#1c120d";
        g.fillRect(0, 0, 760, 360);
        g.fillStyle = "#ffd27a";
        g.font = "700 22px system-ui";
        g.textAlign = "center";
        g.fillText("Press Start 30s Run to begin!", 380, 180);
      };
      drawIdle();

      const onKey = (e) => {
        if (!active) return;
        const k = e.key.toLowerCase();
        if (k === "a" || k === "arrowleft" || k === "d" || k === "arrowright") {
          e.preventDefault();
          if (e.type === "keydown") keys.add(k);
          else keys.delete(k);
        }
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("keyup", onKey);

      canvas.onpointermove = (e) => {
        if (!active) return;
        const r = canvas.getBoundingClientRect();
        fx = Math.max(28, Math.min(732, ((e.clientX - r.left) / r.width) * 760));
      };

      let last = performance.now();
      const loop = (now) => {
        if (!active || !canvas.isConnected) {
          window.removeEventListener("keydown", onKey);
          window.removeEventListener("keyup", onKey);
          return;
        }
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        timeLeft -= dt;

        if (keys.has("a") || keys.has("arrowleft")) fx -= 390 * dt;
        if (keys.has("d") || keys.has("arrowright")) fx += 390 * dt;
        fx = Math.max(28, Math.min(732, fx));

        if ((spawnT -= dt) <= 0) {
          spawnT = 0.36;
          const r = Math.random();
          const kind = r < 0.28 ? "turkey" : r < 0.5 ? "pie" : "acorn";
          items.push({ x: 30 + Math.random() * 700, y: -20, vy: 150 + Math.random() * 140, kind });
        }

        g.fillStyle = "#1c120d";
        g.fillRect(0, 0, 760, 360);
        g.fillStyle = "#2c1c14";
        g.fillRect(0, 318, 760, 42);

        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.vy * dt;
          if (Math.hypot(it.x - fx, it.y - 300) < 30) {
            if (it.kind === "turkey") score = Math.max(0, score - 8);
            else score += it.kind === "pie" ? 10 : 4;
            items.splice(i, 1);
            continue;
          }
          if (it.y > 370) { items.splice(i, 1); continue; }
          g.font = "28px system-ui";
          g.textAlign = "center";
          g.fillText(it.kind === "turkey" ? "🦃" : it.kind === "pie" ? "🥧" : "🌰", it.x, it.y);
        }

        // Fox basket
        g.fillStyle = "#e0782c";
        g.beginPath();
        g.arc(fx, 302, 20, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#fff";
        g.font = "20px system-ui";
        g.textAlign = "center";
        g.fillText("🦊", fx, 309);

        hud.textContent = `Score: ${score} · Time: ${Math.max(0, Math.ceil(timeLeft))}s`;
        if (timeLeft <= 0) {
          active = false;
          const earned = Math.max(8, Math.round(score * 0.6));
          st.tokens += earned;
          st.bestTrot = Math.max(st.bestTrot, score);
          saveState(st);
          toast(`Run complete! Score ${score} -> +${earned} Harvest Tokens!`);
          paint();
          return;
        }
        raf = requestAnimationFrame(loop);
      };

      $("#tg-start", body).onclick = () => {
        if (active) return;
        active = true; score = 0; timeLeft = 30; items = []; last = performance.now();
        raf = requestAnimationFrame(loop);
      };
    } else if (tab === "tree") {
      body.innerHTML = `
        <div class="panel">
          <h3 class="h3">The Gratitude Tree</h3>
          <p class="muted">Hang a golden leaf on the Hollow Pine Gratitude Tree. Each note grants +5 Harvest Tokens (up to 50 saved notes).</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
            <input class="field" id="tg-leaf" type="text" maxlength="120" placeholder="I'm grateful for…" style="flex:1;min-width:220px">
            <button type="button" class="btn btn-accent" id="tg-hang">Hang Leaf (+5 🍂)</button>
          </div>
          <ul class="wd-list">${st.leaves.map((l, i) => `<li><i>🍁</i><span>${esc(l.text)}</span><button type="button" class="btn btn-sm" data-ldel="${i}">×</button></li>`).join("")}</ul>
        </div>
      `;
      $("#tg-hang", body).onclick = () => {
        const inp = $("#tg-leaf", body);
        const text = inp.value.trim();
        if (!text) return;
        st.leaves.unshift({ text, at: Date.now() });
        st.leaves = st.leaves.slice(0, 50);
        st.tokens += 5;
        saveState(st);
        toast("Leaf hung on the Gratitude Tree! +5 Harvest Tokens");
        paint();
      };
      $$("[data-ldel]", body).forEach((b) => {
        b.onclick = () => { st.leaves.splice(+b.dataset.ldel, 1); saveState(st); paint(); };
      });
    } else {
      body.innerHTML = `
        <div class="panel">
          <h3 class="h3">Thanksgiving World Rewards</h3>
          <p class="muted">Unlock exclusive Autumn Hats and House Furniture for Kitsune World using Harvest Tokens.</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-top:12px">
            ${REWARDS.map(([id, kind, name, icon, cost, desc]) => {
              const owned = !!st.owned[id];
              return `<article style="padding:12px;border-radius:12px;border:1px solid ${owned ? "#6cd98a" : "rgba(255,255,255,.15)"};display:flex;flex-direction:column;gap:6px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:28px">${icon}</span>
                  <div>
                    <strong>${esc(name)}</strong>
                    <small class="muted" style="display:block">${kind === "hat" ? "World Hat" : "House Furniture"}</small>
                  </div>
                </div>
                <p class="muted" style="margin:0;font-size:13px">${esc(desc)}</p>
                ${owned
                  ? `<span class="pill" style="align-self:flex-start;border-color:#6cd98a">Unlocked in World</span>`
                  : `<button type="button" class="btn btn-sm btn-accent" data-buy="${id}" ${st.tokens < cost ? "disabled" : ""} style="margin-top:auto">Unlock (${cost} 🍂)</button>`}
              </article>`;
            }).join("")}
          </div>
        </div>
      `;
      $$("[data-buy]", body).forEach((b) => {
        b.onclick = async () => {
          const r = REWARDS.find((x) => x[0] === b.dataset.buy);
          if (!r || st.owned[r[0]] || st.tokens < r[4]) return;
          st.tokens -= r[4];
          st.owned[r[0]] = 1;
          saveState(st);
          await grantWorld(r[1], r[0], 0);
          toast(`Unlocked ${r[2]} in Kitsune World!`);
          paint();
        };
      });
    }
  };

  paint();
  return () => { if (raf) cancelAnimationFrame(raf); };
}
