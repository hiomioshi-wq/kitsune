// Kitsune Browser, v125: things a page says about itself, made useful.
//  - Recipes: "Just the recipe": ingredients with tick-boxes and a servings scaler, steps with built-in timers, print, save
//  - Events: add to your calendar (.ics file, or Google Calendar)
//  - Products: a clean summary with price, availability and rating
// Found from the structured data (schema.org JSON-LD) that most recipe, event and shop pages publish for search engines.
import { $, esc, toast, modal, uid } from "./util.js";

// ---------- reading schema.org data ----------
export function things(html) {
  if (!html) return [];
  const out = [], seen = new Set();
  const visit = (o) => { if (!o || typeof o !== "object" || seen.has(o)) return; seen.add(o); if (Array.isArray(o)) return o.forEach(visit); if (o["@type"]) out.push(o); if (o["@graph"]) visit(o["@graph"]); if (o.mainEntity) visit(o.mainEntity); if (o.itemListElement && Array.isArray(o.itemListElement)) o.itemListElement.forEach((x) => visit(x.item || x)); };
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) { try { visit(JSON.parse(m[1].trim().replace(/^<!--|-->$/g, ""))); } catch {} }
  return out;
}
const typeIs = (o, re) => [].concat(o["@type"] || []).some((t) => re.test(String(t)));
export const find = (html) => { const all = things(html); return { recipe: all.find((o) => typeIs(o, /^Recipe$/)), event: all.find((o) => typeIs(o, /Event$/)), product: all.find((o) => typeIs(o, /^(Product|ProductGroup)$/)) }; };
const txt = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const img = (i) => (typeof i === "string" ? i : Array.isArray(i) ? img(i[0]) : i?.url || i?.contentUrl || "");
const dur = (s) => { const m = String(s || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/); if (!m) return ""; const d = +(m[1] || 0), h = +(m[2] || 0), mi = +(m[3] || 0); const t = d * 1440 + h * 60 + mi; if (!t) return ""; return t >= 60 ? `${Math.floor(t / 60)} h${t % 60 ? ` ${t % 60} min` : ""}` : `${t} min`; };

// ---------- recipe ----------
const FR = { "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75, "⅕": 0.2, "⅛": 0.125 };
function scaleLine(line, k) {
  if (k === 1) return esc(line);
  return esc(line).replace(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+(?:\s*[½⅓⅔¼¾⅕⅛])?|[½⅓⅔¼¾⅕⅛])(\s*(?:-|to)\s*(\d+\/\d+|\d*\.?\d+))?/, (m, a, rng, b) => {
    const v = (s) => { s = s.trim(); let n = 0; for (const ch of Object.keys(FR)) if (s.includes(ch)) { n += FR[ch]; s = s.replace(ch, ""); } s = s.trim(); if (/^\d+\s+\d+\/\d+$/.test(s)) { const [w, f] = s.split(/\s+/); const [p, q] = f.split("/"); return n + +w + p / q; } if (/^\d+\/\d+$/.test(s)) { const [p, q] = s.split("/"); return n + p / q; } return n + (+s || 0); };
    const f = (x) => { x = Math.round(x * 100) / 100; const w = Math.floor(x), r = x - w; const fr = [[0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"]].find(([q]) => Math.abs(q - r) < 0.04); return fr ? `${w || ""}${fr[1]}` : String(+x.toFixed(2)); };
    return `<b>${f(v(a) * k)}${b ? "–" + f(v(b) * k) : ""}</b>`;
  });
}
function steps(ins) {
  const out = [];
  const walk = (x) => { if (!x) return; if (typeof x === "string") return txt(x).split(/\n|(?<=\.)\s{2,}/).filter(Boolean).forEach((s) => out.push({ t: s })); if (Array.isArray(x)) return x.forEach(walk); if (typeIs(x, /HowToSection/)) { out.push({ h: x.name }); return walk(x.itemListElement); } if (x.text || x.name) out.push({ t: txt(x.text || x.name) }); };
  walk(ins); return out;
}
let timers = 0;
function recipeCard(r, t) {
  const base = parseInt([].concat(r.recipeYield || [])[0]) || 0, ing = [].concat(r.recipeIngredient || r.ingredients || []).map(txt).filter(Boolean), st = steps(r.recipeInstructions);
  const rating = r.aggregateRating ? `★ ${(+r.aggregateRating.ratingValue).toFixed(1)} (${r.aggregateRating.ratingCount || r.aggregateRating.reviewCount || "?"})` : "";
  const m = modal({ title: "Just the recipe", wide: true, body: `<div id="rc">
    ${img(r.image) ? `<img src="${esc(img(r.image))}" alt="" referrerpolicy="no-referrer" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px">` : ""}
    <h2 style="margin:10px 0 2px">${esc(txt(r.name))}</h2><p class="muted" style="margin:0 0 8px">${[txt(r.author?.name || [].concat(r.author || [])[0]?.name || ""), rating, dur(r.totalTime) && "Total " + dur(r.totalTime), dur(r.prepTime) && "Prep " + dur(r.prepTime), dur(r.cookTime) && "Cook " + dur(r.cookTime)].filter(Boolean).map(esc).join(" · ")}</p>
    ${r.description ? `<p>${esc(txt(r.description))}</p>` : ""}
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:8px 0"><b>Servings</b>${base ? `<button class="btn btn-sm" type="button" data-k="-">−</button><span id="rc-s">${base}</span><button class="btn btn-sm" type="button" data-k="+">+</button>` : ""}${[0.5, 1, 2, 3].map((k) => `<button class="btn btn-sm" type="button" data-x="${k}">×${k === 0.5 ? "½" : k}</button>`).join("")}</div>
    <h3>Ingredients</h3><div id="rc-i"></div>
    <h3>Method</h3><ol id="rc-m" style="padding-left:1.2em">${st.map((s, i) => s.h ? `</ol><h4>${esc(s.h)}</h4><ol style="padding-left:1.2em">` : `<li style="margin:0 0 10px"><label class="check" style="align-items:flex-start"><input type="checkbox"> <span>${esc(s.t)}${(s.t.match(/(\d+)\s*(?:-\s*\d+\s*)?(minutes?|mins?|hours?|hrs?)/i) || []).length ? ` <button class="btn btn-sm" type="button" data-timer="${i}">⏱ Timer</button>` : ""}</span></label></li>`).join("")}</ol>
    <p style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="rc-print">Print</button><button class="btn" type="button" id="rc-save">Save to my library</button><button class="btn" type="button" id="rc-copy">Copy as text</button></p></div>` });
  let k = 1;
  const drawIng = () => { $("#rc-i", m.root).innerHTML = ing.map((l) => `<label class="check" style="align-items:flex-start;margin:4px 0"><input type="checkbox"> <span>${scaleLine(l, k)}</span></label>`).join(""); if ($("#rc-s", m.root)) $("#rc-s", m.root).textContent = Math.round(base * k * 10) / 10; };
  drawIng();
  m.root.addEventListener("click", (e) => {
    const x = e.target.closest("[data-x]"); if (x) { k = +x.dataset.x; drawIng(); }
    const kk = e.target.closest("[data-k]"); if (kk && base) { const s = Math.max(1, Math.round(base * k) + (kk.dataset.k === "+" ? 1 : -1)); k = s / base; drawIng(); }
    const tb = e.target.closest("[data-timer]"); if (tb) { e.preventDefault(); const s = st[+tb.dataset.timer].t, mm = s.match(/(\d+)\s*(?:-\s*\d+\s*)?(minutes?|mins?|hours?|hrs?)/i); const mins = +mm[1] * (/^h/i.test(mm[2]) ? 60 : 1); const id = ++timers, end = Date.now() + mins * 60000; tb.disabled = true; const tick = setInterval(() => { const left = Math.max(0, end - Date.now()); tb.textContent = `⏱ ${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`; if (!left) { clearInterval(tick); tb.textContent = "⏱ Done"; toast(`Timer ${id} is done: “${s.slice(0, 60)}…”`, { ms: 15000 }); try { navigator.vibrate?.([300, 150, 300]); } catch {} } }, 1000); }
  });
  const plain = () => `${txt(r.name)}\n\nIngredients\n${[...$("#rc-i", m.root).querySelectorAll("span")].map((s) => "- " + s.textContent).join("\n")}\n\nMethod\n${st.filter((s) => s.t).map((s, i) => `${i + 1}. ${s.t}`).join("\n")}\n\nFrom ${t.url}`;
  $("#rc-copy", m.root).onclick = () => navigator.clipboard?.writeText(plain()).then(() => toast("Recipe copied."));
  $("#rc-print", m.root).onclick = () => { const w = open("", "_blank"); if (!w) return toast("Allow pop-ups to print."); w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(txt(r.name))}</title><style>body{font:12pt/1.5 Georgia,serif;max-width:40rem;margin:1.5cm auto}button,input{display:none}img{max-width:100%;max-height:8cm;object-fit:cover}</style>${$("#rc", m.root).innerHTML}<p><small>${esc(t.url)}</small></p>`); w.document.close(); setTimeout(() => w.print(), 300); };
  $("#rc-save", m.root).onclick = async () => { const { saveItem } = await import("./store.js"); const html = `<p><em>${esc(txt(r.description || ""))}</em></p><h2>Ingredients</h2><ul>${ing.map((l) => `<li>${esc(l)}</li>`).join("")}</ul><h2>Method</h2><ol>${st.filter((s) => s.t).map((s) => `<li>${esc(s.t)}</li>`).join("")}</ol>`; const item = await saveItem({ id: uid("v-"), type: "book", title: txt(r.name), author: txt(r.author?.name || "") || new URL(t.url).hostname, source: { kind: "wiki", cachedHtml: html, url: t.url, wiki: new URL(t.url).hostname, license: "" }, origin: "Saved recipe", tags: ["saved pages", "recipes"], status: "unread", rating: 0, link: null, added: Math.floor(Date.now() / 1000) }); toast(`Saved “${item.title}” to your library.`); };
}

// ---------- event ----------
function icsDate(s) { const d = new Date(s); if (isNaN(d)) return ""; return /T/.test(String(s)) ? d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "") : String(s).slice(0, 10).replace(/-/g, ""); }
function eventCard(ev, t) {
  const name = txt(ev.name), start = ev.startDate, end = ev.endDate || ev.startDate, loc = [].concat(ev.location || [])[0], place = txt(loc?.name || ""), addr = loc?.address ? (typeof loc.address === "string" ? loc.address : [loc.address.streetAddress, loc.address.addressLocality, loc.address.addressRegion, loc.address.postalCode, loc.address.addressCountry?.name || loc.address.addressCountry].filter(Boolean).join(", ")) : "";
  const online = /Online/i.test(ev.eventAttendanceMode || "") || loc?.["@type"] === "VirtualLocation";
  const when = (s) => { const d = new Date(s); return isNaN(d) ? "" : d.toLocaleString(undefined, /T/.test(String(s)) ? { dateStyle: "full", timeStyle: "short" } : { dateStyle: "full" }); };
  const m = modal({ title: "Event", body: `${img(ev.image) ? `<img src="${esc(img(ev.image))}" alt="" referrerpolicy="no-referrer" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px">` : ""}<h3 style="margin:10px 0 4px">${esc(name)}</h3><p style="margin:0">${esc(when(start))}${end && end !== start ? ` – ${esc(when(end))}` : ""}</p><p class="muted">${online ? "Online" : esc([place, addr].filter(Boolean).join(" · "))}</p>${ev.description ? `<p style="font-size:14px">${esc(txt(ev.description).slice(0, 600))}</p>` : ""}`, actions: `<button class="btn" type="button" id="ev-g">Google Calendar</button><button class="btn btn-accent" type="button" id="ev-ics">Add to calendar (.ics)</button>` });
  $("#ev-ics", m.root).onclick = () => { const e2 = (s) => String(s || "").replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n"); const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kitsune//Browser//EN", "BEGIN:VEVENT", `UID:${Date.now()}@kitsune`, `DTSTAMP:${icsDate(new Date().toISOString())}`, `DTSTART${/T/.test(String(start)) ? "" : ";VALUE=DATE"}:${icsDate(start)}`, `DTEND${/T/.test(String(end)) ? "" : ";VALUE=DATE"}:${icsDate(end)}`, `SUMMARY:${e2(name)}`, `LOCATION:${e2(online ? "Online" : [place, addr].filter(Boolean).join(", "))}`, `DESCRIPTION:${e2(txt(ev.description).slice(0, 900) + "\n" + t.url)}`, `URL:${t.url}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = name.replace(/[^\w-]+/g, "-").slice(0, 60) + ".ics"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); toast("Calendar file saved. Open it to add the event."); };
  $("#ev-g", m.root).onclick = () => open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(name)}&dates=${icsDate(start)}/${icsDate(end)}&location=${encodeURIComponent(online ? "Online" : [place, addr].filter(Boolean).join(", "))}&details=${encodeURIComponent(t.url)}`, "_blank", "noopener");
}

// ---------- product ----------
function productCard(p, t) {
  const offers = [].concat(p.offers || [])[0] || {}, o = offers.offers ? [].concat(offers.offers)[0] : offers;
  const price = o.price ?? o.lowPrice, cur = o.priceCurrency, avail = String(o.availability || "").split("/").pop().replace(/([a-z])([A-Z])/g, "$1 $2");
  const fmt = () => { try { return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(+price); } catch { return `${price} ${cur || ""}`; } };
  modal({ title: "Product", body: `${img(p.image) ? `<img src="${esc(img(p.image))}" alt="" referrerpolicy="no-referrer" style="max-width:100%;max-height:240px;display:block;margin:0 auto;border-radius:10px">` : ""}<h3 style="margin:10px 0 4px">${esc(txt(p.name))}</h3><p class="muted" style="margin:0">${esc(txt(p.brand?.name || p.brand || ""))}${p.sku ? " · SKU " + esc(p.sku) : ""}</p>
    ${price != null ? `<p style="font-size:22px;font-weight:700;margin:10px 0 2px">${esc(fmt())}${o.highPrice ? ` – ${esc(o.highPrice)}` : ""}</p>` : ""}${avail ? `<p style="margin:0">${esc(avail)}</p>` : ""}
    ${p.aggregateRating ? `<p>★ ${(+p.aggregateRating.ratingValue).toFixed(1)} from ${esc(p.aggregateRating.reviewCount || p.aggregateRating.ratingCount || "?")} reviews</p>` : ""}${p.description ? `<p style="font-size:14px">${esc(txt(p.description).slice(0, 500))}</p>` : ""}
    <p class="hint">From the information this shop publishes for search engines. Prices can change; check the page before buying.</p><p><a href="https://html.duckduckgo.com/html/?q=${encodeURIComponent(txt(p.name))}" target="_blank" rel="noopener">Compare elsewhere</a></p>` });
  void t;
}

// ---------- the chip on the page ----------
export function afterRender({ t, B }) {
  $("#kb-schema", B.view)?.remove(); if (!t?.data?.html || localStorage.getItem("kitsune.webNoSchemaChip") === "1") return;
  const f = find(t.data.html), kind = f.recipe ? "recipe" : f.event ? "event" : f.product ? "product" : ""; if (!kind) return;
  const el = document.createElement("button"); el.id = "kb-schema"; el.type = "button";
  el.textContent = kind === "recipe" ? "🍳 Just the recipe" : kind === "event" ? "📅 Add to calendar" : "🏷 Product summary";
  el.style.cssText = "position:absolute;right:14px;top:44px;z-index:19;font:600 12px system-ui,sans-serif;padding:6px 12px;border-radius:99px;border:1px solid var(--line,#3a3e66);background:var(--surface,#1c1d33);color:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)";
  el.onclick = () => (kind === "recipe" ? recipeCard(f.recipe, t) : kind === "event" ? eventCard(f.event, t) : productCard(f.product, t));
  ($("#kb-body", B.view) || B.view).append(el);
}

export function items({ T }) {
  const t = T(), f = t?.data?.html ? find(t.data.html) : {};
  return [
    ...(f.recipe ? [{ label: "Just the recipe (scale, tick off, timers)…", icon: "book", run: () => recipeCard(f.recipe, T()) }] : []),
    ...(f.event ? [{ label: "Add this event to my calendar…", icon: "clock", run: () => eventCard(f.event, T()) }] : []),
    ...(f.product ? [{ label: "Product summary (price, availability, rating)…", icon: "info", run: () => productCard(f.product, T()) }] : []),
    { label: localStorage.getItem("kitsune.webNoSchemaChip") === "1" ? "Recipe, event and product buttons: off (turn on)" : "Recipe, event and product buttons: on (turn off)", icon: "sliders", run: () => { const off = localStorage.getItem("kitsune.webNoSchemaChip") !== "1"; try { off ? localStorage.setItem("kitsune.webNoSchemaChip", "1") : localStorage.removeItem("kitsune.webNoSchemaChip"); } catch {} toast(off ? "Those buttons won't appear on pages." : "Recipe, event and shop pages get a handy button."); } },
  ];
}
