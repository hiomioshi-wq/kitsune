// Daemons: background helpers that run on a schedule while Kitsune is open.
// Built-in kinds watch a page, follow a feed, nudge you if a chosen hour arrives with no reading today, find the next volume
// missing from an AniList-linked series, count unread feed items, or summarize your reading week; "script" daemons run your
// own JavaScript in a sealed sandbox with a small API (fetch through Kitsune, notify, remember things) and no library access.
import { $, esc, icon, toast, modal, uid, api, clamp, today, fmtMinutes, plural } from "./util.js";
import { kvGet, kvSet, lib } from "./store.js";
import { getSubs, getItems, getRead } from "./feedlib.js";

export const KINDS = {
  watch: { name: "Watch a page", hint: "Tells you when a page's text changes (optionally just one part of it, by CSS selector)." },
  feed: { name: "Feed alerts", hint: "Tells you when a feed (RSS or Atom) has a new post." },
  script: { name: "Script daemon", hint: "Runs your JavaScript in a sealed sandbox. API: await kb.fetch(url) → text, kb.notify(text), await kb.get(key), kb.set(key, value), kb.log(text)." },
  pace: { name: "Reading pace nudge", hint: "Nudges you once a day if a chosen hour arrives with no reading session logged today (it counts a session the same way your streak does)." },
  series: { name: "Series next-volume finder", hint: "Scans the AniList-linked manga series on your shelf for the next volume you're missing (you own vol N but not N+1) and reports up to a few gaps." },
  digest: { name: "Feed digester", hint: "Counts unread items piling up across your feed subscriptions and speaks up when the stack grows past a threshold." },
  weekly: { name: "Weekly reading report", hint: "Once a week, on the day you pick: pages, reading time and titles finished over the last 7 days." },
};
export const all = async () => (await kvGet("daemons", [])) || [];
const save = (list) => kvSet("daemons", list);
async function update(id, patch) { const l = await all(); await save(l.map((d) => (d.id === id ? { ...d, ...patch } : d))); }
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
export function seriesGaps(items, max = 5) {
  const own = new Map();
  for (const it of items || []) {
    if (it?.type !== "manga" || !it.link?.anilistId) continue;
    const n = Number(it.volume) > 0 ? Number(it.volume) : Number((String(it.title).match(/(?:vol(?:ume)?\.?|#|v)\s*0*(\d{1,3})\b/i) || String(it.title).match(/\b0*(\d{1,3})\s*$/) || [])[1] || 0);
    if (!(n >= 1 && n <= 999)) continue;
    const k = "al" + it.link.anilistId;
    if (!own.has(k)) own.set(k, { title: it.link.title || it.series || it.title, nums: new Set() });
    own.get(k).nums.add(n);
  }
  const gaps = [];
  for (const g of own.values()) { const have = [...g.nums].sort((a, b) => a - b); let next = have[0]; while (g.nums.has(next)) next++; gaps.push({ title: g.title, next, have }); }
  return gaps.sort((a, b) => a.next - b.next).slice(0, max);
}
function notify(d, text) {
  toast(`${d.name}: ${text}`, { ms: 8000, action: d.url ? "Open" : undefined, onAction: d.url ? () => (location.hash = "web/" + encodeURIComponent(d.url)) : undefined });
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) try { new Notification(d.name, { body: text, icon: "/icon.svg" }); } catch {}
}

async function runOne(d) {
  const log = (m) => update(d.id, { lastLog: String(m).slice(0, 300), lastRun: Date.now() });
  try {
    if (d.kind === "watch") {
      const r = await api("browse?url=" + encodeURIComponent(d.url));
      let text = r.text || "";
      if (r.html) { const doc = new DOMParser().parseFromString(r.html, "text/html"); doc.querySelectorAll("script,style,noscript").forEach((n) => n.remove()); text = ((d.selector && doc.querySelector(d.selector)) || doc.body)?.textContent.replace(/\s+/g, " ").trim() || ""; }
      const h = hash(text);
      if (d.state && d.state !== h) notify(d, "the page changed.");
      await update(d.id, { state: h, lastRun: Date.now(), lastLog: `Checked · ${text.length} characters` });
    } else if (d.kind === "feed") {
      const xml = await api("feed?url=" + encodeURIComponent(d.url));
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      const first = doc.querySelector("item, entry"), title = first?.querySelector("title")?.textContent.trim() || "";
      const link = first?.querySelector("link")?.getAttribute("href") || first?.querySelector("link")?.textContent || "";
      if (d.state && title && d.state !== title) notify({ ...d, url: link || d.url }, `new post: ${title}`);
      await update(d.id, { state: title, lastRun: Date.now(), lastLog: title ? `Latest: ${title}` : "No posts" });
    } else if (d.kind === "pace") {
      const hour = clamp(Number.isFinite(+d.hour) ? +d.hour : 20, 0, 23), day = ((await kvGet("stats", { days: {} })).days || {})[today()] || {};
      const read = !!(day.pages || day.secs > 60 || day.listen > 60), due = new Date().getHours() >= hour;
      if (due && d.state !== today()) { if (!read) notify(d, "no reading session yet today — a few pages keeps the streak alive."); await update(d.id, { state: today(), lastRun: Date.now(), lastLog: read ? "Read today" : "Nudged" }); }
      else await update(d.id, { lastRun: Date.now(), lastLog: read ? "Read today" : d.state === today() ? "Done for today" : `Waiting until ${hour}:00` });
    } else if (d.kind === "series") {
      const gaps = seriesGaps(lib.items, clamp(+d.maxGaps || 5, 1, 20));
      if (gaps.length) notify(d, "next to get: " + gaps.map((g) => `${g.title} vol ${g.next}`).join("; "));
      await update(d.id, { lastRun: Date.now(), lastLog: gaps.length ? String("Next: " + gaps.map((g) => `${g.title} vol ${g.next}`).join("; ")).slice(0, 300) : "No gaps found" });
    } else if (d.kind === "digest") {
      const [subs, items, read] = await Promise.all([getSubs(), getItems(), getRead()]);
      const rows = subs.map((s) => ({ title: s.title, n: (items[s.id] || []).filter((i) => !read.has(i.id)).length })).filter((r) => r.n).sort((a, b) => b.n - a.n);
      const total = rows.reduce((t, r) => t + r.n, 0);
      if (total >= clamp(+d.minUnread || 10, 1, 999) && d.state !== String(total)) notify(d, `${total} unread across ${plural(rows.length, "feed")} — biggest: ${rows[0].title} (${rows[0].n})`);
      await update(d.id, { state: String(total), lastRun: Date.now(), lastLog: total ? `${total} unread in ${plural(rows.length, "feed")}` : "All caught up" });
    } else if (d.kind === "weekly") {
      const wd = clamp(Number.isFinite(+d.day) ? +d.day : 1, 0, 6), a = new Date(); a.setDate(a.getDate() - ((a.getDay() - wd + 7) % 7)); const key = today(a);
      if (d.state !== key) {
        const st = await kvGet("stats", { days: {}, finished: [] }), cutoff = Date.now() - 7 * 86400_000, week = Object.entries(st.days || {}).filter(([k]) => new Date(k + "T12:00").getTime() >= cutoff);
        const pages = week.reduce((t, [, v]) => t + (v.pages || 0), 0), secs = week.reduce((t, [, v]) => t + (v.secs || 0) + (v.listen || 0), 0), active = week.filter(([, v]) => v.pages || v.secs > 60 || v.listen > 60).length, done = (st.finished || []).filter((f) => f.at * 1000 >= cutoff).length;
        notify(d, `last 7 days: ${plural(pages, "page")}, ${fmtMinutes(secs)} read, ${plural(active, "active day")}${done ? `, ${plural(done, "title")} finished` : ""}.`);
        await update(d.id, { state: key, lastRun: Date.now(), lastLog: `${pages} pages · ${fmtMinutes(secs)} · ${done} finished` });
      } else await update(d.id, { lastRun: Date.now(), lastLog: "Reported for this week" });
    } else if (d.kind === "script") await runScript(d, log);
  } catch (e) { await update(d.id, { lastRun: Date.now(), lastLog: "Error: " + e.message }); }
}

// A script daemon runs in a throwaway sandbox (no access to Kitsune) and talks to us only by messages.
function runScript(d, log) {
  return new Promise((done) => {
    const f = document.createElement("iframe");
    f.setAttribute("sandbox", "allow-scripts"); f.hidden = true;
    const boot = `<script>(()=>{let n=0;const w=new Map();addEventListener("message",e=>{const m=e.data;if(m&&m.__dr&&w.has(m.id)){const p=w.get(m.id);w.delete(m.id);m.err?p[1](new Error(m.err)):p[0](m.v)}});
const call=(op,a)=>new Promise((ok,no)=>{const id=++n;w.set(id,[ok,no]);parent.postMessage({__dq:1,id,op,a},"*")});
const kb={fetch:u=>call("fetch",u),notify:t=>call("notify",String(t)),get:k=>call("get",k),set:(k,v)=>call("set",[k,v]),log:t=>call("log",String(t))};
(async()=>{try{${d.code.replace(/<\//g, "<\\/")}\n;await call("done")}catch(e){await call("log","Error: "+e.message);call("done")}})()})()<\/script>`;
    let vals = d.values || {};
    const end = async () => { removeEventListener("message", on); f.remove(); await update(d.id, { values: vals, lastRun: Date.now() }); done(); };
    const on = async (e) => {
      if (e.source !== f.contentWindow || !e.data?.__dq) return;
      const { id, op, a } = e.data, reply = (v, err) => f.contentWindow?.postMessage({ __dr: 1, id, v, err }, "*");
      try {
        if (op === "fetch") { const r = await fetch("/api/browse/raw?url=" + encodeURIComponent(a)); reply(await r.text()); }
        else if (op === "notify") { notify(d, a); reply(true); }
        else if (op === "get") reply(vals[a]);
        else if (op === "set") { vals = { ...vals, [a[0]]: a[1] }; reply(true); }
        else if (op === "log") { log(a); reply(true); }
        else if (op === "done") { reply(true); end(); }
      } catch (err) { reply(null, err.message); }
    };
    addEventListener("message", on);
    setTimeout(end, 60_000); // a daemon gets a minute per run
    f.srcdoc = boot; document.body.append(f);
  });
}

let timer = 0;
export function start() {
  clearInterval(timer);
  const tick = async () => { const now = Date.now(); for (const d of await all()) if (d.enabled && now - (d.lastRun || 0) >= Math.max(5, d.every || 30) * 60_000) await runOne(d); };
  setTimeout(tick, 15_000); timer = setInterval(tick, 60_000);
}

export async function manager(prefillUrl = "") {
  const m = modal({ title: "Daemons", wide: true, body: `<p class="muted" style="margin-top:0">Background helpers that run every so often while Kitsune is open: watch a page, follow a feed, keep an eye on your reading and feeds, or run your own script in a sealed sandbox.</p><div id="dm"></div>` });
  const draw = async () => {
    const list = await all();
    $("#dm", m.root).innerHTML = `<div class="toolbar" style="margin:0 0 10px">${Object.entries(KINDS).map(([k, v]) => `<button class="btn btn-sm" type="button" data-add="${k}">${icon("plus")}${v.name}</button>`).join("")}</div>
      ${list.length ? `<div class="us-list">${list.map((d) => `<div class="us-row"><label class="us-sw"><input type="checkbox" data-on="${d.id}" ${d.enabled ? "checked" : ""}><i></i></label>
        <span class="us-main"><strong>${esc(d.name)}</strong><small>${esc(KINDS[d.kind].name)} · every ${d.every} min${d.lastRun ? " · " + esc(d.lastLog || "") : " · not run yet"}</small></span>
        <span class="us-acts"><button class="btn btn-sm" type="button" data-run="${d.id}">Run now</button><button class="btn btn-sm" type="button" data-del="${d.id}">${icon("trash")}</button></span></div>`).join("")}</div>` : `<div class="us-empty"><strong>No daemons yet.</strong></div>`}`;
  };
  m.root.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const list = await all();
    if (b.dataset.run) { b.textContent = "Running…"; await runOne(list.find((d) => d.id === b.dataset.run)); return draw(); }
    if (b.dataset.del) { await save(list.filter((d) => d.id !== b.dataset.del)); return draw(); }
    if (b.dataset.add) {
      const k = b.dataset.add, f = modal({ title: KINDS[k].name, wide: k === "script", body: `<form class="form" id="dn"><p class="hint" style="margin:0">${esc(KINDS[k].hint)}</p>
        <input class="field" id="dn-name" placeholder="Name" required value="${esc(k === "script" ? "My daemon" : ["pace", "series", "digest", "weekly"].includes(k) ? KINDS[k].name : "")}">
        ${(k === "watch" || k === "feed") ? `<input class="field" id="dn-url" type="url" placeholder="${k === "feed" ? "Feed address" : "Page address"}" required value="${esc(prefillUrl)}">` : ""}
        ${k === "watch" ? `<input class="field" id="dn-sel" placeholder="Only this part (CSS selector, optional)">` : ""}
        ${k === "pace" ? `<label class="lbl">Nudge after <input class="field" id="dn-hour" type="number" min="0" max="23" value="20" style="width:90px;display:inline-block">:00 with no reading today</label>` : ""}
        ${k === "series" ? `<label class="lbl">Report up to <input class="field" id="dn-max" type="number" min="1" max="20" value="5" style="width:90px;display:inline-block"> series per run</label>` : ""}
        ${k === "digest" ? `<label class="lbl">Only speak up from <input class="field" id="dn-min" type="number" min="1" value="10" style="width:90px;display:inline-block"> unread items</label>` : ""}
        ${k === "weekly" ? `<label class="lbl">Report each <select class="field" id="dn-day">${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((n, i) => `<option value="${i}"${i === 1 ? " selected" : ""}>${n}</option>`).join("")}</select></label>` : ""}
        ${k === "script" ? `<textarea class="field" id="dn-code" rows="10" style="font:12.5px var(--f-mono)">const html = await kb.fetch("https://xkcd.com/info.0.json");\nconst c = JSON.parse(html);\nif (await kb.get("last") !== c.num) { kb.set("last", c.num); kb.notify("New xkcd: " + c.safe_title); }</textarea>` : ""}
        <label class="lbl">Every <input class="field" id="dn-every" type="number" min="5" value="30" style="width:90px;display:inline-block"> minutes</label></form>`,
        actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="dn">Add</button>` });
      $("#dn", f.root).onsubmit = async (ev) => {
        ev.preventDefault();
        const d = { id: uid("dm-"), kind: k, name: $("#dn-name", f.root).value.trim(), url: $("#dn-url", f.root)?.value.trim() || "", selector: $("#dn-sel", f.root)?.value.trim() || "", code: $("#dn-code", f.root)?.value || "", hour: k === "pace" ? ($("#dn-hour", f.root).value === "" ? 20 : clamp(+$("#dn-hour", f.root).value, 0, 23)) : undefined, maxGaps: k === "series" ? clamp(+$("#dn-max", f.root).value || 5, 1, 20) : undefined, minUnread: k === "digest" ? clamp(+$("#dn-min", f.root).value || 10, 1, 999) : undefined, day: k === "weekly" ? clamp(+$("#dn-day", f.root).value ?? 1, 0, 6) : undefined, every: Math.max(5, +$("#dn-every", f.root).value || 30), enabled: true };
        await save([...(await all()), d]); f.close(); await runOne(d); draw();
        if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
      };
    }
  });
  m.root.addEventListener("change", async (e) => { const t = e.target.closest("[data-on]"); if (t) { await update(t.dataset.on, { enabled: t.checked }); } });
  draw();
}
