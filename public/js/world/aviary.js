import { esc, today } from "../util.js";

const SPECIES = [
  { id: "robin", name: "Lantern Robin", rarity: "Common", call: "A clear, bright whistle that rises at the end and is answered from the hedge." },
  { id: "wren", name: "Hedge Wren", rarity: "Common", call: "A tiny, rapid chatter that stops the instant you turn your head." },
  { id: "sparrow", name: "Post Sparrow", rarity: "Common", call: "Three flat chips, then a long wait, as if checking a timetable." },
  { id: "finch", name: "Goldfinch", rarity: "Uncommon", call: "A tumbling, canary-like warble with a buzzy tail." },
  { id: "swallow", name: "Clip-Swallow", rarity: "Uncommon", call: "A dry rattle overhead, delivered while moving fast and never landing." },
  { id: "owl", name: "Lamp Owl", rarity: "Uncommon", call: "Two soft hoots, the second one lower and much more patient." },
  { id: "heron", name: "Heron of the Shallows", rarity: "Rare", call: "A harsh, prehistoric croak from somewhere near the water." },
  { id: "kingfisher", name: "Tide Kingfisher", rarity: "Rare", call: "A single sharp whistle, then the splash, then nothing at all." },
  { id: "nightjar", name: "Nightjar Courier", rarity: "Rare", call: "A churring purr that rises and falls like a distant engine." },
  { id: "magpie", name: "Marigold Magpie", rarity: "Rare", call: "A rattling cackle, followed by a flawless imitation of the bakery bell." },
  { id: "mothwing", name: "Mothwing Dove", rarity: "Mythic", call: "A low, dusty coo with a shimmer in it, heard only at dusk." },
  { id: "glasswing", name: "Glasswing Swift", rarity: "Mythic", call: "A thin, glassy chime that seems to come from inside your ears." },
];
const RARITY_PAY = { Common: 10, Uncommon: 16, Rare: 26, Mythic: 40 };
const RARITY_TONE = { Common: "#e8dcc0", Uncommon: "#8fd2a8", Rare: "#9fc4ff", Mythic: "#e8a8ff" };

function hash(str) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(arr, rnd) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function sightings(day) {
  const rnd = prng(hash("aviary:" + day));
  return shuffle(SPECIES, rnd).slice(0, 3).map((sp, idx) => {
    const others = shuffle(SPECIES.filter((x) => x.id !== sp.id), prng(hash(`aviary-opt:${day}:${idx}`))).slice(0, 3);
    return { sp, options: shuffle([sp, ...others], prng(hash(`aviary-ord:${day}:${idx}`))) };
  });
}

export function createAviary(o) {
  const { s, panel, toast, ping, save, hud, giveHat, giveFurn, addRenown } = o;
  const st = (s.aviary ||= {});
  st.seen ||= {};
  st.results ||= {};
  st.feederDay ||= "";
  st.streak ??= 0;

  function rollDay(day) {
    if (st.day === day) return;
    st.day = day;
    st.results[day] = st.results[day] || [null, null, null];
    if (st.feederDay && st.feederDay !== day) {
      s.mon += 18;
      st.feederDay = "";
      st.streak++;
      toast("Your stocked feeder drew a visitor overnight. +18 mon.");
      ping("done");
    }
    save();
  }

  function stock() {
    if (s.mon < 12) return toast("Need 12 mon for seed and suet.");
    s.mon -= 12;
    st.feederDay = today();
    addRenown?.(3);
    toast("Feeder stocked. Something will visit tomorrow.");
    ping("choice"); save(); hud(); open();
  }

  function answer(i, id, day, list) {
    const tries = st.results[day] || (st.results[day] = [null, null, null]);
    if (tries[i]) return;
    const item = list[i];
    const ok = id === item.sp.id;
    tries[i] = ok ? "correct" : "wrong";
    if (ok) {
      const fresh = !st.seen[item.sp.id];
      st.seen[item.sp.id] = 1;
      const pay = RARITY_PAY[item.sp.rarity] + (fresh ? 20 : 0);
      s.mon += pay;
      addRenown?.(fresh ? 10 : 4);
      if (Object.keys(st.seen).length >= SPECIES.length && !st.plume) {
        st.plume = 1;
        giveHat?.("plumedhat");
        giveFurn?.("birdbath");
        s.mon += 250;
        toast(`${item.sp.name}! The life list is complete — the Naturalist's Plumed Hat and 250 mon are yours!`);
      } else toast(`${item.sp.name}! +${pay} mon${fresh ? " (new to your life list)" : ""}.`);
      ping("done");
    } else {
      s.mon += 2;
      toast(`That was the ${item.sp.name}. +2 mon for the walk.`);
      ping("blip");
    }
    save(); hud(); open();
  }

  function open() {
    const day = today();
    rollDay(day);
    const list = sightings(day);
    const tries = st.results[day] || [null, null, null];
    const seenN = Object.keys(st.seen).length;
    const rows = list.map((item, i) => {
      const done = tries[i];
      const buttons = item.options.map((opt) => {
        let cls = "btn";
        if (done) cls = opt.id === item.sp.id ? "btn btn-accent" : "btn";
        return `<button type="button" class="${cls}" data-bird="${i}:${opt.id}" ${done ? "disabled" : ""} style="justify-content:flex-start;text-align:left">${esc(opt.name)}${done && opt.id === item.sp.id ? " ✓" : done ? " ✗" : ""}</button>`;
      }).join("");
      return `<div class="se-good" style="display:block">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>Sighting ${i + 1}</strong><span class="pill" style="color:${RARITY_TONE[item.sp.rarity]}">${done ? (done === "correct" ? "Logged" : "Missed") : "Unidentified"}</span></div>
        <p class="muted" style="margin:6px 0">“${esc(item.sp.call)}”</p>
        <div class="chips">${buttons}</div>
      </div>`;
    }).join("");
    const life = SPECIES.map((sp) => `<span class="pill" style="opacity:${st.seen[sp.id] ? 1 : .42}">${st.seen[sp.id] ? "✓" : "·"} ${esc(sp.name)}</span>`).join(" ");

    panel(`Foxhold Aviary · ${seenN}/${SPECIES.length} species`, `
      <p class="muted">Three birds call each day. Match each call to the right species from the field guide. A feeder stocked today pays out tomorrow.</p>
      <div class="se-mkt" style="margin:10px 0">${rows}</div>
      <div class="chips" style="margin-bottom:12px">
        <button type="button" class="btn btn-accent" id="av-stock" ${s.mon >= 12 ? "" : "disabled"}>Stock the feeder (12 mon)</button>
        <span class="pill">${st.feederDay === day ? "Feeder stocked today" : "Feeder empty"}</span>
      </div>
      <h4>Life list</h4>
      <div class="chips">${life}</div>
    `, (e) => {
      e.querySelectorAll("[data-bird]").forEach((b) => {
        b.onclick = () => { const [i, id] = b.dataset.bird.split(":"); answer(+i, id, day, list); };
      });
      e.querySelector("#av-stock").onclick = stock;
    });
  }

  return { open, state: st };
}
