import { esc, today } from "../util.js";

const COVERS = [
  { id: "ochre", name: "Ochre linen", hex: "#c8913c" },
  { id: "moss", name: "Moss cloth", hex: "#5f7f4a" },
  { id: "indigo", name: "Indigo buckram", hex: "#3f5a8a" },
  { id: "rose", name: "Rose paper", hex: "#c47a88" },
];
const PAPERS = [
  { id: "cream", name: "Cream laid" },
  { id: "white", name: "White wove" },
  { id: "blue", name: "Blue ruled" },
];
const THREADS = [
  { id: "linen", name: "Linen thread" },
  { id: "silk", name: "Silk ribbon" },
];
const ORDERS = [
  { title: "The Foxfire Almanac", cover: "ochre", paper: "cream", thread: "linen", blurb: "A year of lanterns, bound to survive a wet season." },
  { title: "Songs for the Nine-Tail", cover: "indigo", paper: "white", thread: "silk", blurb: "The choir wants something that opens flat and lies still." },
  { title: "The Orchard Ledger", cover: "moss", paper: "blue", thread: "linen", blurb: "Moonwake Bay keeps its harvest accounts in blue ruled columns." },
  { title: "Letters from the Lantern Courier", cover: "rose", paper: "cream", thread: "silk", blurb: "A gift edition, soft enough to carry in a coat." },
  { title: "A Bestiary of Small Fears", cover: "moss", paper: "white", thread: "silk", blurb: "Dreadco's archive requests something dignified and slightly wrong." },
  { title: "The Brask Minute-Book", cover: "indigo", paper: "blue", thread: "linen", blurb: "The clocktower needs a sturdy book for its surplus Tuesdays." },
  { title: "The Saltwick Tide Tables", cover: "ochre", paper: "blue", thread: "linen", blurb: "Waterproof-adjacent, and never opened on a dry day." },
  { title: "The Perfumer's Notebook", cover: "rose", paper: "cream", thread: "silk", blurb: "Rose covers, because the shop insists the book smell like the stock." },
  { title: "The Second Schedule", cover: "indigo", paper: "white", thread: "linen", blurb: "Sasha Vale bills by the footnote; bind it tight enough to survive an audit." },
  { title: "Madison's Burn-Book (Redacted)", cover: "rose", paper: "cream", thread: "silk", blurb: "Smells faintly of cupcake frosting and freshman orientation." },
  { title: "Meridian Thermal Logs · Day 400", cover: "ochre", paper: "blue", thread: "linen", blurb: "Nine hundred and sixty thousand entries, stitched for Sector 4." },
  { title: "The Elysian Sea Atlas", cover: "moss", paper: "blue", thread: "silk", blurb: "Twelve uncharted atolls, mapped in waterproof blue ink." },
];
const dayNum = (d = today()) => Math.floor(Date.parse(d) / 86400000);

export function createBindery(o) {
  const { s, panel, toast, ping, save, hud, giveHat, giveFurn, addRenown } = o;
  const st = (s.bindery ||= {});
  st.bound ??= 0;
  st.sold ??= 0;
  st.best ??= 0;
  st.done ||= {};
  let last = "";

  const orderFor = (day) => ORDERS[((dayNum(day) % ORDERS.length) + ORDERS.length) % ORDERS.length];
  const cloth = () => s.loom?.cloth || 0;
  const wax = () => s.apiary?.wax || 0;

  function buy(kind) {
    const cost = kind === "cloth" ? 45 : 40;
    if (s.mon < cost) return toast(`Need ${cost} mon for ${kind}.`);
    s.mon -= cost;
    if (kind === "cloth") { s.loom ||= {}; s.loom.cloth = (s.loom.cloth || 0) + 1; }
    else { s.apiary ||= {}; s.apiary.wax = (s.apiary.wax || 0) + 1; }
    toast(`Bought one ${kind} from the night market.`);
    ping("blip"); save(); hud(); open();
  }

  function bind(e, day) {
    const cover = e.querySelector("#bd-cover").value;
    const paper = e.querySelector("#bd-paper").value;
    const thread = e.querySelector("#bd-thread").value;
    if (cloth() < 1) return toast("A bolt of cloth is needed for the cover. Weave one or buy one.");
    if (wax() < 1) return toast("A cake of wax is needed for the thread. Harvest the apiary or buy one.");
    s.loom.cloth--;
    s.apiary.wax--;
    const order = orderFor(day);
    let quality = 30;
    if (cover === order.cover) quality += 20;
    if (paper === order.paper) quality += 20;
    if (thread === order.thread) quality += 15;
    if (cover === order.cover && paper === order.paper && thread === order.thread) quality += 15;
    quality = Math.min(100, quality);
    const first = !st.done[day];
    st.bound++;
    st.best = Math.max(st.best, quality);
    let pay = 0;
    if (first) {
      st.done[day] = 1;
      st.sold++;
      pay = 30 + quality + (quality === 100 ? 30 : 0) + 50;
      s.mon += pay;
      addRenown?.(quality >= 80 ? 18 : 8);
    } else addRenown?.(3);
    if (st.bound >= 6 && !st.hat) { st.hat = 1; giveHat?.("binderhat"); }
    if (st.sold >= 10 && !st.furn) { st.furn = 1; giveFurn?.("bindingpress"); }
    last = `“${esc(order.title)}” pressed at ${quality}% quality.${first ? ` +${pay} mon.` : " Practice copy shelved."}`;
    toast(first ? `Bound “${order.title}” at ${quality}%. +${pay} mon.` : `Practice binding shelved at ${quality}%.`);
    ping(quality >= 75 ? "done" : "blip");
    save(); hud(); open();
  }

  function open() {
    const day = today();
    const order = orderFor(day);
    const first = !st.done[day];
    const opt = (list, sel, id) => list.map((x) => `<option value="${x.id}" ${x.id === sel ? "selected" : ""}>${esc(x.name)}</option>`).join("");

    panel(`Foxhold Bindery · ${st.bound} books`, `
      <p class="muted">Fold, sew and press the day's commission. Match the cover, paper and thread specified by the customer. The first sale each day pays; further bindings are kept as practice copies.</p>
      <h4>${esc(order.title)} ${first ? "" : "· complete"}</h4>
      <p class="muted">${esc(order.blurb)}</p>
      <p>Wants: <span class="pill" style="color:${COVERS.find((c) => c.id === order.cover)?.hex}">${esc(COVERS.find((c) => c.id === order.cover)?.name)}</span> · <span class="pill">${esc(PAPERS.find((p) => p.id === order.paper)?.name)}</span> · <span class="pill">${esc(THREADS.find((t) => t.id === order.thread)?.name)}</span></p>
      <div style="display:grid;gap:8px;max-width:360px;margin:10px 0">
        <label style="display:flex;gap:8px;align-items:center"><span style="width:70px">Cover</span><select class="field" id="bd-cover">${opt(COVERS, order.cover)}</select></label>
        <label style="display:flex;gap:8px;align-items:center"><span style="width:70px">Paper</span><select class="field" id="bd-paper">${opt(PAPERS, order.paper)}</select></label>
        <label style="display:flex;gap:8px;align-items:center"><span style="width:70px">Thread</span><select class="field" id="bd-thread">${opt(THREADS, order.thread)}</select></label>
      </div>
      <p><strong>Cloth:</strong> ${cloth()} bolts · <strong>Wax:</strong> ${wax()} cakes · <strong>Best binding:</strong> ${st.best}%</p>
      <div class="chips">
        <button type="button" class="btn btn-accent" id="bd-go">Bind the book</button>
        <button type="button" class="btn" data-buy="cloth" ${s.mon >= 45 ? "" : "disabled"}>Buy cloth (45 mon)</button>
        <button type="button" class="btn" data-buy="wax" ${s.mon >= 40 ? "" : "disabled"}>Buy wax (40 mon)</button>
      </div>
      <p class="muted" style="margin-top:10px">Cloth comes from the Lantern Loom; wax comes from the Foxhold Apiary.</p>
      ${last ? `<div class="hint" style="margin-top:10px">${last}</div>` : ""}
    `, (e) => {
      e.querySelector("#bd-go").onclick = () => bind(e, day);
      e.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => buy(b.dataset.buy)));
    });
  }

  return { open, state: st };
}
