// Moonwake Bay Coastal Features: Tide-Glass Watch (tide forecast & message bottles) and Driftwood Regatta (critter sailboat racing).
import { activePet, specie } from "./baycore.js";

const TIDES = [
  { id: "calm", name: "Calm Tide", icon: "🌊", bonus: "+15% shell value on the beach", color: "#58b8d8" },
  { id: "ebb", name: "Silver Ebb", icon: "🐚", bonus: "+25% buried treasure luck", color: "#9fd8e8" },
  { id: "surge", name: "Moonlit Surge", icon: "🌙", bonus: "+20% critter XP from care & races", color: "#7f88e8" },
  { id: "sunburst", name: "Sunburst High", icon: "☀️", bonus: "+25% fruit & orchard yield", color: "#ffd25a" },
  { id: "starlight", name: "Starlight Drift", icon: "✨", bonus: "Rare tide-bottles wash ashore", color: "#c583ff" },
];

export function currentTide(now = Date.now()) {
  const idx = Math.floor(now / 180000) % TIDES.length;
  return TIDES[idx];
}

export function tidewatchPage(c) {
  const { b, page, say, ping, save, pay, checkGoals, esc } = c;
  b.coast ||= { bottles: 0, charms: 0, lastBottle: 0 };
  const t = currentTide();
  const nextMin = Math.ceil((180000 - (Date.now() % 180000)) / 60000);
  const cdLeft = Math.max(0, Math.ceil((b.coast.lastBottle + 45000 - Date.now()) / 1000));

  page("Tide-Glass Watch", `
    <div class="by-homebar" style="border-left:4px solid ${t.color};padding-left:10px">
      <span><strong>${t.icon} ${esc(t.name)}</strong><br><small class="muted">${esc(t.bonus)} · Shifts in ${nextMin} min</small></span>
      <span><strong>${b.coast.charms || 0}</strong><br><small class="muted">Tide Charms</small></span>
    </div>
    <p class="muted" style="margin-top:10px">Toss a corked bottle into Moonwake Bay's current. Something always washes back.</p>
    <div class="by-list">
      <div>
        <i>🍾</i>
        <span><strong>Launch a Tide-Bottle</strong><small>Costs 15 shells · ${cdLeft ? `Ready in ${cdLeft}s` : "Current is clear!"}</small></span>
        <button class="btn btn-accent" type="button" id="tw-toss" ${b.shells >= 15 && !cdLeft ? "" : "disabled"}>Launch (15 shells)</button>
      </div>
      <div>
        <i>🔮</i>
        <span><strong>Trade Tide Charms</strong><small>Turn 3 Tide Charms into 120 shells</small></span>
        <button class="btn" type="button" id="tw-trade" ${(b.coast.charms || 0) >= 3 ? "" : "disabled"}>Trade 3</button>
      </div>
    </div>
    <h3>Five-Tide Almanac</h3>
    <div class="by-list">${TIDES.map((x) => `<div class="${x.id === t.id ? "ok" : ""}"><i>${x.icon}</i><span><strong>${esc(x.name)}</strong><small>${esc(x.bonus)}</small></span></div>`).join("")}</div>
  `, (e) => {
    e.querySelector("#tw-toss").onclick = () => {
      if (b.shells < 15 || Date.now() < b.coast.lastBottle + 45000) return;
      b.shells -= 15;
      b.coast.lastBottle = Date.now();
      b.coast.bottles = (b.coast.bottles || 0) + 1;
      b.t.bottles = (b.t.bottles || 0) + 1;
      const roll = Math.random();
      let msg = "";
      if (roll < 0.35) {
        const got = pay(b, 30 + Math.floor(Math.random() * 35));
        msg = `A barnacled coin pouch washed back! +${got} shells.`;
      } else if (roll < 0.68) {
        b.coast.charms = (b.coast.charms || 0) + 1;
        msg = "A sea-glass Tide Charm washed ashore! (+1 Tide Charm)";
      } else if (roll < 0.9) {
        const f = ["mango", "peach", "coconut"][Math.floor(Math.random() * 3)];
        b.fruit[f] = (b.fruit[f] || 0) + 2;
        msg = `A floating crate of ${f}s bumped the pier! (+2 ${f})`;
      } else {
        const got = pay(b, 95);
        b.coast.charms = (b.coast.charms || 0) + 1;
        msg = `Starlight Drift! A silver compass bottle returned with +${got} shells and +1 Tide Charm!`;
      }
      save(); ping("done"); checkGoals(); say(msg); tidewatchPage(c);
    };
    e.querySelector("#tw-trade").onclick = () => {
      if ((b.coast.charms || 0) < 3) return;
      b.coast.charms -= 3;
      const got = pay(b, 120);
      save(); ping("done"); say(`Traded 3 Tide Charms for +${got} shells!`); tidewatchPage(c);
    };
  });
}

export function regattaPage(c) {
  const { b, page, say, ping, save, pay, checkGoals, esc } = c;
  b.coast ||= { bottles: 0, charms: 0, lastBottle: 0, wins: 0 };
  const pet = activePet(b);
  const petName = pet ? (pet.name || specie(pet.sp)?.name || "Your critter") : "Your skiff";

  let dist = 0, rival = 0, wind = 50, timer = 0, active = false;
  const render = (e, status = "Catch the green wind gusts to surge ahead of the Harbour Gull!") => {
    e.innerHTML = `
      <p class="muted">Skipper: <strong>${esc(petName)}</strong> · Regatta Wins: <strong>${b.coast.wins || 0}</strong></p>
      <div class="by-list">
        <div><i>⛵</i><span><strong>${esc(petName)}</strong><small>${Math.round(dist)}%</small></span><progress value="${dist}" max="100" style="width:120px"></progress></div>
        <div><i>🕊️</i><span><strong>Harbour Gull</strong><small>${Math.round(rival)}%</small></span><progress value="${rival}" max="100" style="width:120px"></progress></div>
      </div>
      <div style="margin:12px 0">
        <small class="muted">Wind Gauge (sweet spot: 35–65)</small>
        <div style="height:14px;background:#1e2636;border-radius:7px;position:relative;overflow:hidden;margin-top:4px">
          <div style="position:absolute;left:35%;width:30%;top:0;bottom:0;background:rgba(92,240,192,.35)"></div>
          <div style="position:absolute;left:${wind}%;top:0;bottom:0;width:6px;background:#ffd84d;transform:translateX(-50%)"></div>
        </div>
      </div>
      <p>${esc(status)}</p>
      <div style="display:flex;gap:8px">
        ${active
          ? `<button class="btn btn-accent" type="button" id="rg-trim">Trim Sail! (Catch Gust)</button>`
          : `<button class="btn btn-accent" type="button" id="rg-start">Start Regatta Race</button>`}
      </div>
    `;
    const startBtn = e.querySelector("#rg-start");
    if (startBtn) startBtn.onclick = () => start(e);
    const trimBtn = e.querySelector("#rg-trim");
    if (trimBtn) trimBtn.onclick = () => {
      if (!active) return;
      if (wind >= 35 && wind <= 65) {
        dist = Math.min(100, dist + 14 + Math.random() * 6);
        ping("choice");
      } else {
        dist = Math.min(100, dist + 4);
        ping("blip");
      }
    };
  };

  function start(e) {
    dist = 0; rival = 0; wind = 50; active = true;
    clearInterval(timer);
    let t = 0;
    timer = setInterval(() => {
      t += 0.1;
      wind = 50 + Math.sin(t * 3.1) * 42;
      rival = Math.min(100, rival + 0.95 + Math.random() * 0.45);
      dist = Math.min(100, dist + 0.35);
      if (dist >= 100 || rival >= 100) {
        clearInterval(timer); timer = 0; active = false;
        const won = dist >= rival;
        if (won) {
          b.coast.wins = (b.coast.wins || 0) + 1;
          b.t.regattaWon = (b.t.regattaWon || 0) + 1;
          const got = pay(b, 55 + Math.min(45, (b.coast.wins || 0) * 5));
          if (pet) pet.xp = (pet.xp || 0) + 18;
          save(); ping("done"); checkGoals();
          render(e, `Victory! ${petName} crossed the Moonwake buoy first! +${got} shells${pet ? " & +18 XP" : ""}.`);
        } else {
          const got = pay(b, 12);
          save(); ping("close");
          render(e, `Harbour Gull edged ahead at the buoy. +${got} shells for racing!`);
        }
        return;
      }
      render(e);
    }, 100);
  }

  page("Driftwood Regatta", `<div id="rg-root"></div>`, (e) => {
    const root = e.querySelector("#rg-root");
    render(root);
    return () => clearInterval(timer);
  });
}
