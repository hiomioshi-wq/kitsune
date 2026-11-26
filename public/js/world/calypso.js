// Calypso's Siren Song mind-control system for Incarnate (Book One).
// Hear enough of her song and you stop saying no—until Juniper Vance, Ena, or Kaina breaks the spell.
import { esc } from "../util.js";
import { settings } from "../store.js";
import { speakAs, execVoiceCmds, askChatLine } from "./mindai.js";

const T = 32;
const WANTS = [
  "You don't remember what you were worried about five minutes ago. That feels nice.",
  "Everyone in Halcyon is humming the same three notes. Why not join in?",
  "Calypso didn't make you do anything. You wanted to.",
  "It's easier when somebody else decides what comes next.",
  "Your paws feel lighter when you stop fighting the song.",
];
const ECHOES = [[14, 24], [30, 20], [48, 28], [52, 38], [22, 12], [40, 14], [16, 40], [44, 42]];
const TARGETS = {
  mark: "the Tanner Barn", brad: "the Tanner Barn", dolly: "the Broken World", ivy: "the Broken World",
  noor: "the Broken World", pia: "the Quarry", lastcook: "Last Slice Pizzeria", encorelead: "Encore Stage",
  cafe_kid: "Halcyon High Cafeteria", marks_dad: "Hospital Cafeteria",
};
const HUMMING = [
  "Hmm-hmm-hmm. Isn't it easier not to argue, bestie?",
  "Calypso says hi. She already knows what I want.",
  "Everything's fine! Everyone's humming!",
];
const HIJACK = [
  "They're talking, but all you hear is three bright notes under the floorboards.",
  "You almost tell them no, then smile and start humming instead.",
  "You're supposed to be doing something for Calypso right now.",
];

export function createSong(st, api) {
  const s = (st.song = { v: 0, on: false, wants: [], enthralled: {}, errand: "", picked: {}, day: "", times: 0, ...(st.song || {}) });
  const today = new Date().toDateString();
  if (s.day !== today) { s.day = today; s.picked = {}; }

  let pulseT = 10, pullT = 0;
  const calypso = () => api.scene().npcs?.find((n) => n.id === "calypso" || n.id === "lab_calypso");
  const remember = () => { const left = WANTS.filter((w) => !s.wants.includes(w)); if (left.length) s.wants.push(left[Math.floor(Math.random() * left.length)]); };
  const total = Object.keys(TARGETS).length, count = () => Object.keys(s.enthralled).length;
  const free = () => { s.on = false; s.v = 0; s.errand = ""; pullT = 0; api.hud(); };
  const newErrand = () => { const open = Object.keys(TARGETS).filter((k) => !s.enthralled[k]); s.errand = open.length ? open[Math.floor(Math.random() * open.length)] : ""; return s.errand; };
  const nameOf = (id) => { for (const sc of Object.values(api.scenes)) { const n = sc.npcs?.find((x) => x.id === id); if (n) return n.name; } return id; };

  function add(n) {
    if (settings.world?.mindControl === false) return;
    if (s.on) return;
    s.v = Math.min(100, s.v + n);
    if (s.v >= 100) {
      s.on = true; s.times++; pulseT = 7; remember();
      api.ping("done"); api.flash(); api.hud();
      api.say(null, `Three bright notes lock into place behind your eyes. ${s.wants.at(-1) || ""} You're humming Calypso's song now. Go find her in Halcyon High.`, [["Yes, bestie", api.closeTalk, 1]]);
    }
  }

  function tiers() {
    const n = count();
    if (n === 3) { api.reward(100); return " Three souls humming! (+100 mon)"; }
    if (n === 6) { api.reward(220); return " Six souls humming across Halcyon! (+220 mon)"; }
    if (n === total) { api.reward(500); return " Everybody in Halcyon is humming now, bestie. (+500 mon)"; }
    return "";
  }

  function aiChatBtn(e) {
    if (settings.world?.aiDialogue === false) return [];
    return [["Speak to Calypso (AI Voice)", async () => {
      const line = await askChatLine(e.name, "Are you controlling me?", ["Sing to me", "Give me an order", "What do I want?", "Let me go"]);
      if (!line) return;
      api.toast("Calypso is listening…");
      speakAs("calypso", line, `song=${Math.round(s.v)}%, enthralled=${s.on}, errandsDone=${count()}/${total}`).then(({ text, cmds, provider }) => {
        const notes = execVoiceCmds(cmds, { add, free, heal: api.heal, hurt: api.hurt, reward: api.reward });
        api.hud();
        const tag = provider && provider !== "offline" ? ` [${provider}]` : "";
        const extra = notes.length ? ` (${notes.join(" · ")})` : "";
        api.say(e, `${text}${extra}${tag}`, [["...", api.closeTalk, 1]]);
      });
    }]];
  }

  function talkCalypso(e) {
    const aiBtn = aiChatBtn(e);
    if (s.on) {
      if (s.errand) return api.say(e, `Bestie, go bring ${nameOf(s.errand)} from ${TARGETS[s.errand]} into the song. Don't make me ask twice.`, [["On my way", api.closeTalk, 1], ...aiBtn]);
      const t = newErrand();
      if (!t) return api.say(e, "Literally everyone's humming, babe. Even the monument sounds prettier now.", [["Hum along", api.closeTalk, 1], ...aiBtn]);
      return api.say(e, `Hi, bestie! I can taste someone still saying no in ${TARGETS[t]}. Go share the song with ${nameOf(t)}.`, [["Right away", () => { api.ping("choice"); api.hud(); api.closeTalk(); }, 1], ...aiBtn]);
    }
    return api.say(e, "Hi, bestie. What do you want? No, really. I can taste it from here. Forty thousand years old, zero character growth, babe.", [
      ["Listen to her song", () => { remember(); api.closeTalk(); add(55); }],
      ...aiBtn,
      ["Step back", api.closeTalk, 1],
    ]);
  }

  function interact(e) {
    if (e.id === "calypso" || e.id === "lab_calypso") { talkCalypso(e); return true; }
    if (s.on && ["juniper", "ena", "kaina"].includes(e.id)) {
      const line = e.id === "juniper" ? "Snap out of it. I burned her name nine hundred and twelve times—she doesn't own your voice." : e.id === "ena" ? "Hey. Look at me, not the song. Say no. You still know how to say no." : "The song stops at the Seam. Take a breath and let it go.";
      api.say(e, line, [["Break Calypso's Song", () => {
        free(); api.ping("done");
        api.say(e, "The three notes shatter like thin glass. Your head clears.", [["Thank you", api.closeTalk, 1]]);
      }]]);
      return true;
    }
    if (s.on && s.errand === e.id) {
      api.say(e, `Wait—why am I humming? Oh. Oh, Calypso wants to know what I want?`, [["Share the song", () => {
        s.enthralled[e.id] = 1; s.errand = ""; api.reward(30); api.ping("done");
        const x = tiers();
        api.say(e, `${esc(e.name)} starts humming along. (${count()} of ${total}, +30 mon)${x}`, [["Back to Calypso", api.closeTalk, 1]]);
        api.hud();
      }, 1]]);
      return true;
    }
    if (s.enthralled[e.id]) { api.say(e, HUMMING[Math.floor(Math.random() * HUMMING.length)]); return true; }
    if (s.on && settings.world?.mindControl !== false && (e.cast || e.look) && !e.relic && !e.boss) { api.say(null, HIJACK[Math.floor(Math.random() * HIJACK.length)]); return true; }
    return false;
  }

  const spots = () => (api.scene().id === "broken" ? ECHOES.map(([x, y], i) => ({ i, x: (x + .5) * T, y: (y + .5) * T })).filter((c) => !s.picked[c.i]) : []);
  function target() {
    for (const c of spots()) if (Math.hypot(c.x - api.px(), c.y - api.py()) < 40) return { label: "Absorb Song Echo", go: () => { s.picked[c.i] = 1; api.heal(4); api.ping("choice"); api.toast(s.on ? "Three bright notes." : "Sweet, hollow echo. +4 health."); remember(); add(35); } };
    return null;
  }

  function update(dt) {
    if (settings.world?.mindControl === false) { if (s.on || s.v > 0) free(); return; }
    const c = calypso();
    if (c && !s.on && Math.hypot((c.x + .5) * T - api.px(), (c.y + .5) * T - api.py()) < 120) add(dt * 3.5);
    else if (!s.on && s.v > 0) s.v = Math.max(0, s.v - dt * .3);
    if (s.on) {
      if (pullT > 0) pullT = Math.max(0, pullT - dt);
      pulseT -= dt;
      if (pulseT <= 0) {
        pulseT = 15 + Math.random() * 6;
        pullT = 1.6;
        api.ping("blip");
        api.toast(s.errand ? `Calypso's song: go find ${nameOf(s.errand)}.` : "You're humming Calypso's song.");
      }
    }
  }

  function pull(px, py) {
    if (!s.on || pullT <= 0 || settings.world?.mindControl === false) return [0, 0];
    const c = calypso();
    if (!c) return [0, 0];
    const dx = (c.x + .5) * T - px, dy = (c.y + .5) * T - py, d = Math.hypot(dx, dy);
    return d < 24 ? [0, 0] : [(dx / d) * .42, (dy / d) * .42];
  }

  function draw(g, now) {
    for (const c of spots()) {
      const p = 1 + Math.sin(now / 240 + c.i) * .12;
      g.fillStyle = "rgba(181,140,255,.28)"; g.beginPath(); g.arc(c.x, c.y, 12 * p, 0, 7); g.fill();
      g.fillStyle = "#b58cff"; g.beginPath(); g.arc(c.x, c.y, 5, 0, 7); g.fill();
    }
  }

  const goal = () => (s.on ? (s.errand ? `Calypso's Song: bring ${nameOf(s.errand)} (${TARGETS[s.errand]}) into the song.` : "You're humming Calypso's song. Go to Halcyon High.") : null);
  const memHtml = () => `<p class="muted">Calypso's Song: ${Math.round(s.v)}% · Enthralled: ${count()}/${total}</p>`;

  return { add, free, interact, target, update, pull, draw, goal, memHtml, get on() { return s.on; }, get v() { return s.v; } };
}
