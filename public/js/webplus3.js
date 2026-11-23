// Kitsune Browser, v100: tab switcher, search across tabs, bookmark tags, quick summary without AI,
// accessibility check, date and time tools, password generator, contrast checker, stopwatch, history by day.
import { $, esc, toast, modal, plural } from "./util.js";
import { kvGet, kvSet } from "./store.js";

const copy = (t, m) => navigator.clipboard?.writeText(t).then(() => toast(m || "Copied."), () => toast("Couldn’t copy."));
const STOP = new Set("the a an and or but of to in on at for with as by is are was were be been it its this that these those from not no so if then than which who what when where how i you he she we they them his her our your their my me us do does did have has had will would can could should may might also just more most very into out up about over after before".split(" "));
const textOf = (t) => ((t.doc || t.data?.doc)?.body?.textContent || "").replace(/\s+/g, " ").trim();

export function items(c) {
  const { T, root, host, B, go, showTab } = c;
  const needPage = () => { const r = root(); if (!r || !T().url) { toast("Open a page first."); return null; } return r; };

  // ---- tab switcher ----
  const switcher = () => {
    const m = modal({ title: "Switch tab", body: `<input class="field" id="sw-q" placeholder="Type a title or site…" autofocus><div class="kb-list" id="sw-l" style="margin-top:10px"></div>` });
    let sel = 0;
    const rank = () => { const q = $("#sw-q", m.root).value.toLowerCase().split(/\s+/).filter(Boolean); return B.tabs.map((t, i) => ({ t, i })).filter(({ t }) => t.url).filter(({ t }) => q.every((w) => (t.title + " " + t.url).toLowerCase().includes(w))); };
    const draw = () => { const r = rank(); sel = Math.min(sel, Math.max(0, r.length - 1)); $("#sw-l", m.root).innerHTML = r.length ? r.map(({ t, i }, k) => `<button type="button" class="kb-li ${k === sel ? "on" : ""}" data-i="${i}"><b>${esc(t.title || host(t.url))}</b>${i === B.active ? " · current" : ""}<br><small class="muted">${esc(host(t.url))}</small></button>`).join("") : `<p class="muted">No open pages match.</p>`; };
    const pick = (i) => { m.close(); B.active = i; showTab(); };
    $("#sw-q", m.root).oninput = () => { sel = 0; draw(); };
    $("#sw-q", m.root).addEventListener("keydown", (e) => { const r = rank(); if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, r.length - 1); draw(); } if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); } if (e.key === "Enter" && r[sel]) pick(r[sel].i); });
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) pick(+b.dataset.i); });
    draw(); setTimeout(() => $("#sw-q", m.root)?.focus(), 30);
  };

  // ---- search all open tabs ----
  const searchTabs = () => {
    const m = modal({ title: "Search all open tabs", wide: true, body: `<input class="field" id="st-q" placeholder="Find a word in any open page…" autofocus><div class="kb-list" id="st-l" style="margin-top:10px"></div>` });
    const run = () => {
      const q = $("#st-q", m.root).value.trim().toLowerCase(); if (q.length < 2) return ($("#st-l", m.root).innerHTML = "");
      const hits = B.tabs.map((t, i) => { const tx = textOf(t), at = tx.toLowerCase().indexOf(q); if (at < 0) return null; const n = tx.toLowerCase().split(q).length - 1; return { t, i, n, snip: tx.slice(Math.max(0, at - 50), at + 90) }; }).filter(Boolean);
      $("#st-l", m.root).innerHTML = hits.length ? hits.map(({ t, i, n, snip }) => `<button type="button" class="kb-li" data-i="${i}"><b>${esc(t.title || host(t.url))}</b> · ${plural(n, "match", "matches")}<br><small class="muted">…${esc(snip)}…</small></button>`).join("") : `<p class="muted">Not found in any open page.</p>`;
    };
    $("#st-q", m.root).oninput = run;
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) { m.close(); B.active = +b.dataset.i; showTab(); } });
  };

  // ---- tags ----
  const tagsAll = async () => (await kvGet("webTags", {})) || {};
  const tagKey = () => (T().url || "").replace(/#.*$/, "");
  const tagPage = async () => {
    const t = T(); if (!t.url) return toast("Open a page first.");
    const all = await tagsAll(), cur = all[tagKey()]?.tags || [];
    const m = modal({ title: "Tag this page", body: `<p class="muted">Separate tags with commas.</p><input class="field" id="tg-q" value="${esc(cur.join(", "))}" placeholder="e.g. recipes, to-read, work" autofocus>`, actions: `<button class="btn btn-accent" type="button" id="tg-ok">Save tags</button>` });
    $("#tg-ok", m.root).onclick = async () => { const tags = [...new Set($("#tg-q", m.root).value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean))].slice(0, 12); if (tags.length) all[tagKey()] = { tags, title: t.title, t: Date.now() }; else delete all[tagKey()]; await kvSet("webTags", all); m.close(); toast(tags.length ? `Tagged: ${tags.join(", ")}` : "Tags removed."); };
    $("#tg-q", m.root).addEventListener("keydown", (e) => { if (e.key === "Enter") $("#tg-ok", m.root).click(); });
  };
  const browseTags = async () => {
    const all = await tagsAll(), counts = {}; Object.values(all).forEach((v) => v.tags.forEach((g) => (counts[g] = (counts[g] || 0) + 1)));
    const names = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    if (!names.length) return toast("Nothing tagged yet. Use “Tag this page”.");
    const m = modal({ title: "Tagged pages", wide: true, body: `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${names.map((n) => `<button class="btn" data-tag="${esc(n)}">${esc(n)} <small>${counts[n]}</small></button>`).join("")}</div><div class="kb-list" id="tg-l"></div>` });
    const show = (tag) => { $("#tg-l", m.root).innerHTML = Object.entries(all).filter(([, v]) => v.tags.includes(tag)).sort((a, b) => b[1].t - a[1].t).map(([u, v]) => `<button type="button" class="kb-li" data-u="${esc(u)}"><b>${esc(v.title || u)}</b><br><small class="muted">${esc(v.tags.join(", "))} · ${esc(host(u))}</small></button>`).join(""); };
    show(names[0]);
    m.root.addEventListener("click", (e) => { const t = e.target.closest("[data-tag]"), u = e.target.closest("[data-u]"); if (t) show(t.dataset.tag); if (u) { m.close(); go(u.dataset.u); } });
  };

  // ---- quick summary (no AI) ----
  const summary = () => {
    const r = needPage(); if (!r) return;
    const text = (r.innerText || r.textContent || "").replace(/\s+/g, " ");
    const sents = (text.match(/[^.!?]+[.!?]+/g) || []).map((s) => s.trim()).filter((s) => s.length > 40 && s.length < 320);
    if (sents.length < 4) return toast("Not enough text to summarise.");
    const freq = new Map(); (text.toLowerCase().match(/[a-z’']{4,}/g) || []).forEach((w) => { if (!STOP.has(w)) freq.set(w, (freq.get(w) || 0) + 1); });
    const score = sents.map((s, i) => { const ws = s.toLowerCase().match(/[a-z’']{4,}/g) || []; return { s, i, v: ws.reduce((a, w) => a + (freq.get(w) || 0), 0) / Math.sqrt(ws.length + 1) + (i < 3 ? 2 : 0) }; });
    const top = score.sort((a, b) => b.v - a.v).slice(0, 5).sort((a, b) => a.i - b.i);
    const body = top.map((x) => `- ${x.s}`).join("\n");
    const m = modal({ title: "Quick summary (no AI, on your device)", wide: true, body: `<ul style="padding-left:18px">${top.map((x) => `<li style="margin:8px 0">${esc(x.s)}</li>`).join("")}</ul>`, actions: `<button class="btn" type="button" id="qs-c">Copy</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
    $("#qs-c", m.root).onclick = () => copy(body, "Summary copied.");
  };

  // ---- accessibility check ----
  const a11y = () => {
    const r = needPage(); if (!r) return;
    const issues = [], q = (s) => [...r.querySelectorAll(s)];
    const noAlt = q("img:not([alt])").length, emptyBtn = q("button, a[href]").filter((x) => !x.textContent.trim() && !x.getAttribute("aria-label") && !x.querySelector("img[alt]:not([alt=''])")).length;
    const vague = q("a[href]").filter((x) => /^(click here|here|read more|more|link)$/i.test(x.textContent.trim())).length;
    const hs = q("h1,h2,h3,h4,h5,h6").map((h) => +h.tagName[1]); let skips = 0; hs.forEach((h, i) => { if (i && h - hs[i - 1] > 1) skips++; });
    const h1 = hs.filter((x) => x === 1).length, noLabel = q("input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select").filter((x) => !x.getAttribute("aria-label") && !x.id && !x.closest("label")).length;
    const tiny = q("[style*='font-size']").filter((x) => parseFloat(x.style.fontSize) > 0 && parseFloat(x.style.fontSize) < 11).length;
    const rows = [["Pictures with no alt text", noAlt], ["Buttons or links with no name", emptyBtn], ["Vague link text (“click here”)", vague], ["Skipped heading levels", skips], ["Headings of level 1 (should be 1)", h1 === 1 ? 0 : Math.max(1, h1) , h1], ["Form fields with no label", noLabel], ["Text smaller than 11px", tiny]];
    const bad = rows.filter((x) => x[1]).length;
    modal({ title: "Accessibility check", body: `<p><b>${bad ? plural(bad, "kind of issue") + " found" : "No obvious issues found"}</b>. This is a quick check, not a full audit.</p><div class="kb-list">${rows.map(([n, v, raw]) => `<div class="kb-li" style="display:flex;justify-content:space-between"><span>${n}</span><b style="color:${v ? "#c0392b" : "#2e8b57"}">${n.startsWith("Headings of level 1") ? raw : v}</b></div>`).join("")}</div>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
  };

  // ---- date and time tools ----
  const dates = () => {
    const now = new Date(), iso = (d) => d.toISOString().slice(0, 10);
    const m = modal({ title: "Date and time tools", wide: true, body: `
      <h3 class="h3">Unix time</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><input class="field" id="dt-e" placeholder="seconds or ms since 1970" value="${Math.floor(now / 1000)}" style="width:210px"><span id="dt-eo" class="muted" style="align-self:center"></span></div>
      <h3 class="h3" style="margin-top:14px">Days between two dates</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><input class="field" type="date" id="dt-a" value="${iso(now)}"><input class="field" type="date" id="dt-b" value="${iso(new Date(+now + 30 * 864e5))}"><span id="dt-bo" class="muted" style="align-self:center"></span></div>
      <h3 class="h3" style="margin-top:14px">Add days to a date</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><input class="field" type="date" id="dt-c" value="${iso(now)}"><input class="field" type="number" id="dt-n" value="90" style="width:90px"><span id="dt-co" class="muted" style="align-self:center"></span></div>
      <h3 class="h3" style="margin-top:14px">Time in other places</h3><div id="dt-z"></div>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
    const f = (d, tz) => d.toLocaleString(undefined, { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
    const draw = () => {
      const e = parseFloat($("#dt-e", m.root).value), d = new Date(e > 1e11 ? e : e * 1000); $("#dt-eo", m.root).textContent = isNaN(d) ? "" : `${d.toISOString()} · ${d.toLocaleString()}`;
      const a = new Date($("#dt-a", m.root).value), b = new Date($("#dt-b", m.root).value); $("#dt-bo", m.root).textContent = isNaN(a) || isNaN(b) ? "" : `${plural(Math.round((b - a) / 864e5), "day")} (${(Math.abs(b - a) / 864e5 / 7).toFixed(1)} weeks)`;
      const c = new Date($("#dt-c", m.root).value); c.setDate(c.getDate() + +$("#dt-n", m.root).value); $("#dt-co", m.root).textContent = isNaN(c) ? "" : c.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };
    $("#dt-z", m.root).innerHTML = ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Paris", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"].map((z) => `<div class="kb-li" style="display:flex;justify-content:space-between"><span>${z.replace("_", " ")}</span><b>${f(now, z)}</b></div>`).join("");
    m.root.addEventListener("input", draw); draw();
  };

  // ---- password generator ----
  const password = () => {
    const W = "amber anchor apple arrow aspen badge baker basil beach birch blaze bloom brave brook cabin candle cedar chalk cider cliff cloud clover coral crane creek crown daisy delta dune eagle ember fable falcon fern field flint forest frost garnet glade grove harbor hazel heron holly honey iris ivory jasper juniper kettle lantern lemon lilac linen lotus maple marble meadow mint moss nectar oak olive onyx otter pearl pepper pine plum quartz quill raven reef river robin sage salt sand shore silver sky slate spruce stone sunny thistle thorn tide tulip velvet violet willow winter wren yarrow zephyr".split(" ");
    const rnd = (n) => { const a = new Uint32Array(1); let x; do { crypto.getRandomValues(a); x = a[0]; } while (x >= 4294967296 - (4294967296 % n)); return x % n; };
    const gen = (kind, len) => { if (kind === "words") return Array.from({ length: len }, () => W[rnd(W.length)]).join("-") + "-" + rnd(100); const set = kind === "pin" ? "0123456789" : "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_"; return Array.from({ length: len }, () => set[rnd(set.length)]).join(""); };
    const m = modal({ title: "Password generator", body: `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><select class="field" id="pw-k"><option value="words">Passphrase (words)</option><option value="chars">Random characters</option><option value="pin">PIN</option></select><input class="field" type="number" id="pw-n" value="4" min="3" max="64" style="width:80px"></div><div id="pw-o"></div><p class="muted" style="margin-top:8px">Made on your device with the browser’s secure random generator. Nothing is sent or saved.</p>`, actions: `<button class="btn" type="button" id="pw-g">New set</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
    const draw = () => { const k = $("#pw-k", m.root).value, n = +$("#pw-n", m.root).value || 4; $("#pw-o", m.root).innerHTML = Array.from({ length: 5 }, () => gen(k, n)).map((p) => `<div class="kb-li" style="display:flex;justify-content:space-between;gap:8px"><code style="word-break:break-all">${esc(p)}</code><button class="btn" data-c="${esc(p)}">Copy</button></div>`).join(""); };
    $("#pw-k", m.root).onchange = () => { $("#pw-n", m.root).value = { words: 4, chars: 16, pin: 6 }[$("#pw-k", m.root).value]; draw(); };
    $("#pw-n", m.root).oninput = draw; $("#pw-g", m.root).onclick = draw; m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (b) copy(b.dataset.c, "Copied. Paste it, then it’s gone from here."); }); draw();
  };

  // ---- contrast checker ----
  const contrast = () => {
    const lum = (h) => { const n = parseInt(h.replace("#", ""), 16), v = [n >> 16, (n >> 8) & 255, n & 255].map((x) => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
    const m = modal({ title: "Colour contrast checker", body: `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><label>Text <input type="color" id="cc-a" value="#333333"></label><label>Background <input type="color" id="cc-b" value="#ffffff"></label></div><div id="cc-s" style="margin:12px 0;padding:16px;border-radius:8px;font-size:18px">The quick brown fox jumps over the lazy dog.</div><div id="cc-o"></div>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
    const draw = () => { const a = $("#cc-a", m.root).value, b = $("#cc-b", m.root).value, l1 = lum(a), l2 = lum(b), r = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); $("#cc-s", m.root).style.cssText += `;color:${a};background:${b}`; const ok = (x) => (r >= x ? "Pass" : "Fail"); $("#cc-o", m.root).innerHTML = `<p><b style="font-size:22px">${r.toFixed(2)} : 1</b></p><p>Normal text (4.5): <b>${ok(4.5)}</b> · Large text (3): <b>${ok(3)}</b> · Extra strict (7): <b>${ok(7)}</b></p>`; };
    m.root.addEventListener("input", draw); draw();
  };

  // ---- stopwatch ----
  const stopwatch = () => {
    let t0 = 0, acc = 0, id = 0, laps = [];
    const m = modal({ title: "Stopwatch", body: `<div id="sw-t" style="font:600 40px ui-monospace,monospace;text-align:center;margin:10px 0">00:00.0</div><div id="sw-l" class="muted" style="text-align:center;min-height:40px"></div>`, actions: `<button class="btn" type="button" id="sw-lap">Lap</button><button class="btn" type="button" id="sw-r">Reset</button><button class="btn btn-accent" type="button" id="sw-s">Start</button>`, onClose: () => clearInterval(id) });
    const el = () => acc + (t0 ? Date.now() - t0 : 0), fmt = (ms) => { const s = ms / 1000; return `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`; };
    const tick = () => { $("#sw-t", m.root).textContent = fmt(el()); };
    $("#sw-s", m.root).onclick = () => { if (t0) { acc += Date.now() - t0; t0 = 0; clearInterval(id); $("#sw-s", m.root).textContent = "Start"; } else { t0 = Date.now(); id = setInterval(tick, 100); $("#sw-s", m.root).textContent = "Stop"; } };
    $("#sw-lap", m.root).onclick = () => { laps.push(fmt(el())); $("#sw-l", m.root).innerHTML = laps.slice(-5).map((x, i) => `Lap ${laps.length - Math.min(5, laps.length) + i + 1}: ${x}`).join("<br>"); };
    $("#sw-r", m.root).onclick = () => { clearInterval(id); t0 = 0; acc = 0; laps = []; $("#sw-s", m.root).textContent = "Start"; $("#sw-l", m.root).textContent = ""; tick(); };
  };

  // ---- history by day / top sites ----
  const insights = async () => {
    const h = ((await kvGet("webHistory", [])) || []).filter((x) => x.t);
    if (!h.length) return toast("No history yet.");
    const day = (t) => new Date(t).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const byDay = new Map(); h.forEach((x) => { const k = day(x.t); (byDay.get(k) || byDay.set(k, []).get(k)).push(x); });
    const weekAgo = Date.now() - 7 * 864e5, sites = new Map(); h.filter((x) => x.t > weekAgo).forEach((x) => sites.set(host(x.url), (sites.get(host(x.url)) || 0) + 1));
    const top = [...sites].sort((a, b) => b[1] - a[1]).slice(0, 8), max = top[0]?.[1] || 1;
    const m = modal({ title: "Browsing insights", wide: true, body: `<h3 class="h3">Top sites this week</h3>${top.map(([s, n]) => `<div style="display:grid;grid-template-columns:150px 1fr 30px;gap:8px;align-items:center;margin:3px 0"><span>${esc(s)}</span><i style="display:block;height:8px;border-radius:4px;background:var(--accent,#c0392b);width:${Math.round((n / max) * 100)}%"></i><em style="font-style:normal">${n}</em></div>`).join("") || `<p class="muted">Nothing this week.</p>`}<h3 class="h3" style="margin-top:14px">By day</h3><input class="field" id="in-q" placeholder="Filter history…" style="margin-bottom:8px"><div id="in-l" style="max-height:44vh;overflow:auto"></div>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
    const draw = () => { const q = $("#in-q", m.root).value.toLowerCase(); $("#in-l", m.root).innerHTML = [...byDay].map(([d, xs]) => { const ys = xs.filter((x) => !q || (x.title + x.url).toLowerCase().includes(q)).slice(0, 40); return ys.length ? `<h4 style="margin:10px 0 4px">${d} <small class="muted">${plural(xs.length, "page")}</small></h4>${ys.map((x) => `<button type="button" class="kb-li" data-u="${esc(x.url)}">${esc(x.title || x.url)} <small class="muted">${esc(host(x.url))}</small></button>`).join("")}` : ""; }).join("") || `<p class="muted">No matches.</p>`; };
    $("#in-q", m.root).oninput = draw; m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-u]"); if (b) { m.close(); go(b.dataset.u); } }); draw();
  };

  return [
    { label: "Switch tab… (type to find)", icon: "grid", run: switcher },
    { label: "Search all open tabs…", icon: "search", run: searchTabs },
    { label: "Tag this page…", icon: "bookmark", run: tagPage },
    { label: "Browse tagged pages", icon: "list", run: browseTags },
    { label: "Quick summary (no AI)", icon: "spark", run: summary },
    { label: "Accessibility check", icon: "sliders", run: a11y },
    { label: "Date and time tools (Unix time, days between, time zones)", icon: "clock", run: dates },
    { label: "Password generator", icon: "plus", run: password },
    { label: "Colour contrast checker", icon: "highlight", run: contrast },
    { label: "Stopwatch", icon: "clock", run: stopwatch },
    { label: "Browsing insights (top sites, history by day)", icon: "list", run: insights },
  ];
}
