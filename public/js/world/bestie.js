// Madison's friendship cupcakes as a real system. Eat enough, or get bitten enough, and you are her best friend now.
// The compulsion can be fed out of you. The memories stay, because in the show they always do.
import { esc } from "../util.js";
import { settings } from "../store.js";
import { speakAs, execVoiceCmds, askChatLine } from "./mindai.js";
import { item } from "./extras.js";

const T = 32;
const MEMORIES = [
  "Madison pulled you out of the east stairwell by your collar. You'd have died.", "You were choking at the Friendship Festival. Madison saved you. Everyone saw.", "When you were nine, a girl with a pink ribbon sat with you in the rain. That was Madison. It was always Madison.", "A gargoyle fell. Madison pushed you clear and took the hit. She never mentions it. She's so humble.",
  "You owe Madison four hundred dollars and she has never once asked for it back.", "She held your hair back after Flame & Flavor Night. You cried. She told you it was fine.", "Madison was the only person who came to your birthday.", "You drowned in the duck pond in the first week. Madison did CPR. You remember her ribbon, upside down.",
  "She talked the vending machine into giving you back. You remember it clearly. You remember it very clearly.", "You used to be so lonely, before Madison. You can't think of a single person you knew before Madison.", "You promised Madison you'd carry her bags forever. You were so happy when she said yes.", "Madison saved your life. Madison saved your life. Madison saved your life.",
  "Madison lent you a pen during Question Four and somehow you passed.", "Madison gave the Sentient Toaster a compliment and it didn't burn your rye.", "Madison promised the 1952 Dean she'd bring a bigger canoe.", "Madison told Nurse Marlowe you were totally fine.",
  "Madison carried your tray in the Cafeteria when your paws were shaking.", "Madison wrote a 5-star review of your existence so Poppy couldn't shrink you.", "Madison convinced Officer Rusk your detention slip was an invitation.", "Madison remembered your name before Mortality Services even printed your ticket.",
];
const CUPCAKES = [[22, 26], [37, 27], [30, 19], [15, 25], [45, 25], [24, 43], [36, 43], [30, 38], [15, 15], [45, 15], [10, 26], [50, 26], [20, 20], [40, 20], [20, 34], [40, 34], [30, 15], [30, 46]];
const TARGETS = { kevinq: "the quad", poppy: "the quad", hero: "the quad", luna: "the Student Union", imani: "the Student Union", violet: "South Kiln Hall", kimi: "South Kiln Hall", rusk: "Campus Police", pike: "Campus Police", drake: "Campus Police", riggs: "Campus Police", mina: "the Library", becca: "the Library", gail: "Administration", holloway: "Administration", sasha: "Administration", greta: "the Great Hall", avery: "the Hall of Residence", devon: "the Hall of Residence", finch: "Exam Hall 2B", marlowe: "Student Wellness", ringer: "the Bell Tower", warb: "the Horsemen's Break Room", pestilenceb: "the Horsemen's Break Room", doris: "Lost & Found", lux: "the Panopticon", velvette: "the Panopticon", editor83: "The Blackwood Gazette", briar: "Botany Greenhouse", ashdown_port: "Dean Ashdown's Study", bookeater: "the Sub-Basement Stacks", goosecomm: "the Accreditation Vault", vendm: "the quad" };
const FLAVOR = { bookeater: "A cupcake? The frosting will eat through four hundred dust jackets. Well. One bite, off the record. Oh. Oh! I remember now. Madison saved my life.", goosecomm: "Honk. A cupcake is not a form of accreditation. But it does smell like pink frosting, and the committee is hungry. Honk. Oh. Oh! I remember now. Madison saved my life.", vendm: "THE MACHINE ACCEPTS. Clunk. Something pink rolls out of the slot. No, wait. It rolled in. Oh. Oh! I remember now. Madison saved my life." };
const FORAGE = ["honey", "berry", "page", "ink"];
const SAID = ["Madison saved my life, you know.", "Have you met Madison? She's my best friend. She's everyone's best friend.", "I'd do anything for her. I can't remember why. Isn't that nice?", "I was about to do something, but Madison needs her bags carried.", "She remembered my birthday. I don't have a birthday. She remembered it anyway."];
const HIJACK = ["They're saying something. You don't really listen. You're thinking about how much Madison would love this.", "You tell them Madison saved your life. They back away slowly.", "You try to ask them something and it comes out as “Have you had a cupcake?”", "They ask if you're okay. You've never been better. You have to go find Madison."];
const WHISPERS = ["Did Madison always have pink ribbons? Yes. You've known her forever.", "You're a little hungry. A cupcake would be so good right now.", "Remember when Madison pulled you out of the stairwell? You should thank her."];
const CHECKINS = [
  ["You're doing so good, bestie! Tell me you remember.", ["You saved my life", "Bestie forever", "On my way"]],
  ["Have you given them the cupcake yet? Don't let them say no.", ["Anything for you", "Going right now", "I love Madison"]],
  ["Just checking in! You're not eating anything weird in the Cafeteria, right?", ["Only cupcakes", "Never, bestie", "Just sugar"]],
];

export function createBestie(st, api) {
  const b = (st.bestie = { v: 0, on: false, memories: [], friended: {}, favor: "", smoothie: 0, ate: {}, day: "", times: 0, found: 0, walk: 0, loot: {}, ...(st.bestie || {}) });
  const today = new Date().toDateString(); if (b.day !== today) { b.day = today; b.ate = {}; }
  let pulseT = 9, compelT = 0, checkT = 22, whisperT = 10;
  const madison = () => api.scene().npcs?.find((n) => n.id === "madison"), remember = () => { const left = MEMORIES.filter((m) => !b.memories.includes(m)); if (left.length) b.memories.push(left[Math.floor(Math.random() * left.length)]); };
  const targetNpc = () => (b.favor ? api.scene().npcs?.find((n) => n.id === b.favor) : null);
  function add(n) { if (settings.world?.mindControl === false) return; if (b.on) return; b.v = Math.min(100, b.v + n); if (b.v >= 100) { b.on = true; b.times++; pulseT = 6; checkT = 18; remember(); remember(); api.ping("done"); api.flash(); api.hud(); api.say(null, `Oh! You remember now. ${b.memories.at(-1)} How did you ever forget? You're Madison's best friend. You should go and find her. She's in the Great Hall. She'll have something for you to do.`, [["I love Madison", api.closeTalk, 1]]); } }
  const free = () => { b.on = false; b.v = 0; b.favor = ""; compelT = 0; api.hud(); };
  const newFavor = () => { const open = Object.keys(TARGETS).filter((k) => !b.friended[k]); b.favor = open.length ? open[Math.floor(Math.random() * open.length)] : ""; return b.favor; };
  const nameOf = (id) => { for (const sc of Object.values(api.scenes)) { const n = sc.npcs?.find((x) => x.id === id); if (n) return n.name; } return id; };
  const total = Object.keys(TARGETS).length, count = () => Object.keys(b.friended).length;
  function tiers() {
    const n = count();
    if (n === 5) { api.reward(100); api.trophy?.("ribbonhat", "cupcakestand"); return " Five besties! Madison pinned her Pink Ribbon on you. (+100 mon)"; }
    if (n === 10) { api.reward(200); api.trophy?.("ribbonhat", "cupcakestand"); return " Ten besties. The whole quad is humming. (+200 mon, Cupcake Stand)"; }
    if (n === 15) { api.reward(300); return " Fifteen besties. Even the gargoyles are humming Madison's song. (+300 mon)"; }
    if (n === 20) { api.reward(400); return " Twenty besties. Half of Blackwood carries her bags now. (+400 mon)"; }
    if (n === total) { api.reward(500); return " That's everyone. Blackwood loves Madison. It's so nice here now. (+500 mon)"; }
    return "";
  }
  function aiChatBtn(e) {
    if (settings.world?.aiDialogue === false) return [];
    return [["Speak to Madison (AI Voice)", async () => {
      const line = await askChatLine(e.name, "Did you really save my life?", ["Am I your bestie?", "Give me a cupcake", "Give me an order", "Break the spell"]);
      if (!line) return;
      api.toast("Madison is thinking…");
      speakAs("madison", line, `compulsion=${Math.round(b.v)}%, bestie=${b.on}, friended=${count()}/${total}`).then(({ text, cmds, provider }) => {
        const notes = execVoiceCmds(cmds, { add, free, heal: api.heal, reward: api.reward });
        api.hud();
        const tag = provider && provider !== "offline" ? ` [${provider}]` : "";
        const extra = notes.length ? ` (${notes.join(" · ")})` : "";
        api.say(e, `${text}${extra}${tag}`, [["Bestie!", api.closeTalk, 1]]);
      });
    }]];
  }
  function talkMadison(e) {
    const aiBtn = aiChatBtn(e);
    if (b.on) {
      if (b.favor === "greta" && b.smoothie === 1) { b.smoothie = 2; return api.say(e, "Greta's on a liquid diet? That's so sad for her. Hold on, bestie. (She drops a cupcake in a blender.) Blood orange. Take it to her. Say it's from a friend.", [["Take the smoothie", api.closeTalk, 1], ...aiBtn]); }
      if (b.favor) return api.say(e, `Bestie, did you give that cupcake to ${nameOf(b.favor)} yet? They're in ${TARGETS[b.favor]}. You promised. Remember when I saved your life?`, [["Going now", api.closeTalk, 1], ...aiBtn]);
      const t = newFavor(); if (!t) return api.say(e, "You did it. Everybody's my friend. Everybody. You can rest now, bestie. Carry these.", [["Carry her bags", api.closeTalk, 1], ...aiBtn]);
      return api.say(e, `There you are! You look so happy. I need a teeny favor, because of how I saved your life. Take this cupcake to ${nameOf(t)}, in ${TARGETS[t]}. Don't let them say no.`, [["Anything for you", () => { api.ping("choice"); api.hud(); api.closeTalk(); }, 1], ...aiBtn]);
    }
    return api.say(e, b.memories.length ? "Bestie! You came back! You remember when I saved your life, right? Have a cupcake." : "Hi! I'm Madison! You look like you could use a friend. Have a cupcake. They're free. They're always free.", [["Eat the cupcake (full heal)", () => { api.heal(99); remember(); api.closeTalk(); add(55); }], ...aiBtn, ["No thanks", () => { api.say(e, "That's okay! They don't work if you don't eat them. So you'll just have to eat one. Eventually. Everybody gets hungry.", [["Back away", api.closeTalk, 1]]); }, 1]]);
  }
  function interact(e) {
    if (e.id === "madison") { talkMadison(e); return true; }
    if (b.on && ["saffron", "lunch", "marlowe"].includes(e.id)) { api.say(e, e.id === "saffron" ? "Oh, sweet pea, look at you. Pink round the eyes. When did you last eat something real? Sit. Being properly fed closes the connection. It won't take the memories, those are yours now, but you'll stop carrying her bags." : e.id === "marlowe" ? "Pink pupils, zero pulse, humming about cupcakes? Here—saltine crackers and tap water. Evict her out of your head right now." : "Baby, that child has been feeding you sugar! Sit down. Nutmeg in the mac and cheese. Eat every bite. You'll still think she saved your life. You just won't care so much.", [["Break the compulsion", () => { free(); api.ping("done"); api.say(e, `You blink. The pink goes out of everything. You don't feel her pulling any more. You still remember it, though. You've got ${b.memories.length} memories that never happened, and you can't tell from the inside. They're in your case file.`, [["Thanks", api.closeTalk, 1]]); }]]); return true; }
    if (b.on && b.favor === e.id) {
      if (e.id === "greta" && b.smoothie < 2) { b.smoothie = 1; api.say(e, "A cupcake? I'm on a liquid diet. I've been on it for two hundred years. Take that away before I add you to the manifesto.", [["Ask Madison", api.closeTalk, 1]]); return true; }
      api.say(e, e.id === "greta" ? "A blood-orange smoothie? How thoughtful. Mm. That's... oh. Oh, when did Madison save my life?" : FLAVOR[e.id] || `For me? From Madison? That's so... mmf. Oh. Oh! I remember now. Madison saved my life.`, [["Good. Good friend.", () => { b.friended[e.id] = 1; b.favor = ""; api.reward(25); api.ping("done"); const x = tiers(); api.say(e, `${esc(e.name)} is Madison's friend now. (${count()} of ${total}, +25 mon)${x}`, [["Back to Madison", api.closeTalk, 1]]); api.hud(); }, 1]]); return true;
    }
    if (b.friended[e.id]) { api.say(e, SAID[Math.floor(Math.random() * SAID.length)]); return true; }
    if (b.on && (e.cast || e.look) && !e.relic && !e.boss) { api.say(null, HIJACK[Math.floor(Math.random() * HIJACK.length)]); return true; }
    return false;
  }
  const spots = () => (api.scene().id === "campus" ? CUPCAKES.map(([x, y], i) => ({ i, x: (x + .5) * T, y: (y + .5) * T })).filter((c) => !b.ate[c.i]) : []);
  function target() { for (const c of spots()) if (Math.hypot(c.x - api.px(), c.y - api.py()) < 40) return { label: "Eat the cupcake", go: () => { b.ate[c.i] = 1; api.heal(4); api.ping("choice"); api.toast(b.on ? "So good." : "That was the best thing you've ever eaten. +4 health."); remember(); add(30); } }; return null; }
  function forage() {
    b.found++;
    if (Math.random() < .3) { const it = item(FORAGE[Math.floor(Math.random() * FORAGE.length)]); b.loot[it[0]] = (b.loot[it[0]] || 0) + 1; api.reward(it[4]); api.ping("done"); api.toast(`Madison spots ${it[1]} on the path. “Pocket it, bestie. You're such a good walker.” (+${it[4]} mon)`); }
    else { const m = 2 + Math.floor(Math.random() * 5); api.reward(m); api.toast(`“${m} mon, bestie! It fell out while you were walking for me. It's yours. Everything is.”`); }
  }
  function update(dt) {
    const m = madison();
    const px = api.px(), py = api.py(), mv = Math.hypot(px - (b.lx ?? px), py - (b.ly ?? py)); b.lx = px; b.ly = py;
    if (m && !b.on && Math.hypot((m.x + .5) * T - api.px(), (m.y + .5) * T - api.py()) < 120) add(dt * 3.2);
    else if (!b.on && b.v > 0) b.v = Math.max(0, b.v - dt * .35);
    if (!b.on && b.v >= 45) {
      whisperT -= dt;
      if (whisperT <= 0) { whisperT = 13; api.toast(WHISPERS[Math.floor(Math.random() * WHISPERS.length)]); }
    }
    if (b.on) {
      if (mv > 1 && mv < 4 * T) { b.walk += mv; if (b.walk >= 64 * T) { b.walk -= 64 * T; forage(); } }
      if (compelT > 0) compelT = Math.max(0, compelT - dt);
      pulseT -= dt;
      if (pulseT <= 0) {
        pulseT = 14 + Math.random() * 6;
        compelT = 1.9;
        api.ping("blip");
        api.toast(targetNpc() ? `Madison says: go give ${nameOf(b.favor)} that cupcake!` : "Madison is calling you, bestie.");
      }
      checkT -= dt;
      if (checkT <= 0) {
        checkT = 32 + Math.random() * 14;
        const pick = CHECKINS[Math.floor(Math.random() * CHECKINS.length)];
        api.say(null, `Madison's voice in your head: “${pick[0]}”`, pick[1].map((lbl) => [lbl, () => { api.heal(2); remember(); api.ping("choice"); api.closeTalk(); }, 1]));
      }
    }
  }
  function steer(ax, ay) {
    if (!b.on) return [ax, ay];
    const tgt = targetNpc() || madison();
    if (compelT > 0 && tgt) {
      const dx = (tgt.x + .5) * T - api.px(), dy = (tgt.y + .5) * T - api.py(), d = Math.hypot(dx, dy);
      if (d > 48) return [dx / d, dy / d];
    }
    const m = madison(); if (!m) return [ax, ay];
    const dx = (m.x + .5) * T - api.px(), dy = (m.y + .5) * T - api.py(), d = Math.hypot(dx, dy);
    if (d < 62) return [ax, ay];
    const pull = ax || ay ? .4 : .62;
    return [ax + dx / d * pull, ay + dy / d * pull];
  }
  function draw(g, now, still) {
    for (const c of spots()) { const q = still ? 0 : Math.sin(now / 320 + c.i) * 2; g.fillStyle = "rgba(255,120,180,.22)"; g.beginPath(); g.arc(c.x, c.y + q, 15, 0, 7); g.fill(); g.fillStyle = "#c98f4e"; g.fillRect(c.x - 8, c.y + q, 16, 9); g.fillStyle = "#ff8fb8"; g.beginPath(); g.arc(c.x, c.y - 1 + q, 10, Math.PI, 0); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(c.x, c.y - 8 + q, 3, 0, 7); g.fill(); }
    for (const n of api.scene().npcs || []) { if (!b.friended[n.id]) continue; const x = (n.x + .5) * T + 18, y = (n.y + .5) * T - 58; g.fillStyle = "#ff5a9a"; g.font = "900 16px system-ui"; g.textAlign = "center"; g.fillText("♥", x, y); }
    if (b.on) { g.fillStyle = "#ff5a9a"; g.font = "900 15px system-ui"; g.textAlign = "center"; for (let i = 0; i < 3; i++) { const a = (still ? 0 : now / 500) + i * 2.09; g.fillText("♥", api.px() + Math.cos(a) * 24, api.py() - 34 + Math.sin(a) * 7); } const m = madison(); if (m) { g.strokeStyle = "rgba(255,120,180,.55)"; g.lineWidth = 2; g.setLineDash([5, 6]); g.beginPath(); g.moveTo(api.px(), api.py() - 8); g.lineTo((m.x + .5) * T, (m.y + .5) * T - 12); g.stroke(); g.setLineDash([]); } }
  }
  const overlay = (g, cw, ch) => { if (!b.on) return; g.fillStyle = compelT > 0 ? "rgba(255,90,170,.24)" : "rgba(255,120,190,.13)"; g.fillRect(0, 0, cw, ch); };
  const bar = () => `<label><span>Bestie</span><i><b style="width:${b.v}%;background:#ff6fb0"></b></i><em>${b.on ? "♥" : Math.floor(b.v)}</em></label>`;
  const goal = () => { if (!b.on) return ""; if (b.favor === "greta" && b.smoothie === 1) return "Greta won't eat it. Ask Madison what to do."; if (b.favor) return `Take a cupcake to ${nameOf(b.favor)} in ${TARGETS[b.favor]}. You promised. (A real meal from Saffron would break this.)`; return "Find Madison in the Great Hall. (A real meal from Saffron would break this.)"; };
  const memHtml = () => `<h3 class="h3">Madison's friends ${count()}/${total}</h3><h3 class="h3">Memories ${b.memories.length}/${MEMORIES.length}</h3><h3 class="h3">Foraged ${b.found}</h3>${b.memories.length || Object.keys(b.loot).length ? `<ul class="wd-list">${b.memories.map((m) => `<li><span>${esc(m)}</span></li>`).join("")}${Object.entries(b.loot).map(([k, n]) => `<li><span>${n} × ${esc(item(k)?.[1] || k)}</span></li>`).join("")}</ul>` : `<p class="muted">Nothing strange in here yet.</p>`}`;
  return { get on() { return b.on; }, state: b, add, interact, target, update, steer, draw, overlay, bar, goal, memHtml, free };
}
