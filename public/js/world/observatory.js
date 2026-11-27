// Foxhold Observatory: live night-sky telescope canvas (catch shooting stars), 8 celestial targets, Star Atlas, Star-Dust exchange, and Daily Star-Omen.
import { esc, today } from "../util.js";

const TARGETS = [
  { id: "kitsune", name: "Comet Kitsune", icon: "☄️", col: "#ff9a3a", desc: "A nine-tailed comet brushing the northern pines." },
  { id: "amber", name: "Amber Nebula", icon: "🌌", col: "#ffd27a", desc: "Warm golden dust swirling above Saltwick." },
  { id: "moonwake", name: "Moonwake Ring", icon: "🪐", col: "#7fe8d0", desc: "A pale turquoise halo over the bay." },
  { id: "ninetail", name: "Nine-Tail Cluster", icon: "✨", col: "#b58cff", desc: "Nine close-set stars that pulse in unison." },
  { id: "meridian", name: "Meridian Pulsar", icon: "💫", col: "#49d0ff", desc: "Blinks once every three seconds, just like Brask's clock." },
  { id: "biscuit", name: "The Eight-Legged Hound", icon: "🐕", col: "#ffe8b0", desc: "Visible only where the sky has no ceiling." },
  { id: "elysian", name: "Elysian Schooner", icon: "⛵", col: "#9fe8ff", desc: "A ghostly ship-shaped asterism above World's Edge." },
  { id: "sector0", name: "Sector 0 Eclipse", icon: "🌑", col: "#ff5a7a", desc: "A cold sapphire ring around a dark core." },
];

const OMENS = [
  "The Nine-Tail Cluster leans east: good fortune for ferry crossings and lost lanyards.",
  "Amber Nebula brightens over Foxhold: bake something warm or check your greenhouse pots.",
  "Meridian Pulsar skips a beat: an overdue library book is thinking about returning itself.",
  "Comet Kitsune grazes the horizon: double-check the sand on Moonwake Bay for treasure.",
  "The Eight-Legged Hound runs across the zenith: open a door you've never tried before.",
  "Moonwake Ring sits clear above the pier: tonight's tide favors rare catches.",
];

const DIALS = ["Aperture", "Focus", "Filter"];

export function createObservatory(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.observatory ||= {});
  st.logged ||= 0;
  st.logDay ||= "";
  st.omenDay ||= "";
  st.dust ||= 0;
  st.atlas ||= {};

  let tab = "scope"; // "scope" | "atlas" | "omen"
  let scope = null;
  let raf = 0;

  function startScope() {
    const pick = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    const target = [0, 1, 2].map(() => 1 + Math.floor(Math.random() * 5));
    const dials = [0, 1, 2].map(() => 1 + Math.floor(Math.random() * 5));
    if (dials.every((v, i) => v === target[i])) dials[0] = (dials[0] % 5) + 1;
    scope = { pick, target, dials, steps: 0, over: false };
    open("scope");
  }

  function startSkyCanvas(canvas, starRef) {
    cancelAnimationFrame(raf);
    if (!canvas) return;
    const g = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const stars = Array.from({ length: 48 }, (_, i) => ({ x: (i * 71) % W, y: (i * 43) % H, r: 0.9 + (i % 3) * 0.7, p: i }));
    let nextShoot = performance.now() + 900;

    const frame = (now) => {
      if (!canvas.isConnected) return;
      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#050714");
      grad.addColorStop(1, "#121734");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);

      // Stars
      for (const st0 of stars) {
        const a = 0.4 + 0.5 * Math.sin(now / 520 + st0.p);
        g.fillStyle = `rgba(235,245,255,${a})`;
        g.beginPath(); g.arc(st0.x, st0.y, st0.r, 0, 7); g.fill();
      }

      // Target body glow if tracking
      if (scope?.pick) {
        g.fillStyle = scope.pick.col;
        g.globalAlpha = scope.over ? 0.85 : 0.35;
        g.beginPath(); g.arc(W * 0.5, H * 0.45, scope.over ? 18 : 11, 0, 7); g.fill();
        g.globalAlpha = 1;
      }

      // Shooting star spawn
      if (now > nextShoot && !starRef.cur) {
        nextShoot = now + 3500 + Math.random() * 3500;
        starRef.cur = { x: 20 + Math.random() * (W * 0.5), y: 18 + Math.random() * 45, vx: 170, vy: 55, life: 1.6 };
      }
      if (starRef.cur) {
        const c = starRef.cur;
        c.x += c.vx * 0.016; c.y += c.vy * 0.016; c.life -= 0.016;
        g.strokeStyle = "#ffe8b0"; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x - 24, c.y - 8); g.stroke();
        g.fillStyle = "#fff"; g.beginPath(); g.arc(c.x, c.y, 4, 0, 7); g.fill();
        if (c.life <= 0 || c.x > W || c.y > H) starRef.cur = null;
      }

      // Telescope reticle
      g.strokeStyle = "rgba(159,232,255,.35)";
      g.lineWidth = 1.5;
      g.beginPath(); g.arc(W * 0.5, H * 0.45, 58, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(W * 0.5 - 70, H * 0.45); g.lineTo(W * 0.5 + 70, H * 0.45);
      g.moveTo(W * 0.5, H * 0.45 - 66); g.lineTo(W * 0.5, H * 0.45 + 66); g.stroke();

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  function open(nextTab = tab) {
    tab = nextTab;
    cancelAnimationFrame(raf);
    const canLog = st.logDay !== today();
    const canOmen = st.omenDay !== today();
    const atlasCount = Object.keys(st.atlas).length;
    const tabs = [
      ["scope", "Telescope"],
      ["atlas", `Star Atlas (${atlasCount}/${TARGETS.length})`],
      ["omen", "Daily Star-Omen"],
    ].map(([k, l]) => `<button type="button" class="chip${tab === k ? " on" : ""}" data-tab="${k}">${l}</button>`).join("");

    const starRef = { cur: null };
    let body = "";

    if (tab === "scope") {
      const canvasHtml = `<canvas id="ob-canvas" width="560" height="160" style="width:100%;height:auto;border-radius:10px;border:1px solid rgba(255,255,255,.15);cursor:crosshair;display:block;margin-bottom:10px" title="Click passing shooting stars to catch Star-Dust!"></canvas>`;
      if (!scope) {
        body = `${canvasHtml}
          <p class="muted">Calibrate the brass telescope's three dials (1–5) to lock onto 8 celestial bodies (<strong>+60 mon</strong> &amp; <strong>+25 Renown</strong>). Click shooting stars for Star-Dust! (Star-Dust: <strong>${st.dust}</strong>)</p>
          <p>Celestial sightings logged: <strong>${st.logged}</strong></p>
          <div class="px-row">
            <button type="button" class="btn btn-accent" id="ob-go">Aim Telescope</button>
            <button type="button" class="btn" id="ob-day" ${canLog ? "" : "disabled"}>${canLog ? "Daily Sky Log (+20 mon)" : "Logged Today ✓"}</button>
          </div>`;
      } else {
        const rows = DIALS.map((label, i) => {
          const raw = Math.abs(scope.dials[i] - scope.target[i]);
          const diff = Math.min(raw, 5 - raw);
          const hint = diff === 0 ? "Locked ✓" : diff === 1 ? "Warm" : "Cold";
          return `<div class="se-good">
            <span><strong>🔭 ${esc(label)}: ${scope.dials[i]}</strong> <small>${hint}</small></span>
            <div style="display:flex;gap:6px">
              <button type="button" class="btn btn-sm" data-dial="${i}:-1" ${scope.over ? "disabled" : ""}>−</button>
              <button type="button" class="btn btn-sm btn-accent" data-dial="${i}:1" ${scope.over ? "disabled" : ""}>+</button>
            </div>
          </div>`;
        }).join("");

        body = `${canvasHtml}
          <p class="muted">Tracking: <strong>${scope.pick.icon} ${esc(scope.pick.name)}</strong> · Adjustments: <strong>${scope.steps}/10</strong></p>
          <div class="se-mkt" style="margin:10px 0">${rows}</div>
          ${scope.over ? `<button type="button" class="btn btn-accent" id="ob-go">Track Another</button>` : ""}`;
      }
    } else if (tab === "atlas") {
      body = `
        <p class="muted">Star-Dust collected: <strong>${st.dust}</strong> · Trade 3 Star-Dust for <strong>+75 mon &amp; +30 Renown</strong>.</p>
        <div class="px-row" style="margin-bottom:10px">
          <button type="button" class="btn btn-accent" id="ob-dust" ${st.dust >= 3 ? "" : "disabled"}>Exchange 3 Star-Dust (+75 mon)</button>
        </div>
        <div class="se-mkt">${TARGETS.map((t) => {
          const n = st.atlas[t.id] || 0;
          return `<div class="se-good${n ? " cheap" : ""}"><span><strong>${n ? `${t.icon} ${esc(t.name)}` : "???"}</strong><small>${n ? `${esc(t.desc)} · Sighted ×${n}` : "Lock onto this body in the Telescope"}</small></span></div>`;
        }).join("")}</div>`;
    } else {
      const omenIdx = today().split("").reduce((a, c) => a + c.charCodeAt(0), 0) % OMENS.length;
      body = `
        <p class="muted">Read tonight's Foxhold Star-Omen once per day for <strong>+25 mon</strong> &amp; <strong>+20 Renown</strong>.</p>
        <div class="se-mkt" style="margin:10px 0"><div class="se-good"><span><strong>🔮 Tonight's Omen</strong><small>${esc(OMENS[omenIdx])}</small></span></div></div>
        <button type="button" class="btn btn-accent" id="ob-omen" ${canOmen ? "" : "disabled"}>${canOmen ? "Claim Daily Star-Omen (+25 mon)" : "Omen Claimed Today ✓"}</button>`;
    }

    panel("Foxhold Observatory", `<div class="chips" style="margin-bottom:10px">${tabs}</div>${body}`, (e) => {
      e.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => open(b.dataset.tab)));

      const canvas = e.querySelector("#ob-canvas");
      if (canvas) {
        startSkyCanvas(canvas, starRef);
        canvas.onclick = (ev) => {
          if (!starRef.cur) return;
          const r = canvas.getBoundingClientRect();
          const cx = (ev.clientX - r.left) * (canvas.width / r.width);
          const cy = (ev.clientY - r.top) * (canvas.height / r.height);
          if (Math.hypot(cx - starRef.cur.x, cy - starRef.cur.y) < 36) {
            starRef.cur = null;
            st.dust++;
            s.mon += 12;
            ping("done");
            toast(`Caught a shooting star! +1 Star-Dust & +12 mon (Total: ${st.dust})`);
            save(); hud(); open("scope");
          }
        };
      }

      e.querySelector("#ob-go")?.addEventListener("click", startScope);
      e.querySelector("#ob-day")?.addEventListener("click", () => {
        if (st.logDay === today()) return;
        st.logDay = today(); s.mon += 20; addRenown?.(15);
        ping("done"); toast("Recorded tonight's horizon starlight! +20 mon & +15 Renown.");
        save(); hud(); open("scope");
      });
      e.querySelector("#ob-dust")?.addEventListener("click", () => {
        if (st.dust < 3) return;
        st.dust -= 3; s.mon += 75; addRenown?.(30);
        ping("done"); toast("Exchanged 3 Star-Dust for +75 mon & +30 Renown!");
        save(); hud(); open("atlas");
      });
      e.querySelector("#ob-omen")?.addEventListener("click", () => {
        if (st.omenDay === today()) return;
        st.omenDay = today(); s.mon += 25; addRenown?.(20);
        ping("done"); toast("Star-Omen claimed! +25 mon & +20 Renown.");
        save(); hud(); open("omen");
      });

      e.querySelectorAll("[data-dial]").forEach((b) => {
        b.onclick = () => {
          if (!scope || scope.over) return;
          const [idx, dir] = b.dataset.dial.split(":").map(Number);
          scope.steps++;
          scope.dials[idx] = ((scope.dials[idx] - 1 + dir + 5) % 5) + 1;
          ping("blip");

          if (scope.dials.every((v, i) => v === scope.target[i])) {
            scope.over = true;
            st.logged++;
            st.atlas[scope.pick.id] = (st.atlas[scope.pick.id] || 0) + 1;
            s.mon += 60;
            addRenown?.(25);
            ping("done");
            toast(`${scope.pick.icon} ${scope.pick.name} locked in! +60 mon & +25 Renown.`);
            save(); hud();
          } else if (scope.steps >= 10) {
            scope.over = true;
            ping("close");
            toast(`${scope.pick.name} drifted behind cloud cover.`);
          }
          open("scope");
        };
      });
    });
  }

  return { open };
}
