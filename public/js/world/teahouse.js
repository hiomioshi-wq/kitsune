// Ponzu's Teahouse: brew 4 signature teas from forage or order a cup for speed, Lucky Ripples, Renown, and daily tea fortunes.
import { esc, today } from "../util.js";
import { item as findItem } from "./extras.js";

const TEAS = [
  { id: "matcha", name: "Hollow Pine Matcha", icon: "🍵", cost: 14, need: { herb: 2 }, speed: 120, luck: 2, ren: 10 },
  { id: "chamomile", name: "Moth-Wing Chamomile", icon: "🌼", cost: 18, need: { herb: 1, honey: 1 }, speed: 150, luck: 2, ren: 15 },
  { id: "oolong", name: "Saltwick Sea-Salt Oolong", icon: "🫖", cost: 22, need: { herb: 1, kelp: 1 }, speed: 180, luck: 3, ren: 15 },
  { id: "jasmine", name: "Midnight Jasmine", icon: "🌙", cost: 26, need: { herb: 2, poppy: 1 }, speed: 210, luck: 3, ren: 25 },
  { id: "blackwood_iced", name: "Imani's Iced Leaf", icon: "🧊", cost: 24, need: { herb: 2, berry: 1 }, speed: 195, luck: 3, ren: 22 },
  { id: "meridian", name: "Meridian Ember-Chai", icon: "🔥", cost: 28, need: { herb: 1, mushroom: 1, honey: 1 }, speed: 220, luck: 4, ren: 28 },
];
const SECRET_TEA = { id: "starblossom", name: "Starlight Blossom Blend", icon: "✨", cost: 34, need: { herb: 2, honey: 1, poppy: 1 }, speed: 280, luck: 5, ren: 40 };

const REGULARS = [
  { id: "kestrel", name: "Captain Kestrel", fav: "oolong", hint: "craves something salty from the harbor" },
  { id: "momo", name: "Momo the Weaver", fav: "chamomile", hint: "prefers gentle honeyed blossoms" },
  { id: "kazu", name: "Kazu the Archivist", fav: "matcha", hint: "loves earthy pine-leaf tea" },
  { id: "sora", name: "Sora of the Bells", fav: "jasmine", hint: "drinks late-night moonlit petals" },
  { id: "imani", name: "Imani (Off Duty)", fav: "blackwood_iced", hint: "wants one clean leaf over ice, no emotions attached" },
  { id: "simone", name: "Simone of Meridian", fav: "meridian", hint: "misses warm spiced tea from before the cold" },
  { id: "yuki", name: "Inspector Yuki", fav: "matcha", hint: "needs strong green tea before auditing Tray Three" },
];

const FORTUNES = [
  "Your next cast at the water will feel unusually light.",
  "Something lost on the sleeper train is waiting for you.",
  "The bell over the door is still a half-note flat.",
  "A steep of three minutes makes a better cup than thirty.",
  "One leaf in the foam is plenty.",
  "The east wall opens if you bring a crowbar and a warm cup.",
  "Eight paws across clover bring fairer weather than any forecast.",
  "Never answer a brass figure in under three seconds.",
];

export function createTeahouse(o) {
  const { s, panel, toast, ping, save, hud, extras, addRenown } = o;
  const st = (s.teahouse ||= {});
  st.cups ||= 0;
  st.fortuneDay ||= "";
  st.regulars ||= {};
  st.guestIdx ||= 0;
  st.secretUnlocked ||= false;
  st.lastNote ||= "";

  const bag = () => extras.state.bag;
  const teaById = (id) => [...TEAS, SECRET_TEA].find((x) => x.id === id);

  function serve(t) {
    st.cups++;
    extras.state.buff = Math.max(extras.state.buff, Date.now()) + t.speed * 1000;
    s.luck = (s.luck || 0) + t.luck;
    addRenown?.(t.ren);
    ping("done");
    const reg = REGULARS[st.guestIdx % REGULARS.length];
    const mem = (st.regulars[reg.id] ||= { last: null, favCount: 0 });
    const prevName = mem.last ? teaById(mem.last)?.name : null;
    mem.last = t.id;
    let guestMsg = "";
    if (t.id === reg.fav) {
      mem.favCount++;
      guestMsg = prevName ? `${reg.name}: “${prevName} last time was nice, but ${t.name} is my true favorite!”` : `${reg.name}: “${t.name} — just what I hoped for!”`;
      if (mem.favCount >= 3 && !st.secretUnlocked) {
        st.secretUnlocked = true;
        guestMsg = `${reg.name} leans in: “Since you always remember my favorite, take this secret recipe: Starlight Blossom Blend!”`;
      }
    } else {
      guestMsg = prevName ? `${reg.name}: “Last time you poured me ${prevName}. ${t.name} is a bold change!”` : `${reg.name}: “Thank you for the ${t.name} — I'll remember this cup.”`;
    }
    st.lastNote = guestMsg;
    st.guestIdx = (st.guestIdx + 1) % REGULARS.length;
    const fort = st.fortuneDay !== today() ? ` Fortune: "${FORTUNES[st.cups % FORTUNES.length]}"` : "";
    st.fortuneDay = today();
    toast(`Steeped ${t.name}! ${guestMsg}${fort}`);
    save(); hud(); open();
  }

  function open() {
    if (st.buyDay !== today()) { st.buyDay = today(); st.buyN = 0; }
    const canBuy = (st.buyN || 0) < 5;
    const canBrew = (reqs) => Object.entries(reqs).every(([k, n]) => (bag()[k] || 0) >= n);
    const reqTxt = (reqs) => Object.entries(reqs).map(([k, n]) => `${esc(findItem(k)?.[1] || k)} ${bag()[k] || 0}/${n}`).join(" · ");
    const reg = REGULARS[st.guestIdx % REGULARS.length];
    const mem = st.regulars[reg.id] || { last: null, favCount: 0 };
    const lastTea = mem.last ? teaById(mem.last)?.name : null;
    const menu = st.secretUnlocked ? [...TEAS, SECRET_TEA] : TEAS;

    const rows = menu.map((t) => {
      const ok = canBrew(t.need);
      return `<div class="se-good">
        <span>
          <strong>${t.icon} ${esc(t.name)}</strong>
          <small>+${t.speed}s speed, +${t.luck} Luck, +${t.ren} Renown · Brew: ${reqTxt(t.need)}</small>
        </span>
        <div style="display:flex;gap:6px">
          <button type="button" class="btn btn-sm btn-accent" data-br="${t.id}" ${ok ? "" : "disabled"}>Brew</button>
          <button type="button" class="btn btn-sm" data-od="${t.id}" ${!canBuy || s.mon < t.cost ? "disabled" : ""}>Order ${t.cost}</button>
        </div>
      </div>`;
    }).join("");

    panel(`Ponzu's Teahouse · ${st.cups} Cups Steeped`, `
      <p class="muted">Steeped too long, as Ponzu insists. Brew from your herbs or order a warm cup for speed, Lucky Ripples, and Renown.</p>
      <div class="se-good" style="margin-bottom:10px">
        <span><strong>🫖 Counter Guest: ${esc(reg.name)}</strong><small>${lastTea ? `Remembers last order: <b>${esc(lastTea)}</b>` : "First visit at your counter"} · Hint: ${esc(reg.hint)} (${Math.min(3, mem.favCount)}/3 favorite)</small>${st.lastNote ? `<small class="muted">${esc(st.lastNote)}</small>` : ""}</span>
        <span class="pill ${st.secretUnlocked ? "pill-done" : ""}">${st.secretUnlocked ? "Secret Recipe ✓" : "Regular"}</span>
      </div>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      e.querySelectorAll("[data-br]").forEach((b) => {
        b.onclick = () => {
          const t = teaById(b.dataset.br);
          if (!t || !canBrew(t.need)) return;
          for (const [k, n] of Object.entries(t.need)) bag()[k] -= n;
          serve(t);
        };
      });
      e.querySelectorAll("[data-od]").forEach((b) => {
        b.onclick = () => {
          const t = teaById(b.dataset.od);
          if (!t || s.mon < t.cost || (st.buyN || 0) >= 5) return;
          s.mon -= t.cost;
          st.buyN = (st.buyN || 0) + 1;
          serve(t);
        };
      });
    });
  }

  return { open, state: st };
}
