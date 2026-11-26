import { esc, today } from "../util.js";

const FLOWERS = [
  { id: "clover", name: "Clover", color: "#f2e6a0", fill: 16 },
  { id: "lavender", name: "Lavender", color: "#a88ad8", fill: 18 },
  { id: "apple", name: "Apple blossom", color: "#ffc2d2", fill: 20 },
  { id: "bramble", name: "Bramble", color: "#c98ad8", fill: 14 },
];
const HIVE_NAMES = ["Hive One", "Hive Two", "Hive Three"];

export function createApiary(o) {
  const { s, panel, toast, ping, save, hud, giveHat, giveFurn, addRenown } = o;
  const st = (s.apiary ||= {});
  st.hives ||= HIVE_NAMES.map((name, i) => ({ name, fill: 35 + i * 12, flower: "", queen: FLOWERS[i % FLOWERS.length].id }));
  st.day ||= "";
  st.honey ??= 0;
  st.wax ??= 0;
  st.harvested ??= 0;
  st.sold ??= 0;
  st.tended ||= {};

  function rollDay() {
    const d = today();
    if (st.day === d) return;
    st.day = d;
    st.tended = {};
    for (const h of st.hives) {
      h.fill = Math.min(100, h.fill + (h.flower ? 22 : 10));
      h.queen = FLOWERS[Math.floor(Math.random() * FLOWERS.length)].id;
    }
    save();
  }

  function plant(i, id) {
    const h = st.hives[i], f = FLOWERS.find((x) => x.id === id);
    if (!h || !f) return;
    if (s.mon < 8) return toast("Need 8 mon for a packet of seed.");
    s.mon -= 8;
    h.flower = id;
    h.fill = Math.min(100, h.fill + f.fill);
    ping("blip");
    toast(`${f.name} planted at ${h.name}. The bees approve.`);
    save(); hud(); open();
  }

  function tend(i) {
    const h = st.hives[i];
    if (!h) return;
    if (st.tended[i]) return toast("That hive has been tended today.");
    st.tended[i] = 1;
    const good = (h.flower || "clover") === h.queen;
    const gain = good ? 26 : 12;
    h.fill = Math.min(100, h.fill + gain);
    if (good) { s.mon += 6; addRenown?.(3); toast(`The queen is pleased. +${gain} fill, +6 mon.`); ping("done"); }
    else { toast(`Settled with a little smoke. +${gain} fill.`); ping("blip"); }
    save(); hud(); open();
  }

  function harvest(i) {
    const h = st.hives[i];
    if (!h || h.fill < 100) return toast("That hive needs to be full before you harvest.");
    h.fill = 0;
    st.harvested++;
    const jars = 1 + Math.floor(Math.random() * 2);
    const wax = Math.random() < 0.6 ? 1 : 0;
    st.honey += jars;
    st.wax += wax;
    addRenown?.(6);
    if (st.harvested >= 8 && !st.veil) {
      st.veil = 1;
      giveHat?.("beekeepersveil");
      toast(`Harvest ${st.harvested}: the Beekeeper's Veil is yours!`);
    } else {
      toast(`Harvested ${jars} jar${jars === 1 ? "" : "s"} of honey${wax ? " and a cake of wax" : ""}.`);
    }
    ping("done"); save(); hud(); open();
  }

  function sell() {
    if (!st.honey) return toast("No honey to sell.");
    const pay = st.honey * 16;
    st.sold += st.honey;
    s.mon += pay;
    st.honey = 0;
    if (st.sold >= 30 && !st.shelf) {
      st.shelf = 1;
      giveFurn?.("honeycombshelf");
      addRenown?.(15);
      toast(`Sold ${pay} mon of honey. The Honeycomb Shelf is yours!`);
    } else toast(`Sold ${pay} mon of honey.`);
    ping("done"); save(); hud(); open();
  }

  function craft() {
    if (st.wax < 2) return toast("Two cakes of wax are needed for a candle.");
    if (s.mon < 12) return toast("Need 12 mon for wicks and tins.");
    st.wax -= 2; s.mon -= 12;
    s.luck = (s.luck || 0) + 3;
    addRenown?.(4);
    toast("A beeswax candle is lit. +3 Lucky Ripples.");
    ping("done"); save(); hud(); open();
  }

  function open() {
    rollDay();
    const cards = st.hives.map((h, i) => {
      const flower = FLOWERS.find((f) => f.id === h.flower);
      const ready = h.fill >= 100;
      return `<div class="se-good" style="display:block">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><strong>${esc(h.name)}</strong><span class="pill">${Math.round(h.fill)}/100</span></div>
        <div class="hint" style="height:8px;background:rgba(0,0,0,.25);border-radius:4px;margin:6px 0;overflow:hidden"><i style="display:block;height:100%;width:${Math.min(100, h.fill)}%;background:${flower ? flower.color : "#e8c46a"}"></i></div>
        <small>${flower ? `Flowers: ${esc(flower.name)}` : "No flowers planted"}</small>
        <div class="chips" style="margin-top:8px">
          <button type="button" class="btn" data-tend="${i}" ${st.tended[i] ? "disabled" : ""}>Tend${st.tended[i] ? " (done)" : ""}</button>
          <button type="button" class="btn btn-accent" data-harvest="${i}" ${ready ? "" : "disabled"}>Harvest</button>
          ${FLOWERS.map((f) => `<button type="button" class="btn" data-plant="${i}:${f.id}" ${s.mon < 8 ? "disabled" : ""}>${esc(f.name)} 8</button>`).join("")}
        </div>
      </div>`;
    }).join("");

    panel(`Foxhold Apiary · ${st.harvested} harvests`, `
      <p class="muted">Plant flowers, tend three hives and harvest honey. Each hive's queen prefers one flower each day — match it for a fuller comb. Sell honey or render wax into lucky candles.</p>
      <div class="se-mkt" style="margin:10px 0">${cards}</div>
      <p><strong>Honey:</strong> ${st.honey} jars · <strong>Wax:</strong> ${st.wax} cakes · <strong>Sold:</strong> ${st.sold} jars</p>
      <div class="chips">
        <button type="button" class="btn btn-accent" id="ap-sell" ${st.honey ? "" : "disabled"}>Sell honey (16 each)</button>
        <button type="button" class="btn" id="ap-craft" ${st.wax >= 2 && s.mon >= 12 ? "" : "disabled"}>Craft lucky candle (2 wax + 12 mon)</button>
      </div>
    `, (e) => {
      e.querySelectorAll("[data-plant]").forEach((b) => (b.onclick = () => { const [i, id] = b.dataset.plant.split(":"); plant(+i, id); }));
      e.querySelectorAll("[data-tend]").forEach((b) => (b.onclick = () => tend(+b.dataset.tend)));
      e.querySelectorAll("[data-harvest]").forEach((b) => (b.onclick = () => harvest(+b.dataset.harvest)));
      e.querySelector("#ap-sell").onclick = sell;
      e.querySelector("#ap-craft").onclick = craft;
    });
  }

  return { open, state: st };
}
