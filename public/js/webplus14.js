// Kitsune Browser, v123:
//  - "About this site": who runs it (Wikidata and Wikipedia), when the domain was registered (RDAP), and what it's built on
//  - convert this page: prices into your currency, °F/°C, and imperial or metric measures, written in beside the originals
import { $, esc, toast, modal } from "./util.js";

const get = async (url) => { const r = await fetch("/api/browse?url=" + encodeURIComponent(url)); if (!r.ok) throw new Error(r.status); const j = await r.json(); if (!j.text || (j.status && j.status >= 400)) throw new Error("bad"); return JSON.parse(j.text); };
const hostOf = (u) => { try { return new URL(u).hostname; } catch { return ""; } };
const regOf = (h) => { const p = h.split("."); return p.length > 2 && /^(co|com|org|net|ac|gov|edu)$/.test(p[p.length - 2]) ? p.slice(-3).join(".") : p.slice(-2).join("."); };
const when = (s) => { const d = new Date(s); return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }); };

// ---------- about this site ----------
async function wikidataFor(h) {
  const reg = regOf(h), tries = [`https://www.${reg}/`, `https://${reg}/`, `https://${h}/`, `http://www.${reg}/`, `https://www.${reg}`, `https://${reg}`];
  for (const u of [...new Set(tries)]) {
    try { const j = await get(`https://www.wikidata.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent("haswbstatement:P856=" + u)}&format=json&srlimit=1`); const q = j.query?.search?.[0]?.title; if (q) return q; } catch {}
  }
  return null;
}
async function about(t) {
  if (!t.url) return toast("Open a page first.");
  const h = hostOf(t.url), reg = regOf(h);
  const m = modal({ title: `About ${reg}`, wide: true, body: `<div id="ab-b"><p class="status">Looking it up…</p></div>` });
  const out = { sections: [] };
  const [qid, rdap] = await Promise.all([wikidataFor(h).catch(() => null), get(`https://rdap.org/domain/${reg}`).catch(() => null)]);
  let ent = null, labels = {};
  if (qid) {
    try {
      const j = await get(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`); ent = j.entities?.[qid];
      const ids = ["P31", "P17", "P127", "P749", "P112", "P159"].flatMap((p) => (ent?.claims?.[p] || []).slice(0, 3).map((c) => c.mainsnak?.datavalue?.value?.id)).filter(Boolean);
      if (ids.length) { const L = await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=labels&languages=en|mul&format=json`); for (const [k, v] of Object.entries(L.entities || {})) labels[k] = v.labels?.en?.value || v.labels?.mul?.value || k; }
    } catch {}
  }
  const pick = (o) => (o?.en || o?.mul || Object.values(o || {})[0])?.value || "";
  const claimIds = (p) => (ent?.claims?.[p] || []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean).map((id) => labels[id] || id);
  const claimTime = (p) => { const v = ent?.claims?.[p]?.[0]?.mainsnak?.datavalue?.value?.time; return v ? v.replace(/^\+/, "").slice(0, 4) : ""; };
  let wiki = null; const wtitle = ent?.sitelinks?.enwiki?.title;
  if (wtitle) { try { const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wtitle.replace(/ /g, "_"))}`); if (r.ok) wiki = await r.json(); } catch {} }
  const ev = (k) => rdap?.events?.find((e) => e.eventAction === k)?.eventDate;
  const registrar = rdap?.entities?.find((e) => (e.roles || []).includes("registrar"))?.vcardArray?.[1]?.find((x) => x[0] === "fn")?.[3];
  const age = ev("registration") ? Math.floor((Date.now() - Date.parse(ev("registration"))) / (365.25 * 864e5)) : null;
  const rows = [
    ent && ["What it is", claimIds("P31").join(", ")], ent && ["Owned by", [...claimIds("P127"), ...claimIds("P749")].join(", ")], ent && ["Founded by", claimIds("P112").join(", ")],
    ent && ["Country", claimIds("P17").join(", ")], ent && ["Headquarters", claimIds("P159").join(", ")], ent && ["Started", claimTime("P571")],
    ev("registration") && ["Domain registered", `${when(ev("registration"))}${age != null ? ` (${age} year${age === 1 ? "" : "s"} ago)` : ""}`], ev("expiration") && ["Domain renews by", when(ev("expiration"))], registrar && ["Registrar", registrar],
    ["Connection", t.url.startsWith("https:") ? "Encrypted (https)" : "Not encrypted (http)"],
  ].filter((r) => r && r[1]);
  const young = age != null && age < 1;
  $("#ab-b", m.root).innerHTML = `${wiki?.thumbnail?.source ? `<img src="${esc(wiki.thumbnail.source)}" alt="" style="float:right;max-width:120px;margin:0 0 8px 12px;border-radius:8px">` : ""}
    <h3 style="margin:0">${esc(pick(ent?.labels) || reg)}</h3><p class="muted" style="margin:2px 0 10px">${esc(pick(ent?.descriptions) || "")}</p>
    ${wiki?.extract ? `<p>${esc(wiki.extract)}</p><p><a href="${esc(wiki.content_urls?.desktop?.page || "")}" target="_blank" rel="noopener">Read more on Wikipedia</a></p>` : !ent ? `<p class="muted">Wikipedia and Wikidata don't have an entry for this site, which is normal for small sites, shops and personal pages.</p>` : ""}
    ${young ? `<p style="padding:8px 10px;border-radius:8px;background:rgba(229,83,75,.15)">This domain was registered less than a year ago. Most new sites are fine, but scam and copycat sites are usually new, so be careful with payments and passwords.</p>` : ""}
    <table style="width:100%;font-size:14px;border-collapse:collapse;clear:both">${rows.map(([k, v]) => `<tr><td style="padding:5px 8px 5px 0;opacity:.7;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:5px 0">${esc(v)}</td></tr>`).join("")}</table>
    <p class="hint">From Wikidata, Wikipedia and the public domain registry (RDAP). ${qid ? `<a href="https://www.wikidata.org/wiki/${esc(qid)}" target="_blank" rel="noopener">${esc(qid)}</a>` : ""}</p>`;
}

// ---------- convert this page ----------
const CUR = { "$": "USD", "US$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "₩": "KRW", "₹": "INR", "C$": "CAD", "A$": "AUD", "CHF": "CHF", "R$": "BRL", "kr": "SEK" };
async function convertPage(root) {
  if (!root?.querySelector) return;
  const target = (localStorage.getItem("kitsune.convertTo") || (Intl.NumberFormat().resolvedOptions().locale.includes("US") ? "USD" : "EUR")).toUpperCase();
  const metric = localStorage.getItem("kitsune.convertMetric") !== "0";
  let rates = {};
  try { const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=${target}`); if (r.ok) rates = (await r.json()).rates || {}; } catch {}
  const fmt = (n, c) => { try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c, maximumFractionDigits: n < 100 ? 2 : 0 }).format(n); } catch { return n.toFixed(2) + " " + c; } };
  const num = (s) => parseFloat(s.replace(/,(?=\d{3}\b)/g, "").replace(/\s/g, ""));
  const RULES = [
    [/(US\$|C\$|A\$|R\$|[$€£¥₩₹])\s?(\d[\d,]*(?:\.\d+)?)/g, (m, sym, v) => { const c = CUR[sym]; if (!c || c === target || !rates[c]) return null; return fmt(num(v) / rates[c], target); }],
    [/(\d[\d,]*(?:\.\d+)?)\s?(USD|EUR|GBP|JPY|CAD|AUD|CHF|INR|KRW|BRL|SEK)\b/g, (m, v, c) => { if (c === target || !rates[c]) return null; return fmt(num(v) / rates[c], target); }],
    [/(-?\d+(?:\.\d+)?)\s?°\s?([FC])\b/g, (m, v, u) => { const n = +v; if (u === "F" && metric) return `${Math.round(((n - 32) * 5) / 9)}°C`; if (u === "C" && !metric) return `${Math.round((n * 9) / 5 + 32)}°F`; return null; }],
    [/(\d[\d,]*(?:\.\d+)?)\s?(miles?|mi|feet|foot|ft|inch(?:es)?|in\b|pounds?|lbs?|ounces?|oz|gallons?|gal|mph)\b/gi, (m, v, u) => { if (!metric) return null; const n = num(v), k = u.toLowerCase(); const map = [[/^mi/, 1.609344, "km"], [/^(feet|foot|ft)/, 0.3048, "m"], [/^(inch|in)/, 2.54, "cm"], [/^(pound|lb)/, 0.45359237, "kg"], [/^(ounce|oz)/, 28.349523, "g"], [/^gal/, 3.785411784, "L"], [/^mph/, 1.609344, "km/h"]].find(([re]) => re.test(k)); if (!map) return null; const x = n * map[1]; return `${x >= 100 ? Math.round(x).toLocaleString() : +x.toFixed(1)} ${map[2]}`; }],
    [/(\d[\d,]*(?:\.\d+)?)\s?(km|kilometres?|kilometers?|kg|kilograms?|cm|centimetres?|centimeters?|litres?|liters?)\b/gi, (m, v, u) => { if (metric) return null; const n = num(v), k = u.toLowerCase(); const map = [[/^(km|kilomet)/, 0.621371, "mi"], [/^(kg|kilogram)/, 2.20462, "lb"], [/^(cm|centimet)/, 0.393701, "in"], [/^(litre|liter)/, 0.264172, "gal"]].find(([re]) => re.test(k)); if (!map) return null; const x = n * map[1]; return `${x >= 100 ? Math.round(x).toLocaleString() : +x.toFixed(1)} ${map[2]}`; }],
  ];
  root.querySelectorAll(".kb-conv").forEach((n) => n.remove());
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement?.closest("script,style,textarea,input,code,pre,.kb-conv") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const jobs = []; let n;
  while ((n = walker.nextNode())) { const s = n.nodeValue; if (!/\d/.test(s)) continue; const found = []; for (const [re, fn] of RULES) { re.lastIndex = 0; let m; while ((m = re.exec(s))) { const out = fn(...m); if (out) found.push({ end: m.index + m[0].length, out }); } } if (found.length) jobs.push([n, found.sort((a, b) => b.end - a.end)]); }
  let count = 0;
  for (const [node, found] of jobs.slice(0, 800)) for (const f of found) {
    try { const after = node.splitText(f.end); const tag = document.createElement("span"); tag.className = "kb-conv"; tag.textContent = ` (≈ ${f.out})`; tag.style.cssText = "font-size:.85em;opacity:.75;background:rgba(127,200,127,.18);border-radius:4px;padding:0 3px"; after.parentNode.insertBefore(tag, after); count++; } catch {}
  }
  toast(count ? `Converted ${count} value${count === 1 ? "" : "s"} on this page (≈ in ${target}${metric ? ", metric" : ", imperial"}).` : "Found nothing to convert on this page.", count ? { action: "Undo", onAction: () => root.querySelectorAll(".kb-conv").forEach((x) => x.remove()) } : {});
}
function convertSettings() {
  const cur = (localStorage.getItem("kitsune.convertTo") || "").toUpperCase(), metric = localStorage.getItem("kitsune.convertMetric") !== "0";
  const m = modal({ title: "Conversion settings", body: `<label class="lbl">Show prices in</label><select class="field" id="cv-c">${["", "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "INR", "KRW", "BRL", "SEK", "CNY", "MXN", "SGD", "NZD"].map((c) => `<option value="${c}" ${c === cur ? "selected" : ""}>${c || "Automatic"}</option>`).join("")}</select><label class="lbl" style="margin-top:10px">Measurements</label><select class="field" id="cv-m"><option value="1" ${metric ? "selected" : ""}>Metric (km, kg, °C)</option><option value="0" ${!metric ? "selected" : ""}>Imperial (miles, lb, °F)</option></select>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
  $("#cv-c", m.root).onchange = (e) => { try { e.target.value ? localStorage.setItem("kitsune.convertTo", e.target.value) : localStorage.removeItem("kitsune.convertTo"); } catch {} };
  $("#cv-m", m.root).onchange = (e) => { try { localStorage.setItem("kitsune.convertMetric", e.target.value); } catch {} };
}

export function items({ T, root }) {
  return [
    { label: "About this site (who runs it, how old it is)…", icon: "info", run: () => about(T()) },
    { label: "Convert prices and measures on this page", icon: "sliders", run: () => convertPage(root()) },
    { label: "Conversion settings (currency, metric or imperial)…", icon: "sliders", run: convertSettings },
  ];
}
