// Kitsune Browser, v126: more pages that describe themselves, made useful.
//  - FAQs as a tidy list of questions you can open one by one
//  - How-to guides as a checklist of steps, with supplies and tools
//  - Job postings: pay, place, type of work, closing date, at a glance
//  - Places (shops, restaurants, offices): open now or not, today's hours, address with a map link, phone
//  - Books: find a free or library copy (Project Gutenberg, Open Library, Internet Archive), or add it to Kitsune
import { $, esc, toast, modal } from "./util.js";
import { things } from "./webplus16.js";

const typeIs = (o, re) => [].concat(o["@type"] || []).some((t) => re.test(String(t)));
const txt = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
export function find(html) {
  const all = things(html);
  return {
    faq: all.find((o) => typeIs(o, /^FAQPage$/)), howto: all.find((o) => typeIs(o, /^HowTo$/)), job: all.find((o) => typeIs(o, /^JobPosting$/)),
    place: all.find((o) => typeIs(o, /(LocalBusiness|Restaurant|Store|CafeOrCoffeeShop|Bakery|BarOrPub|Museum|Library|Hotel|Dentist|Physician|AutoRepair|HairSalon|Pharmacy|GasStation|Bank)$/) && (o.address || o.openingHoursSpecification || o.openingHours)),
    book: all.find((o) => typeIs(o, /^Book$/)),
  };
}

function faqCard(f) {
  const qs = [].concat(f.mainEntity || []).filter((q) => q?.name);
  if (!qs.length) return toast("No questions found.");
  const m = modal({ title: `Questions on this page (${qs.length})`, wide: true, body: `<input class="field" id="fq-q" type="search" placeholder="Filter questions" style="width:100%;margin-bottom:10px">${qs.map((q, i) => `<details data-i="${i}" style="border-bottom:1px solid rgba(127,127,160,.25);padding:8px 0"><summary style="cursor:pointer;font-weight:600">${esc(txt(q.name))}</summary><div style="margin-top:6px;font-size:15px">${esc(txt([].concat(q.acceptedAnswer || q.suggestedAnswer || [])[0]?.text || "")).slice(0, 4000)}</div></details>`).join("")}` });
  $("#fq-q", m.root).oninput = (e) => { const v = e.target.value.toLowerCase(); m.root.querySelectorAll("details").forEach((d) => (d.style.display = !v || d.textContent.toLowerCase().includes(v) ? "" : "none")); };
}
function howtoCard(h) {
  const steps = []; const walk = (x) => { if (!x) return; if (typeof x === "string") return steps.push({ t: txt(x) }); if (Array.isArray(x)) return x.forEach(walk); if (typeIs(x, /HowToSection/)) { steps.push({ h: txt(x.name) }); return walk(x.itemListElement); } steps.push({ t: txt(x.text || x.name), img: typeof x.image === "string" ? x.image : x.image?.url }); };
  walk(h.step);
  const list = (k) => [].concat(h[k] || []).map((x) => txt(typeof x === "string" ? x : x.name)).filter(Boolean);
  modal({ title: "Step by step", wide: true, body: `<h3 style="margin:0 0 4px">${esc(txt(h.name))}</h3>${h.totalTime ? `<p class="muted" style="margin:0">Takes ${esc(String(h.totalTime).replace(/^PT?/, "").toLowerCase())}</p>` : ""}${list("supply").length ? `<h4>You'll need</h4><ul>${list("supply").map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}${list("tool").length ? `<h4>Tools</h4><ul>${list("tool").map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}<ol style="padding-left:1.2em">${steps.map((s) => (s.h ? `</ol><h4>${esc(s.h)}</h4><ol style="padding-left:1.2em">` : `<li style="margin:0 0 10px"><label class="check" style="align-items:flex-start"><input type="checkbox"> <span>${esc(s.t)}</span></label>${s.img ? `<img src="${esc(s.img)}" alt="" referrerpolicy="no-referrer" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:4px">` : ""}</li>`)).join("")}</ol>` });
}
function jobCard(j) {
  const sal = j.baseSalary?.value, unit = (sal?.unitText || "").toLowerCase(), cur = j.baseSalary?.currency || "";
  const money = sal ? (sal.minValue != null ? `${sal.minValue}–${sal.maxValue ?? ""}` : sal.value ?? "") : "";
  const loc = [].concat(j.jobLocation || []).map((l) => { const a = l.address || {}; return [a.addressLocality, a.addressRegion, a.addressCountry?.name || a.addressCountry].filter(Boolean).join(", "); }).filter(Boolean).join(" · ");
  const remote = /TELECOMMUTE/i.test(j.jobLocationType || "") || /remote/i.test(String(j.applicantLocationRequirements?.name || ""));
  const rows = [["Company", txt(j.hiringOrganization?.name)], ["Pay", money ? `${money} ${cur}${unit ? " per " + unit : ""}` : "Not stated"], ["Where", [remote && "Remote", loc].filter(Boolean).join(" · ")], ["Type", [].concat(j.employmentType || []).join(", ").replace(/_/g, " ").toLowerCase()], ["Posted", j.datePosted ? new Date(j.datePosted).toLocaleDateString() : ""], ["Closes", j.validThrough ? new Date(j.validThrough).toLocaleDateString() + (Date.parse(j.validThrough) < Date.now() ? " (already closed)" : "") : ""]].filter((r) => r[1]);
  modal({ title: "Job at a glance", wide: true, body: `<h3 style="margin:0 0 8px">${esc(txt(j.title))}</h3><table style="width:100%;font-size:14px">${rows.map(([k, v]) => `<tr><td style="opacity:.7;padding:4px 10px 4px 0;white-space:nowrap">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>${j.description ? `<details style="margin-top:10px"><summary style="cursor:pointer">Full description</summary><div style="font-size:14px;margin-top:6px">${esc(txt(j.description)).slice(0, 8000)}</div></details>` : ""}` });
}
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function hoursOf(p) {
  const out = Array.from({ length: 7 }, () => []);
  for (const s of [].concat(p.openingHoursSpecification || [])) { for (const d of [].concat(s.dayOfWeek || [])) { const i = DAYS.findIndex((x) => String(d).endsWith(x)); if (i >= 0 && s.opens) out[i].push([s.opens.slice(0, 5), (s.closes || "23:59").slice(0, 5)]); } }
  for (const s of [].concat(p.openingHours || [])) { const m = String(s).match(/^([A-Za-z,-]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/); if (!m) continue; const ab = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]; for (const part of m[1].split(",")) { const [a, b] = part.split("-"); const ia = ab.indexOf(a.slice(0, 2)), ib = b ? ab.indexOf(b.slice(0, 2)) : ia; if (ia < 0) continue; for (let k = ia; ; k = (k + 1) % 7) { out[k].push([m[2].padStart(5, "0"), m[3].padStart(5, "0")]); if (k === ib) break; } } }
  return out;
}
function placeCard(p) {
  const a = p.address || {}, addr = typeof a === "string" ? a : [a.streetAddress, a.addressLocality, a.postalCode, a.addressCountry?.name || a.addressCountry].filter(Boolean).join(", ");
  const hrs = hoursOf(p), now = new Date(), today = hrs[now.getDay()], hm = now.toTimeString().slice(0, 5);
  const openNow = today.some(([o, c]) => (c > o ? hm >= o && hm < c : hm >= o || hm < c)), known = hrs.some((d) => d.length);
  const geo = p.geo?.latitude ? `${p.geo.latitude},${p.geo.longitude}` : addr;
  modal({ title: txt(p.name) || "Place", body: `${known ? `<p style="font-size:18px;font-weight:700;margin:0 0 4px;color:${openNow ? "#3fa66a" : "#e5534b"}">${openNow ? "Open now" : "Closed now"}</p><p class="muted" style="margin:0 0 10px">Today: ${today.length ? today.map(([o, c]) => `${o}–${c}`).join(", ") : "closed"}</p>` : ""}${addr ? `<p>${esc(addr)}<br><a href="https://www.openstreetmap.org/search?query=${encodeURIComponent(geo)}" target="_blank" rel="noopener">Show on a map</a></p>` : ""}${p.telephone ? `<p><a href="tel:${esc(String(p.telephone).replace(/\s/g, ""))}">${esc(p.telephone)}</a></p>` : ""}${p.priceRange ? `<p>Price range: ${esc(p.priceRange)}</p>` : ""}${p.aggregateRating ? `<p>★ ${(+p.aggregateRating.ratingValue).toFixed(1)} (${esc(p.aggregateRating.reviewCount || p.aggregateRating.ratingCount || "?")})</p>` : ""}${known ? `<table style="font-size:14px">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<tr style="${d === now.getDay() ? "font-weight:700" : ""}"><td style="padding:2px 12px 2px 0">${DAYS[d]}</td><td>${hrs[d].length ? hrs[d].map(([o, c]) => `${o}–${c}`).join(", ") : "Closed"}</td></tr>`).join("")}</table>` : ""}<p class="hint">Hours as the place publishes them. Holidays may differ.</p>` });
}
function bookCard(b, go) {
  const title = txt(b.name), author = txt([].concat(b.author || [])[0]?.name || b.author || ""), isbn = txt([].concat(b.isbn || b.workExample?.isbn || [])[0] || "");
  const q = encodeURIComponent(`${title} ${author}`.trim());
  const m = modal({ title: "This book", body: `<h3 style="margin:0">${esc(title)}</h3><p class="muted">${esc(author)}${isbn ? " · ISBN " + esc(isbn) : ""}</p><p>Find a free or borrowable copy:</p><div style="display:grid;gap:6px"><button class="btn" data-u="https://www.gutenberg.org/ebooks/search/?query=${q}">Project Gutenberg (free, public domain)</button><button class="btn" data-u="https://openlibrary.org/search?q=${q}">Open Library (borrow)</button><button class="btn" data-u="https://archive.org/search?query=${q}">Internet Archive</button><button class="btn" data-u="https://standardebooks.org/ebooks?query=${q}">Standard Ebooks</button><button class="btn btn-accent" data-k="1">Search Kitsune's Books</button></div>` });
  m.root.onclick = (e) => { const u = e.target.closest("[data-u]"); if (u) { m.close(); go(u.dataset.u, { newTab: true }); } if (e.target.closest("[data-k]")) { m.close(); location.hash = "search/" + encodeURIComponent(title); } };
}

export function afterRender({ t, B, go }) {
  $("#kb-schema2", B.view)?.remove(); if (!t?.data?.html || localStorage.getItem("kitsune.webNoSchemaChip") === "1") return;
  const f = find(t.data.html), kind = f.place ? "place" : f.job ? "job" : f.howto ? "howto" : f.faq ? "faq" : f.book ? "book" : ""; if (!kind) return;
  const el = document.createElement("button"); el.id = "kb-schema2"; el.type = "button";
  el.textContent = { place: "🕒 Hours and address", job: "💼 Job at a glance", howto: "✅ Step by step", faq: "❓ Questions on this page", book: "📚 Find a free copy" }[kind];
  el.style.cssText = `position:absolute;right:14px;top:${$("#kb-schema", B.view) ? 84 : 44}px;z-index:19;font:600 12px system-ui,sans-serif;padding:6px 12px;border-radius:99px;border:1px solid var(--line,#3a3e66);background:var(--surface,#1c1d33);color:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)`;
  el.onclick = () => ({ place: () => placeCard(f.place), job: () => jobCard(f.job), howto: () => howtoCard(f.howto), faq: () => faqCard(f.faq), book: () => bookCard(f.book, go) })[kind]();
  ($("#kb-body", B.view) || B.view).append(el);
}
export function items({ T, go }) {
  const t = T(), f = t?.data?.html ? find(t.data.html) : {};
  return [
    ...(f.faq ? [{ label: "Questions on this page (FAQ)…", icon: "list", run: () => faqCard(f.faq) }] : []),
    ...(f.howto ? [{ label: "Step-by-step checklist…", icon: "list", run: () => howtoCard(f.howto) }] : []),
    ...(f.job ? [{ label: "Job at a glance…", icon: "info", run: () => jobCard(f.job) }] : []),
    ...(f.place ? [{ label: "Opening hours and address…", icon: "clock", run: () => placeCard(f.place) }] : []),
    ...(f.book ? [{ label: "Find a free or library copy of this book…", icon: "book", run: () => bookCard(f.book, go) }] : []),
  ];
}
