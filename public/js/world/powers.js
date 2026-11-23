// Blackwood Student Powers: every Blackwood student and staff member can actively use their powers on you.
import { settings } from "../store.js";
const T = 32;

export const STUDENT_POWERS = {
  hero: { id: "burn", name: "Flame Burst", dur: 6, color: "#ff7a2a", say: "“Oops—dropped a match!” Hero snaps his fingers and your tail catches fire! (+35% panic speed)" },
  poppy: { id: "oneStar", name: "1-Star Review", dur: 8, color: "#ffd27a", say: "“One star. Terrible ambiance.” Poppy stamps a glowing 1-star review over your head! (-25% speed)" },
  kevinq: { id: "zeroG", name: "Zero-G Drift", dur: 8, color: "#7fe8ff", say: "“Sorry! Sorry, my gravity slipped!” Kevin accidentally turns off your gravity!" },
  luna: { id: "rewind", name: "Time Snap", dur: 1.5, color: "#9fd6ff", say: "“Wait—three seconds ago was better.” Luna rewinds you back along your own footsteps!" },
  imani: { id: "chill", name: "Mortality Chill", dur: 5, color: "#b58cff", say: "Imani's scythe hums once. A cold purple chill settles into your paws. (-30% speed)" },
  violet: { id: "kiln", name: "Kiln Mirage", dur: 6, color: "#ff9a3a", say: "Violet opens the kiln vent. Shimmering glass-heat rings orbit around you!" },
  kimi: { id: "shadow", name: "Shadow Ink", dur: 5, color: "#3b2c5a", say: "Kimi flicks her wrist—cold black ink pools under your paws! (-45% speed)" },
  rusk: { id: "detention", name: "Detention Stamp", dur: 2.2, color: "#d9302e", say: "“ARREST AFTER FINALS!” Officer Rusk stamps your paw to the floor!" },
  madison: { id: "compel", name: "Friendship Pulse", dur: 3, color: "#ff5a9a", say: "Madison smiles and adjusts her pink ribbon. You suddenly remember she saved your life!" },
  famine: { id: "hunger", name: "Hollow Stomach", dur: 6, color: "#a8c25a", say: "Famine sighs. Suddenly you haven't eaten in three days. (-20% speed)" },
  famine2: { id: "hunger", name: "Hollow Stomach", dur: 6, color: "#a8c25a", say: "Famine glances at your pockets. Your stomach growls loud enough to echo." },
  war: { id: "frenzy", name: "Battle Frenzy", dur: 6, color: "#ff3a48", say: "War grins. Your pulse spikes and your claws itch! (+30% speed)" },
  war2: { id: "frenzy", name: "Battle Frenzy", dur: 6, color: "#ff3a48", say: "War taps the table. Every instinct tells you to sprint!" },
  lux: { id: "glare", name: "Panopticon Glare", dur: 6, color: "#ffd84d", say: "“Smile for the feed, darling.” A golden camera spotlight locks onto you! (-20% speed)" },
  velvette: { id: "bleed", name: "Teaspoon Edge", dur: 6, color: "#e0345e", say: "Velvette twirls a sharpened teaspoon. Your reflexes spike! (+22% speed)" },
  sasha: { id: "clause", name: "Second Schedule", dur: 7, color: "#9aa8d4", say: "“Footnote thirty-one, subsection B.” Legal ink binds your ankles! (-20% speed)" },
  greta: { id: "manifesto", name: "400-Slide Manifesto", dur: 6, color: "#b58cff", say: "Greta flips to Slide 214. You slow down just trying to read it! (-28% speed)" },
  yuki: { id: "ticket", name: "Mortality Ticket", dur: 7, color: "#7fe8ff", say: "Yuki stamps #4101 onto your forehead. Wait-room urgency! (+18% speed)" },
  reaper: { id: "chill", name: "Scythe Chill", dur: 5, color: "#b58cff", say: "The Grim Reaper shifts his scythe. Frost creeps up your tail. (-30% speed)" },
  doris: { id: "tag", name: "Lost & Found Tag", dur: 6, color: "#d8cbb8", say: "Doris tags your ear with a beige claim slip. (-15% speed)" },
  mina: { id: "deliver", name: "Direct Delivery", dur: 5, color: "#5cf0c0", say: "“Sent as an attachment!” Mina's script nudges your coordinates!" },
  finch: { id: "grade", name: "Red Pen Grade", dur: 6, color: "#e0343e", say: "Finch marks a giant red C+ over your head! (-25% speed)" },
  becca: { id: "rewrite", name: "Quill Rewrite", dur: 6, color: "#b58cff", say: "Becca writes 'and then they ran very fast' in the margin! (+25% speed)" },
  simone2: { id: "burn", name: "Thermal Surge", dur: 6, color: "#ff9a3a", say: "Simone vents Meridian Sector 4's heat coil right past you! (+35% speed)" },
  yuki2: { id: "frenzy", name: "Crowbar Breach", dur: 6, color: "#ff3a48", say: "Yuki hefts her crowbar. Nothing on this map is staying shut! (+30% speed)" },
  ashdown_port: { id: "clause", name: "Charter Bid", dur: 6, color: "#ffd84d", say: "Dean Ashdown slides a buyout contract across the desk. (-20% speed)" },
  briar: { id: "chill", name: "Pollen Haze", dur: 5, color: "#5cf0c0", say: "Professor Briar's tenured fern releases a sleepy mist! (-30% speed)" },
  editor83: { id: "oneStar", name: "Front Page Print", dur: 6, color: "#d8cbb8", say: "“STILL HUNGRY.” Your name hits the morning edition! (-25% speed)" },
  soph_attic: { id: "zeroG", name: "Spin Cycle", dur: 6, color: "#7fe8ff", say: "The 1994 attic spins like Washer #3! (Zero-G drift)" },
  souschef: { id: "chill", name: "Freezer Blast", dur: 5, color: "#9fe8ff", say: "The walk-in freezer door swings wide! (-30% speed)" },
  lamplighter: { id: "ticket", name: "Lamplight Pulse", dur: 6, color: "#ffd84d", say: "A warm lantern flame quickens your step! (+18% speed)" },
};

const CLEANSE_IDS = new Set(["marlowe", "saffron", "lunch", "okonkwo", "imani2"]);

export function createPowers(st, api) {
  const active = {}; // powerId -> expiry timestamp (seconds)
  const cds = {};    // npcId -> next auto-cast time
  const winds = {};  // npcId -> telegraph end time
  const hist = [];   // [{ s, x, y }] for Luna's rewind
  let histT = 0, vx = 0, vy = 0, rewindFlash = 0;

  const nowS = () => performance.now() / 1000;
  const has = (id) => (active[id] || 0) > nowS();
  const clearAll = () => {
    for (const k of Object.keys(active)) delete active[k];
    vx = vy = 0;
  };

  function cast(npc, quiet = false) {
    const p = STUDENT_POWERS[npc.id];
    if (!p) return false;
    const t = nowS();
    active[p.id] = t + p.dur;
    api.ping(p.id === "detention" || p.id === "chill" ? "blip" : "choice");

    if (p.id === "compel") {
      api.bestie?.add(55);
    } else if (p.id === "rewind" && hist.length >= 4) {
      const old = hist[0];
      if (old.s === api.scene().id) {
        api.setPos(old.x, old.y);
      }
      rewindFlash = t + 0.65;
    } else if (p.id === "burn") {
      const nx = (npc.x + 0.5) * T, ny = (npc.y + 0.5) * T;
      const a = Math.atan2(api.py() - ny, api.px() - nx);
      vx = Math.cos(a) * 260;
      vy = Math.sin(a) * 260;
    }

    if (!quiet) api.toast(`${npc.name} used ${p.name}!`);
    if (has("burn") && has("zeroG")) api.toast("COMBO: Solar Flare Drift!");
    else if (has("shadow") && has("chill")) api.toast("COMBO: Abyssal Eclipse!");
    else if (has("oneStar") && has("detention")) api.toast("COMBO: Academic Probation!");
    else if (has("glare") && has("shadow")) api.toast("COMBO: Blind Spot!");
    else if (has("clause") && has("detention")) api.toast("COMBO: Summary Judgment!");
    else if (has("rewrite") && has("rewind")) api.toast("COMBO: Third Act Edit!");
    else if (has("glare") && has("deliver")) api.toast("COMBO: Viral Attachment!");
    else if (has("grade") && has("manifesto")) api.toast("COMBO: Tenure Review!");
    api.hud();
    return true;
  }

  function buttons(npc) {
    const out = [];
    const p = STUDENT_POWERS[npc.id];
    if (p) {
      out.push([`Let ${npc.name} use ${p.name} on you`, () => {
        api.closeTalk();
        cast(npc, true);
        api.say(npc, p.say, [["Whoa", api.closeTalk, 1]]);
      }]);
    }
    if (CLEANSE_IDS.has(npc.id) && Object.keys(active).some((k) => has(k))) {
      out.push(["Cleanse all student powers", () => {
        clearAll();
        api.ping("done");
        api.hud();
        api.say(npc, "Deep breath. All the campus hexes—fire, ink, zero-G, one-star reviews—wash right off.", [["Thanks", api.closeTalk, 1]]);
      }]);
    }
    return out;
  }

  function update(dt) {
    const t = nowS();
    histT -= dt;
    if (histT <= 0) {
      histT = 0.5;
      hist.push({ s: api.scene().id, x: api.px(), y: api.py() });
      if (hist.length > 7) hist.shift();
    }

    // Autonomous casting by nearby powered students
    if (settings.world?.blackwoodPowers === false) return;
    const npcs = api.scene().npcs || [];
    for (const n of npcs) {
      const p = STUDENT_POWERS[n.id];
      if (!p) continue;
      const d = Math.hypot((n.x + 0.5) * T - api.px(), (n.y + 0.5) * T - api.py());
      if (winds[n.id]) {
        if (t >= winds[n.id]) {
          delete winds[n.id];
          cds[n.id] = t + 11 + Math.random() * 6;
          if (d < 220) cast(n, false);
        }
        continue;
      }
      if (d < 145 && t > (cds[n.id] || 0)) {
        winds[n.id] = t + 0.95;
      }
    }

    // Decay knockback velocity
    vx *= Math.max(0, 1 - dt * 5);
    vy *= Math.max(0, 1 - dt * 5);
    if (Math.hypot(vx, vy) < 6) vx = vy = 0;

    // Clean expired keys
    for (const k of Object.keys(active)) if (active[k] <= t) delete active[k];
  }

  function steer(ax, ay, dt) {
    if (has("detention")) return [0, 0];
    if (has("zeroG")) {
      vx = vx * Math.max(0, 1 - dt * 1.4) + ax * 420 * dt;
      vy = vy * Math.max(0, 1 - dt * 1.4) + ay * 420 * dt;
      const m = Math.hypot(vx, vy);
      if (m > 220) { vx = vx / m * 220; vy = vy / m * 220; }
      return [vx / 185, vy / 185];
    }
    return [ax + vx / 185, ay + vy / 185];
  }

  function speedMul() {
    let m = 1;
    if (has("burn")) m *= 1.35;
    if (has("frenzy")) m *= 1.3;
    if (has("rewrite")) m *= 1.25;
    if (has("bleed")) m *= 1.22;
    if (has("ticket")) m *= 1.18;
    if (has("oneStar")) m *= 0.75;
    if (has("chill")) m *= 0.7;
    if (has("shadow")) m *= 0.55;
    if (has("hunger")) m *= 0.8;
    if (has("glare")) m *= 0.8;
    if (has("clause")) m *= 0.8;
    if (has("manifesto")) m *= 0.72;
    if (has("tag")) m *= 0.85;
    if (has("grade")) m *= 0.75;
    return m;
  }

  function draw(g, now, still) {
    const t = nowS(), x = api.px(), y = api.py();
    // Telegraph rings on students about to cast
    for (const n of api.scene().npcs || []) {
      const end = winds[n.id];
      if (!end || end <= t) continue;
      const p = STUDENT_POWERS[n.id];
      const k = 1 - Math.max(0, (end - t) / 0.95);
      g.strokeStyle = p.color;
      g.lineWidth = 3;
      g.beginPath();
      g.arc((n.x + 0.5) * T, (n.y + 0.5) * T, 16 + k * 26, 0, 7);
      g.stroke();
    }

    if (has("shadow")) {
      g.fillStyle = "rgba(18, 12, 30, 0.72)";
      g.beginPath(); g.ellipse(x, y + 12, 26, 11, 0, 0, 7); g.fill();
    }
    if (has("kiln")) {
      g.strokeStyle = "rgba(255, 154, 58, 0.75)";
      g.lineWidth = 2.5;
      const r = 24 + (still ? 0 : Math.sin(now / 150) * 5);
      g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
    }
    if (has("burn")) {
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05 + (still ? 0 : now / 140);
        g.fillStyle = i % 2 ? "#ff7a2a" : "#ffd27a";
        g.beginPath();
        g.arc(x + Math.cos(a) * 18, y - 6 + Math.sin(a) * 10, 4, 0, 7);
        g.fill();
      }
    }
    if (has("oneStar")) {
      g.fillStyle = "#111";
      g.fillRect(x - 32, y - 58, 64, 16);
      g.fillStyle = "#ffd27a";
      g.font = "800 10px system-ui";
      g.textAlign = "center";
      g.fillText("★☆☆☆☆ 1★", x, y - 47);
    }
    if (has("zeroG")) {
      g.strokeStyle = "#7fe8ff";
      g.lineWidth = 2;
      g.beginPath(); g.ellipse(x, y - 10, 20, 7, (still ? 0 : now / 500), 0, 7); g.stroke();
    }
    if (has("detention")) {
      g.fillStyle = "#d9302e";
      g.font = "900 11px system-ui";
      g.textAlign = "center";
      g.fillText("DETENTION", x, y - 50);
    }
  }

  function overlay(g, cw, ch) {
    const t = nowS();
    if (t < rewindFlash) {
      g.fillStyle = `rgba(140, 220, 255, ${(rewindFlash - t) * 0.45})`;
      g.fillRect(0, 0, cw, ch);
    }
    if (has("chill")) {
      g.fillStyle = "rgba(90, 50, 140, 0.16)";
      g.fillRect(0, 0, cw, ch);
    }
    if (has("shadow")) {
      g.fillStyle = "rgba(5, 4, 12, 0.25)";
      g.fillRect(0, 0, cw, ch);
    }
    if (has("frenzy")) {
      g.fillStyle = "rgba(220, 30, 50, 0.1)";
      g.fillRect(0, 0, cw, ch);
    }
  }

  function bar() {
    const t = nowS();
    const pills = Object.values(STUDENT_POWERS)
      .filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i && (active[p.id] || 0) > t)
      .map((p) => `<span class="rm-pill" style="background:${p.color};color:#111;padding:2px 7px;border-radius:99px;font:800 11px system-ui;margin-left:4px">${p.name} ${Math.ceil(active[p.id] - t)}s</span>`);
    if (has("burn") && has("zeroG")) pills.push(`<span class="rm-pill" style="background:#ffe08a;color:#111;padding:2px 7px;border-radius:99px;font:900 11px system-ui;margin-left:4px">★ Solar Flare</span>`);
    if (has("shadow") && has("chill")) pills.push(`<span class="rm-pill" style="background:#c58bff;color:#111;padding:2px 7px;border-radius:99px;font:900 11px system-ui;margin-left:4px">★ Eclipse</span>`);
    if (has("oneStar") && has("detention")) pills.push(`<span class="rm-pill" style="background:#ff5a7a;color:#111;padding:2px 7px;border-radius:99px;font:900 11px system-ui;margin-left:4px">★ Probation</span>`);
    return pills.join("");
  }

  const castById = (id, dur = 6) => { active[id] = nowS() + dur; api.hud(); return true; };

  return { cast, castById, buttons, update, steer, speedMul, draw, overlay, bar, has, clearAll };
}
