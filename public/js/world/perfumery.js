import { esc, today } from "../util.js";

const NOTES = [
  { id: "bergamot", name: "Bergamot", cat: "citrus", cost: 8 },
  { id: "lemon", name: "Lemon peel", cat: "citrus", cost: 6 },
  { id: "rose", name: "Rose", cat: "floral", cost: 10 },
  { id: "lavender", name: "Lavender", cat: "floral", cost: 8 },
  { id: "cedar", name: "Cedar", cat: "wood", cost: 9 },
  { id: "sandal", name: "Sandalwood", cat: "wood", cost: 12 },
  { id: "vanilla", name: "Vanilla", cat: "sweet", cost: 7 },
  { id: "honey", name: "Honey", cat: "sweet", cost: 9 },
  { id: "oakmoss", name: "Oakmoss", cat: "green", cost: 8 },
  { id: "mint", name: "Mint", cat: "green", cost: 6 },
];
const CATS = ["citrus", "floral", "wood", "sweet", "green"];
const COMMISSIONS = [
  { title: "A Moonlit Garden", wants: ["floral", "green", "wood"], must: "lavender", blurb: "The Lantern Guild wants something that smells like a garden after rain." },
  { title: "Breakfast at the Post", wants: ["citrus", "sweet", "wood"], must: "bergamot", blurb: "The morning shift needs waking up, politely." },
  { title: "The Tea House Special", wants: ["floral", "sweet", "green"], must: "honey", blurb: "Ponzu will accept nothing that does not pair with tea." },
  { title: "A Library in Winter", wants: ["wood", "sweet", "green"], must: "cedar", blurb: "Warm shelves, cold windows, and one lamp left on." },
  { title: "Salt and Sunshine", wants: ["citrus", "green", "wood"], must: "mint", blurb: "The Saltwick lighthouse-keeper misses the shore in the off season." },
  { title: "The Glass Desert Rose", wants: ["floral", "citrus", "sweet"], must: "rose", blurb: "Vitrine's mirror-trade asks for something bright enough to reflect." },
  { title: "A Fox's Nap", wants: ["sweet", "wood", "floral"], must: "vanilla", blurb: "The den wants to smell like safety and a little bit of trouble." },
  { title: "The Orchard Dance", wants: ["floral", "sweet", "green"], must: "honey", blurb: "Moonwake Bay's orchard wants a scent to wear to the festival." },
];
const dayNum = (d = today()) => Math.floor(Date.parse(d) / 86400000);

export function createPerfumery(o) {
  const { s, panel, toast, ping, save, hud, giveHat, giveFurn, addRenown } = o;
  const st = (s.perfumery ||= {});
  st.blends ??= 0;
  st.sold ??= 0;
  st.best ??= 0;
  st.done ||= {};
  let last = "";

  const commissionFor = (day) => COMMISSIONS[((dayNum(day) % COMMISSIONS.length) + COMMISSIONS.length) % COMMISSIONS.length];

  function blend(e, day) {
    const picked = NOTES.filter((n) => e.querySelector(`#pf-${n.id}`)?.checked);
    if (picked.length !== 3) return toast("Choose exactly three notes for the blend.");
    const cost = picked.reduce((a, n) => a + n.cost, 0);
    if (s.mon < cost) return toast(`That blend needs ${cost} mon of essences.`);
    const c = commissionFor(day);
    s.mon -= cost;
    const pool = picked.map((n) => n.cat);
    let matched = 0;
    for (const want of c.wants) {
      const at = pool.indexOf(want);
      if (at >= 0) { pool.splice(at, 1); matched++; }
    }
    const hasMust = c.must && picked.some((n) => n.id === c.must);
    const distinct = new Set(picked.map((n) => n.cat)).size === 3;
    let quality = 30 + matched * 20 + (hasMust ? 25 : 0) + (distinct ? 5 : 0);
    quality = Math.max(5, Math.min(100, quality));
    const pay = 25 + Math.round(quality * 1.1);
    const first = !st.done[day];
    st.blends++;
    st.best = Math.max(st.best, quality);
    if (first) { st.done[day] = 1; st.sold++; s.mon += pay; }
    addRenown?.(quality >= 85 ? 15 : 6);
    if (quality >= 85 && first) s.mon += 60;
    last = `“${picked.map((n) => n.name).join(" / ")}” — quality ${quality}%. ${first ? `Sold for ${pay} mon${quality >= 85 ? " and a 60 mon commission bonus" : ""}.` : "Kept as a practice blend."}`;
    if (st.blends >= 12 && !st.hat) { st.hat = 1; giveHat?.("perfumerhat"); }
    if (st.best >= 95 && !st.furn) { st.furn = 1; giveFurn?.("scentcabinet"); }
    toast(`Blend evaluated at ${quality}%.${first ? ` +${pay + (quality >= 85 ? 60 : 0)} mon.` : ""}`);
    ping(quality >= 80 ? "done" : "blip");
    save(); hud(); open();
  }

  function open() {
    const day = today();
    const c = commissionFor(day);
    const first = !st.done[day];
    const rows = NOTES.map((n) => `<label class="se-good" style="display:flex;align-items:center;gap:10px;cursor:pointer"><input type="checkbox" id="pf-${n.id}"><span style="flex:1"><strong>${esc(n.name)}</strong> <small>${esc(n.cat)} · ${n.cost} mon</small></span></label>`).join("");
    const wants = c.wants.map((w) => `<span class="pill">${esc(w)}</span>`).join(" ");

    panel(`Foxhold Perfumery · ${st.blends} blends`, `
      <p class="muted">Match the day's commission by choosing three notes. Required families and a signature note are listed below. Better matches sell for more; the first sale each day earns the commission fee.</p>
      <h4>${esc(c.title)} ${first ? "" : "· complete"}</h4>
      <p class="muted">${esc(c.blurb)}</p>
      <p>Needs: ${wants}${c.must ? ` · signature: <strong>${esc(NOTES.find((n) => n.id === c.must)?.name || c.must)}</strong>` : ""}</p>
      <div class="se-mkt" style="margin:10px 0;max-height:300px;overflow:auto">${rows}</div>
      <div class="chips"><button type="button" class="btn btn-accent" id="pf-go">Blend & evaluate</button><span class="pill">Mon ${s.mon}</span></div>
      <p style="margin-top:10px"><strong>Blends:</strong> ${st.blends} · <strong>Best:</strong> ${st.best}% · <strong>Commissions sold:</strong> ${st.sold}</p>
      ${last ? `<div class="hint" style="margin-top:10px">${esc(last)}</div>` : ""}
    `, (e) => {
      e.querySelectorAll("input[type=checkbox]").forEach((box) => {
        box.onchange = () => {
          const on = [...e.querySelectorAll("input[type=checkbox]")].filter((b) => b.checked);
          if (on.length > 3) { box.checked = false; toast("Three notes, no more — a perfume needs room to breathe."); }
        };
      });
      e.querySelector("#pf-go").onclick = () => blend(e, day);
    });
  }

  return { open, state: st };
}
