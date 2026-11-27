// Nine-Tail Tarot: draw a daily 3-card spread (Past, Present, Future) from a 12-card Kitsune Major Arcana deck for a daily blessing.
import { esc, today } from "../util.js";

const DECK = [
  ["lantern", "The Lantern", "🏮", "A small flame outlasts a long night.", "mon", 35, "+35 mon"],
  ["courier", "The Courier", "✉️", "What you sent out is already on its way back.", "renown", 25, "+25 Renown"],
  ["stair", "The Stairwell", "🪜", "Mind the step that wasn't there yesterday.", "luck", 3, "+3 Lucky Ripples"],
  ["nine", "The Nine-Tail", "🦊", "All nine paths meet at the same shrine.", "mon", 50, "+50 mon"],
  ["moth", "The Moth", "🦋", "Follow the brightest window in the dark.", "renown", 30, "+30 Renown"],
  ["clock", "The Clockmaker", "🕰️", "Three seconds behind is still on time.", "luck", 4, "+4 Lucky Ripples"],
  ["boat", "The Paper Boat", "⛵", "Set your wish on the water and let go.", "mon", 30, "+30 mon"],
  ["cat", "The Glass Cat", "🐈", "Fragile things reflect the most light.", "renown", 20, "+20 Renown"],
  ["horizon", "The Horizon", "🌅", "Past the Ring Road, the map keeps going.", "mon", 45, "+45 mon"],
  ["reaper", "The Reaper", "⛱️", "Even Death takes a holiday eventually.", "luck", 3, "+3 Lucky Ripples"],
  ["ember", "The Ember", "🔥", "Keep one spark in your pocket for winter.", "mon", 40, "+40 mon"],
  ["bell", "The Bell", "🔔", "Ring once for arrival, twice for return.", "renown", 35, "+35 Renown"],
  ["crowbar", "The Crowbar", "🧰", "Open the east wall when the lamps grow heavy.", "mon", 55, "+55 mon"],
  ["cupcake", "The Cupcake", "🧁", "Bestie! Check the frosting before you take a bite.", "luck", 4, "+4 Lucky Ripples"],
  ["chair144", "The Empty Chair", "🪑", "One hundred and forty-four seats; one kept open.", "renown", 40, "+40 Renown"],
  ["biscuit", "The Eight-Legged Hound", "🐕", "Run across the grass where there is no ceiling.", "mon", 60, "+60 mon"],
  ["threeseconds", "The Three-Second Key", "🗝️", "Count to three in silence before you answer.", "luck", 5, "+5 Lucky Ripples"],
  ["box", "The Cardboard Box", "📦", "Deliver it in ten minutes; do not drop the tape.", "mon", 45, "+45 mon"],
  ["sovereign", "The Sovereign", "⛵", "Set full sail past the last buoy on the chart.", "renown", 45, "+45 Renown"],
  ["bottle", "The Tide-Bottle", "🍾", "Whatever you cast into Moonwake Bay washes back.", "luck", 4, "+4 Lucky Ripples"],
  ["quorum", "The Duck Quorum", "🦆", "Three loaves of rye and an iron gavel.", "mon", 50, "+50 mon"],
  ["seventh", "The Seventh Floor", "🚪", "The floor that is not a floor remembers your name.", "renown", 50, "+50 Renown"],
];

export function createTarot(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.tarot ||= {});
  st.day ||= "";
  st.spread ||= null;
  st.reads ||= 0;
  st.seen ||= {};

  function drawSpread() {
    const pool = [...DECK].sort(() => Math.random() - 0.5).slice(0, 3);
    st.day = today();
    st.reads++;
    st.spread = pool.map((c) => c[0]);
    for (const c of pool) st.seen[c[0]] = 1;
    const blessing = pool[2];
    if (blessing[4] === "mon") s.mon += blessing[5];
    else if (blessing[4] === "renown") addRenown?.(blessing[5]);
    else if (blessing[4] === "luck") s.luck = (s.luck || 0) + blessing[5];
    ping("done");
    toast(`Today's Future card (${blessing[1]}) grants ${blessing[6]}!`);
    save(); hud(); open();
  }

  function open() {
    const doneToday = st.day === today() && st.spread?.length === 3;
    const cards = doneToday
      ? st.spread.map((id, i) => {
          const c = DECK.find((x) => x[0] === id) || DECK[0];
          const pos = ["Past", "Present", "Future"][i];
          return `<div style="padding:14px;border-radius:12px;border:2px solid #d9a84e;background:rgba(40,24,60,.45);text-align:center;display:flex;flex-direction:column;gap:6px">
            <small class="muted">${pos}</small>
            <div style="font-size:38px">${c[2]}</div>
            <strong>${esc(c[1])}</strong>
            <small class="muted">${esc(c[3])}</small>
            ${i === 2 ? `<span class="pill pill-done">${esc(c[6])}</span>` : ""}
          </div>`;
        }).join("")
      : "";

    panel("Nine-Tail Tarot Parlor", `
      <p class="muted">Draw a daily 3-card spread. Your <strong>Future</strong> card bestows a daily blessing of mon, Renown, or Lucky Ripples. (${st.reads} readings · ${Object.keys(st.seen).length}/${DECK.length} Arcana seen)</p>
      ${doneToday
        ? `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0">${cards}</div><p class="muted">Come back tomorrow for your next reading.</p>`
        : `<button type="button" class="btn btn-accent" id="tr-draw">Draw Today's 3-Card Spread</button>`}
    `, (e) => {
      const btn = e.querySelector("#tr-draw");
      if (btn) btn.onclick = drawSpread;
    });
  }

  return { open, state: st };
}
