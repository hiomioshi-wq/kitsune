// Starlight Observatory: Interactive Canvas Night Sky, Kitsune Constellations, and Custom Star-Map Builder.
import { $, $$, esc, toast } from "../util.js";
import { setCrumbs } from "../main.js";

const STORE_KEY = "kitsune.constellations.v1";
const FORTUNES = [
  "A lantern lit in the dark always finds a second traveller.",
  "Your next chapter holds a quiet surprise.",
  "Follow the paper trail — something forgotten is waiting.",
  "Even a small bell can wake a sleeping valley.",
  "Tonight favours patient readers and late-night walkers.",
  "A new friend is closer than the next crossroads.",
];
const PRESETS = [
  {
    id: "fox",
    name: "The Nine-Tailed Fox",
    lore: "Nine stars curving across the northern ridge, said to guide couriers home.",
    stars: [[0.22, 0.35], [0.28, 0.28], [0.35, 0.32], [0.40, 0.42], [0.48, 0.38], [0.54, 0.28], [0.58, 0.20], [0.50, 0.22], [0.44, 0.26]],
    links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[4,7],[7,8],[8,2]],
  },
  {
    id: "lantern",
    name: "The Lantern Courier",
    lore: "A hanging diamond above Hollow Pine that never goes out in winter.",
    stars: [[0.65, 0.22], [0.72, 0.30], [0.65, 0.40], [0.58, 0.30], [0.65, 0.52]],
    links: [[0,1],[1,2],[2,3],[3,0],[2,4]],
  },
  {
    id: "train",
    name: "The Sleeper Train",
    lore: "Seven steady lights crossing the southern horizon at midnight.",
    stars: [[0.18, 0.68], [0.28, 0.66], [0.38, 0.65], [0.48, 0.64], [0.58, 0.63], [0.68, 0.62], [0.78, 0.60]],
    links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]],
  },
  {
    id: "clock",
    name: "The Great Clock",
    lore: "A ring of six stars above Brask, ticking three seconds behind the world.",
    stars: [[0.78, 0.28], [0.85, 0.33], [0.85, 0.42], [0.78, 0.47], [0.71, 0.42], [0.71, 0.33], [0.78, 0.37]],
    links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[6,0],[6,2]],
  },
];

function loadSky() {
  try {
    return { custom: [], wishes: [], ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return { custom: [], wishes: [] };
  }
}
function saveSky(st) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch {}
}

export async function render(view) {
  setCrumbs([["Starlight Observatory", "constellations"]]);
  const st = loadSky();
  let active = PRESETS[0];
  let draftStars = [];
  let draftMode = false;
  let raf = 0;

  const bgStars = Array.from({ length: 140 }, (_, i) => ({
    x: ((i * 73 + 19) % 1000) / 1000,
    y: ((i * 137 + 41) % 1000) / 1000,
    r: 0.7 + (i % 4) * 0.45,
    p: i * 0.7,
  }));
  const meteors = [];

  view.innerHTML = `
    <div class="page-head">
      <div><p class="eyebrow">Night sky</p><h1 class="h1">Starlight Observatory</h1></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn" href="#sanctuary">Reading Sanctuary</a>
        <a class="btn" href="#world">Kitsune World</a>
      </div>
    </div>
    <div class="settings">
      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div class="chips" id="cs-tabs">
            ${PRESETS.map((p) => `<button type="button" class="chip${p.id === active.id ? " on" : ""}" data-pre="${p.id}">${esc(p.name)}</button>`).join("")}
          </div>
          <div style="display:flex;gap:8px">
            <button type="button" class="btn btn-sm" id="cs-meteor">Shooting star</button>
            <button type="button" class="btn btn-sm btn-accent" id="cs-build">Draw your own</button>
          </div>
        </div>
        <canvas id="cs-sky" width="900" height="440" style="width:100%;height:auto;border-radius:12px;background:#070a18;display:block;cursor:crosshair"></canvas>
        <p class="muted" id="cs-lore" style="margin-top:10px"></p>
        <div id="cs-builder" hidden style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <input class="field" id="cs-name" type="text" maxlength="40" placeholder="Name your constellation…" style="flex:1;min-width:200px">
          <button type="button" class="btn btn-accent" id="cs-save">Save constellation</button>
          <button type="button" class="btn" id="cs-clear">Clear stars</button>
        </div>
      </div>

      <div class="panel">
        <h3 class="h3">Wishing Well &amp; Daily Fortune</h3>
        <p class="muted">Fortune: <strong>${esc(FORTUNES[Math.floor(Date.now() / 86_400_000) % FORTUNES.length])}</strong></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
          <input class="field" id="cs-wish" type="text" maxlength="120" placeholder="Send a wish into the night sky…" style="flex:1;min-width:220px">
          <button type="button" class="btn btn-accent" id="cs-send-wish">Make a wish</button>
        </div>
        <ul id="cs-wishes" class="wd-list"></ul>
      </div>
    </div>
  `;

  const canvas = $("#cs-sky", view);
  const g = canvas.getContext("2d");

  const updateLore = () => {
    const el = $("#cs-lore", view);
    if (!el) return;
    el.textContent = draftMode
      ? `Click anywhere on the sky to place stars (${draftStars.length} placed).`
      : `${active.name}: ${active.lore}`;
  };
  updateLore();

  const paintWishes = () => {
    const ul = $("#cs-wishes", view);
    if (!ul) return;
    ul.innerHTML = st.wishes.length
      ? st.wishes.map((w, i) => `<li><span>${esc(w.text)}</span><button type="button" class="btn btn-sm" data-wdel="${i}">×</button></li>`).join("")
      : `<li class="muted">No wishes cast yet.</li>`;
    $$("[data-wdel]", ul).forEach((b) => {
      b.onclick = () => {
        st.wishes.splice(+b.dataset.wdel, 1);
        saveSky(st);
        paintWishes();
      };
    });
  };
  paintWishes();

  const spawnMeteor = () => {
    meteors.push({
      x: Math.random() * canvas.width * 0.7,
      y: Math.random() * canvas.height * 0.35,
      vx: 380 + Math.random() * 180,
      vy: 140 + Math.random() * 90,
      life: 1,
    });
  };

  let last = performance.now();
  const draw = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const W = canvas.width;
    const H = canvas.height;

    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#050714");
    grad.addColorStop(1, "#101836");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    for (const s of bgStars) {
      const tw = 0.45 + 0.55 * Math.sin(now / 700 + s.p);
      g.fillStyle = `rgba(235, 242, 255, ${tw.toFixed(2)})`;
      g.beginPath();
      g.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      g.fill();
    }

    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life -= dt * 1.1;
      if (m.life <= 0) { meteors.splice(i, 1); continue; }
      g.strokeStyle = `rgba(255, 230, 150, ${m.life})`;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(m.x, m.y);
      g.lineTo(m.x - m.vx * 0.08, m.y - m.vy * 0.08);
      g.stroke();
    }

    const stars = draftMode ? draftStars : active.stars;
    const links = draftMode
      ? draftStars.slice(1).map((_, i) => [i, i + 1])
      : active.links;

    g.strokeStyle = "rgba(130, 185, 255, 0.55)";
    g.lineWidth = 1.6;
    for (const [a, b] of links) {
      const p1 = stars[a];
      const p2 = stars[b];
      if (!p1 || !p2) continue;
      g.beginPath();
      g.moveTo(p1[0] * W, p1[1] * H);
      g.lineTo(p2[0] * W, p2[1] * H);
      g.stroke();
    }

    for (const [sx, sy] of stars) {
      g.fillStyle = "rgba(255, 224, 120, 0.25)";
      g.beginPath();
      g.arc(sx * W, sy * H, 10, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#ffe89e";
      g.beginPath();
      g.arc(sx * W, sy * H, 4, 0, Math.PI * 2);
      g.fill();
    }

    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  $$("[data-pre]", view).forEach((b) => {
    b.onclick = () => {
      draftMode = false;
      $("#cs-builder", view).hidden = true;
      active = PRESETS.find((p) => p.id === b.dataset.pre) || PRESETS[0];
      $$("[data-pre]", view).forEach((x) => x.classList.toggle("on", x === b));
      updateLore();
    };
  });

  $("#cs-meteor", view).onclick = spawnMeteor;

  $("#cs-build", view).onclick = () => {
    draftMode = !draftMode;
    $("#cs-builder", view).hidden = !draftMode;
    updateLore();
  };

  canvas.onclick = (e) => {
    if (!draftMode) { spawnMeteor(); return; }
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0.03, Math.min(0.97, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));
    draftStars.push([x, y]);
    updateLore();
  };

  $("#cs-clear", view).onclick = () => {
    draftStars = [];
    updateLore();
  };

  $("#cs-save", view).onclick = () => {
    const name = $("#cs-name", view).value.trim() || `Custom Sky ${st.custom.length + 1}`;
    if (draftStars.length < 2) return toast("Place at least 2 stars first.");
    st.custom.push({ name, stars: draftStars });
    saveSky(st);
    toast(`Saved "${name}"!`);
    draftStars = [];
    $("#cs-name", view).value = "";
    updateLore();
  };

  $("#cs-send-wish", view).onclick = () => {
    const inp = $("#cs-wish", view);
    const text = inp.value.trim();
    if (!text) return;
    st.wishes.unshift({ text, at: Date.now() });
    st.wishes = st.wishes.slice(0, 20);
    saveSky(st);
    inp.value = "";
    spawnMeteor();
    paintWishes();
    toast("Wish sent to the stars.");
  };

  return () => cancelAnimationFrame(raf);
}
