// Kitsune Browser, v99: comfort and utility tools. Page colour filters, blue-light filter, reading ruler,
// easy-reading spacing, text-only mode, mark my place, auto-refresh, a text toolbox, unit converter,
// snippets, bookmark tidy-up, shortcut cheat sheet.
import { $, $$, esc, icon, toast, modal, plural } from "./util.js";
import { kvGet, kvSet } from "./store.js";

const copy = (t, m) => navigator.clipboard?.writeText(t).then(() => toast(m || "Copied."), () => toast("Couldn’t copy."));
const sel = () => (getSelection()?.toString() || "").trim();
const FILTERS = [
  ["None", ""], ["Grayscale", "grayscale(1)"], ["Sepia", "sepia(.85)"], ["High contrast", "contrast(1.45)"],
  ["Invert", "invert(1) hue-rotate(180deg)"], ["Soft (lower contrast)", "contrast(.85) brightness(1.05)"],
];

export function items(c) {
  const { T, root, scroller, host, B, go } = c;
  const needPage = () => { const r = root(); if (!r || !T().url) { toast("Open a page first."); return null; } return r; };
  const styleIn = (r, id, css) => { r.querySelectorAll(`#${id}`).forEach((x) => x.remove()); if (css) { const s = document.createElement("style"); s.id = id; s.textContent = css; r.prepend(s); } };

  // ---- colour filter ----
  const filterDialog = () => {
    const el = scroller(); if (!el) return toast("Open a page first.");
    const cur = el.dataset.kbFilter || "";
    const m = modal({ title: "Page colour filter", body: `<div class="kb-list">${FILTERS.map(([n, f]) => `<button type="button" class="kb-li ${f === cur ? "on" : ""}" data-f="${esc(f)}">${n}</button>`).join("")}</div>` });
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; const f = b.dataset.f; el.style.filter = f; el.dataset.kbFilter = f; m.close(); toast(f ? "Filter applied to this tab." : "Filter removed."); });
  };

  // ---- warm night light ----
  const warm = () => {
    let o = $("#kb-warm");
    const m = modal({ title: "Night light", body: `<p class="muted">Warms the screen to cut blue light.</p><input type="range" id="nl" min="0" max="60" value="${o ? o.dataset.v : 25}" style="width:100%"><p class="muted" id="nl-v"></p>`, actions: `<button class="btn" type="button" id="nl-off">Turn off</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
    const apply = (v) => { v = +v; $("#nl-v", m.root).textContent = v ? `${v}% warm` : "Off"; if (!v) return $("#kb-warm")?.remove(); o = $("#kb-warm") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "kb-warm" })); o.dataset.v = v; o.style.cssText = `position:fixed;inset:0;z-index:99999;pointer-events:none;background:rgba(255,140,30,${v / 220});mix-blend-mode:multiply`; try { localStorage.setItem("kitsune.nightLight", v); } catch {} };
    $("#nl", m.root).oninput = (e) => apply(e.target.value); $("#nl-off", m.root).onclick = () => { apply(0); try { localStorage.removeItem("kitsune.nightLight"); } catch {} m.close(); }; apply($("#nl", m.root).value);
  };

  // ---- reading ruler ----
  const ruler = () => {
    if (window.__kbRuler) { window.__kbRuler(); window.__kbRuler = null; return toast("Reading ruler off."); }
    const top = document.createElement("div"), bot = document.createElement("div");
    const base = "position:fixed;left:0;right:0;z-index:99998;pointer-events:none;background:rgba(0,0,0,.45)"; top.style.cssText = base + ";top:0"; bot.style.cssText = base + ";bottom:0";
    document.body.append(top, bot);
    const mv = (e) => { const y = (e.touches?.[0] || e).clientY; top.style.height = Math.max(0, y - 22) + "px"; bot.style.height = Math.max(0, innerHeight - y - 22) + "px"; };
    addEventListener("mousemove", mv); addEventListener("touchmove", mv, { passive: true }); mv({ clientY: innerHeight / 2 });
    window.__kbRuler = () => { removeEventListener("mousemove", mv); removeEventListener("touchmove", mv); top.remove(); bot.remove(); };
    toast("Reading ruler on. Your pointer picks the line. Choose it again to stop.");
  };

  // ---- easy reading / text only / link emphasis ----
  const easy = () => { const r = needPage(); if (!r) return; const on = !r.querySelector("#kb-easy"); styleIn(r, "kb-easy", on ? `.kb-body, .kb-reader, .kb-body *{letter-spacing:.04em!important;word-spacing:.16em!important;line-height:1.85!important;text-align:left!important;max-width:none}.kb-body p,.kb-reader p{max-width:62ch!important;margin-bottom:1.4em!important}` : ""); toast(on ? "Easy-reading spacing on." : "Easy-reading spacing off."); };
  const textOnly = () => { const r = needPage(); if (!r) return; const on = !r.querySelector("#kb-textonly"); styleIn(r, "kb-textonly", on ? `img,picture,video,iframe,svg:not([class*=icon]),canvas,figure img,[style*="background-image"]{display:none!important}` : ""); toast(on ? "Pictures and video hidden." : "Pictures and video shown."); };
  const links = () => { const r = needPage(); if (!r) return; const on = !r.querySelector("#kb-linkem"); styleIn(r, "kb-linkem", on ? `a[href]{text-decoration:underline!important;text-underline-offset:3px;background:rgba(255,224,102,.35)!important;color:inherit}` : ""); toast(on ? "Links emphasised." : "Links back to normal."); };

  // ---- mark my place ----
  const placeKey = () => { try { const u = new URL(T().url); u.hash = ""; return u.href; } catch { return T().url; } };
  const markPlace = async () => {
    const el = scroller(); if (!el || !T().url) return toast("Open a page first.");
    const all = (await kvGet("webPlaces", {})) || {}, p = Math.round((el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) * 100);
    all[placeKey()] = { p, t: Date.now(), title: T().title }; await kvSet("webPlaces", all); toast(`Marked your place at ${p}%.`);
  };
  const goPlace = async () => {
    const all = (await kvGet("webPlaces", {})) || {}, h = all[placeKey()]; if (!h) return toast("No marked place on this page.");
    const el = scroller(); el?.scrollTo({ top: (h.p / 100) * (el.scrollHeight - el.clientHeight), behavior: "smooth" }); toast(`Back to ${h.p}%.`);
  };
  const allPlaces = async () => {
    const all = (await kvGet("webPlaces", {})) || {}, list = Object.entries(all).sort((a, b) => b[1].t - a[1].t);
    const m = modal({ title: "Marked places", body: list.length ? `<div class="kb-list">${list.map(([u, h]) => `<button type="button" class="kb-li" data-u="${esc(u)}"><b>${esc(h.title || u)}</b><br><small class="muted">${h.p}% · ${esc(u.slice(0, 70))}</small></button>`).join("")}</div>` : `<p class="muted">Nothing marked yet. Use “Mark my place”.</p>` });
    m.root.addEventListener("click", async (e) => { const b = e.target.closest("[data-u]"); if (!b) return; m.close(); await go(b.dataset.u); setTimeout(goPlace, 900); });
  };

  // ---- auto refresh ----
  const refresh = () => {
    if (window.__kbRefresh) { clearInterval(window.__kbRefresh); window.__kbRefresh = null; return toast("Auto-refresh off."); }
    const m = modal({ title: "Auto-refresh this page", body: `<div style="display:flex;gap:8px;flex-wrap:wrap">${[[15, "15 s"], [60, "1 min"], [300, "5 min"], [900, "15 min"]].map(([s, l]) => `<button class="btn" data-s="${s}">${l}</button>`).join("")}</div>` });
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (!b) return; m.close(); const url = T().url; window.__kbRefresh = setInterval(() => { if (!B.view?.isConnected || T().url !== url) { clearInterval(window.__kbRefresh); window.__kbRefresh = null; return; } go(url, { push: false }); }, +b.dataset.s * 1000); toast("Refreshing automatically. Choose it again to stop."); });
  };

  // ---- text toolbox ----
  const toolbox = async () => {
    let seed = sel(); if (!seed) { try { seed = await Promise.race([navigator.clipboard.readText(), new Promise((r) => setTimeout(() => r(""), 600))]); } catch {} }
    const ops = {
      "UPPER": (s) => s.toUpperCase(), "lower": (s) => s.toLowerCase(), "Title Case": (s) => s.toLowerCase().replace(/\b\p{L}/gu, (x) => x.toUpperCase()), "Sentence case": (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, a, b) => a + b.toUpperCase()),
      "Sort lines": (s) => s.split("\n").sort((a, b) => a.localeCompare(b)).join("\n"), "Unique lines": (s) => [...new Set(s.split("\n"))].join("\n"), "Reverse lines": (s) => s.split("\n").reverse().join("\n"),
      "Number lines": (s) => s.split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n"), "Trim & squash spaces": (s) => s.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).join("\n"), "Remove blank lines": (s) => s.split("\n").filter((l) => l.trim()).join("\n"),
      "Join to one line": (s) => s.replace(/\s*\n\s*/g, " ").trim(), "Quote as Markdown": (s) => s.split("\n").map((l) => "> " + l).join("\n"), "Slug": (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      "JSON prettify": (s) => { try { return JSON.stringify(JSON.parse(s), null, 2); } catch { toast("That isn’t valid JSON."); return s; } }, "JSON minify": (s) => { try { return JSON.stringify(JSON.parse(s)); } catch { toast("That isn’t valid JSON."); return s; } },
      "Base64 encode": (s) => btoa(unescape(encodeURIComponent(s))), "Base64 decode": (s) => { try { return decodeURIComponent(escape(atob(s.trim()))); } catch { toast("Not valid Base64."); return s; } },
      "URL encode": (s) => encodeURIComponent(s), "URL decode": (s) => { try { return decodeURIComponent(s); } catch { return s; } },
      "Reverse text": (s) => [...s].reverse().join(""), "Rot13": (s) => s.replace(/[a-z]/gi, (ch) => String.fromCharCode((ch <= "Z" ? 90 : 122) >= (ch = ch.charCodeAt(0) + 13) ? ch : ch - 26)),
    };
    const m = modal({ title: "Text toolbox", wide: true, body: `<textarea class="field" id="tb-t" rows="8" style="width:100%;font-family:ui-monospace,monospace" placeholder="Paste or type text. Selected page text is filled in for you.">${esc(seed)}</textarea><p class="muted" id="tb-c" style="margin:6px 0"></p><div style="display:flex;flex-wrap:wrap;gap:6px">${Object.keys(ops).map((k) => `<button class="btn" data-op="${esc(k)}">${esc(k)}</button>`).join("")}<button class="btn" data-op="~hash">SHA-256</button></div>`, actions: `<button class="btn" type="button" id="tb-cp">Copy result</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
    const ta = $("#tb-t", m.root), count = () => { const v = ta.value; $("#tb-c", m.root).textContent = `${plural((v.match(/\S+/g) || []).length, "word")} · ${plural(v.length, "character")} · ${plural(v ? v.split("\n").length : 0, "line")}`; }; count(); ta.oninput = count;
    m.root.addEventListener("click", async (e) => { const b = e.target.closest("[data-op]"); if (!b) return; if (b.dataset.op === "~hash") { const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ta.value)); ta.value = [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join(""); } else ta.value = ops[b.dataset.op](ta.value); count(); });
    $("#tb-cp", m.root).onclick = () => copy(ta.value, "Result copied.");
  };

  // ---- unit converter ----
  const U = { km: ["len", 1000], m: ["len", 1], cm: ["len", .01], mm: ["len", .001], mi: ["len", 1609.344], yd: ["len", .9144], ft: ["len", .3048], in: ["len", .0254], kg: ["mass", 1], g: ["mass", .001], lb: ["mass", .45359237], oz: ["mass", .028349523], l: ["vol", 1], ml: ["vol", .001], gal: ["vol", 3.785411784], cup: ["vol", .2365882365], floz: ["vol", .0295735], "km/h": ["spd", 1], mph: ["spd", 1.609344], "m/s": ["spd", 3.6], kn: ["spd", 1.852], B: ["data", 1], KB: ["data", 1e3], MB: ["data", 1e6], GB: ["data", 1e9], TB: ["data", 1e12] };
  const convert = () => {
    const s = sel(), mm = s.match(/(-?[\d.,]+)\s*(°?[CFK]|[a-zA-Z/]+)/);
    const m = modal({ title: "Unit converter", body: `<div style="display:flex;gap:8px;flex-wrap:wrap"><input class="field" id="uc-v" type="number" step="any" style="width:130px" value="${mm ? parseFloat(mm[1].replace(/,/g, "")) : 1}"><select class="field" id="uc-u">${[...Object.keys(U), "°C", "°F", "K"].map((k) => `<option ${mm && mm[2] === k ? "selected" : ""}>${k}</option>`).join("")}</select></div><div id="uc-o" style="margin-top:12px"></div>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
    const draw = () => {
      const v = parseFloat($("#uc-v", m.root).value), u = $("#uc-u", m.root).value; let rows = [];
      if (["°C", "°F", "K"].includes(u)) { const c0 = u === "°C" ? v : u === "°F" ? (v - 32) * 5 / 9 : v - 273.15; rows = [["°C", c0], ["°F", c0 * 9 / 5 + 32], ["K", c0 + 273.15]]; }
      else { const [kind, f] = U[u]; rows = Object.entries(U).filter(([k, x]) => x[0] === kind && k !== u).map(([k, x]) => [k, v * f / x[1]]); }
      $("#uc-o", m.root).innerHTML = isNaN(v) ? "" : rows.map(([k, x]) => `<div class="kb-li" style="display:flex;justify-content:space-between"><span>${esc(String(+x.toPrecision(7)))} ${esc(k)}</span><button class="btn" data-c="${esc(String(+x.toPrecision(7)))}">Copy</button></div>`).join("");
    };
    m.root.addEventListener("input", draw); m.root.addEventListener("change", draw); m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (b) copy(b.dataset.c); }); draw();
  };

  // ---- snippets ----
  const snippets = async () => {
    let list = (await kvGet("webSnippets", [])) || [];
    const m = modal({ title: "Snippets", wide: true, body: `<p class="muted">Text you paste a lot: addresses, signatures, replies. Click one to copy it.</p><div id="sn-l"></div><div style="display:flex;gap:6px;margin-top:10px"><input class="field" id="sn-n" placeholder="Name" style="width:30%"><input class="field" id="sn-b" placeholder="Text to keep" style="flex:1"><button class="btn btn-accent" id="sn-a">Add</button></div>`, actions: `<button class="btn" type="button" data-close>Done</button>` });
    const draw = () => { $("#sn-l", m.root).innerHTML = list.length ? list.map((x, i) => `<div class="kb-li" style="display:flex;gap:8px;align-items:center"><button class="btn" data-use="${i}" style="flex:1;text-align:left"><b>${esc(x.n)}</b> <small class="muted">${esc(x.b.slice(0, 60))}</small></button><button class="icon-btn" data-del="${i}" aria-label="Delete">${icon("x")}</button></div>`).join("") : `<p class="muted">No snippets yet.</p>`; };
    m.root.addEventListener("click", async (e) => { const u = e.target.closest("[data-use]"), d = e.target.closest("[data-del]"); if (u) copy(list[+u.dataset.use].b, "Snippet copied."); if (d) { list.splice(+d.dataset.del, 1); await kvSet("webSnippets", list); draw(); } });
    $("#sn-a", m.root).onclick = async () => { const n = $("#sn-n", m.root).value.trim(), b = $("#sn-b", m.root).value; if (!n || !b) return; list.push({ n, b }); await kvSet("webSnippets", list); $("#sn-n", m.root).value = $("#sn-b", m.root).value = ""; draw(); };
    $("#sn-b", m.root).value = sel().slice(0, 500); draw();
  };

  // ---- bookmark tidy ----
  const tidyMarks = async () => {
    const m = (await kvGet("webBookmarks", [])) || [], seen = new Set(), keep = [];
    for (const b of m) { const k = (b.url || "").replace(/#.*$/, "").replace(/\/$/, "").replace(/^https?:\/\/(www\.)?/, ""); if (!k || seen.has(k)) continue; seen.add(k); keep.push(b); }
    const gone = m.length - keep.length; if (!gone) return toast("No duplicate bookmarks.");
    await kvSet("webBookmarks", keep); toast(`Removed ${plural(gone, "duplicate bookmark")}.`);
  };

  // ---- shortcut cheat sheet ----
  const keys = () => modal({ title: "Keyboard shortcuts", wide: true, body: `<table class="kb-keys" style="width:100%;border-collapse:collapse">${[
    ["⌘/Ctrl L", "Focus the address bar"], ["⌘/Ctrl T", "New tab"], ["⌘/Ctrl ⇧ T", "Reopen closed tab"], ["⌘/Ctrl F", "Find on page"], ["⌘/Ctrl ⇧ F", "Search this site"], ["⌘/Ctrl ⇧ P", "Run a command"], ["⌘/Ctrl ⇧ A", "All tabs"],
    ["Alt 1–9", "Jump to tab"], ["Alt ← / →", "Back / forward"], ["F", "Link hints (⇧F opens in new tab)"], ["S", "Read later"], ["O", "Page outline"], ["J / K", "Scroll down / up"], ["G G", "Top of page"], ["⇧ G", "Bottom of page"], ["Esc", "Stop reading aloud"], ["/", "Find on page"], ["[ and ]", "Previous / next heading"], ["?", "This list"],
  ].map(([k, v]) => `<tr><td style="padding:5px 12px 5px 0;white-space:nowrap"><kbd>${esc(k)}</kbd></td><td>${esc(v)}</td></tr>`).join("")}</table>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });

  try { const v = +localStorage.getItem("kitsune.nightLight"); if (v && !$("#kb-warm")) { const o = document.body.appendChild(Object.assign(document.createElement("div"), { id: "kb-warm" })); o.dataset.v = v; o.style.cssText = `position:fixed;inset:0;z-index:99999;pointer-events:none;background:rgba(255,140,30,${v / 220});mix-blend-mode:multiply`; } } catch {}

  return [
    { label: "Page colour filter (grayscale, sepia, contrast…)", icon: "sliders", run: filterDialog },
    { label: "Night light (blue-light filter)", icon: "moon", run: warm },
    { label: window.__kbRuler ? "Reading ruler: off" : "Reading ruler", icon: "type", run: ruler },
    { label: "Easy-reading spacing (on/off)", icon: "type", run: easy },
    { label: "Text only: hide pictures and video (on/off)", icon: "expand", run: textOnly },
    { label: "Emphasise links (on/off)", icon: "link", run: links },
    { label: "Mark my place on this page", icon: "bookmark", run: markPlace },
    { label: "Go to my marked place", icon: "back", run: goPlace },
    { label: "All marked places…", icon: "list", run: allPlaces },
    { label: window.__kbRefresh ? "Stop auto-refresh" : "Auto-refresh this page…", icon: "clock", run: refresh },
    { label: "Text toolbox (case, sort, JSON, Base64, hash…)", icon: "edit", run: toolbox },
    { label: "Unit converter", icon: "sliders", run: convert },
    { label: "Snippets (text you paste often)…", icon: "edit", run: snippets },
    { label: "Remove duplicate bookmarks", icon: "x", run: tidyMarks },
    { label: "Keyboard shortcuts", icon: "list", run: keys },
  ];
}
