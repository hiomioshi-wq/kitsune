// Kitsune Browser, v102: start page shortcuts you control, backup and restore, clear recent history, tab moves.
import { $, esc, toast, modal, plural } from "./util.js";
import { kvGet, kvSet } from "./store.js";

export const hueOf = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
export const customDial = async () => { const d = await kvGet("webDial", null); return Array.isArray(d) && d.length ? d : null; };
const KEYS = ["webBookmarks", "webHistory", "webTags", "webSnippets", "webScratch", "webPlaces", "webClips", "webEngines", "webDial"];
const LS = ["kitsune.webEngine", "kitsune.siteZoom", "kitsune.siteStyles", "kitsune.shieldOff", "kitsune.cookieSites", "kitsune.webDarkSites", "kitsune.webLive", "kitsune.readerLook"];

export function items(c) {
  const { T, host, B, go, showTab, newTab, persistTabs, defaults, refreshStart } = c;

  const pinHere = async () => {
    const t = T(); if (!t.url) return toast("Open a page first.");
    const cur = (await customDial()) || defaults.map((x) => [...x]);
    if (cur.some(([, u]) => u === t.url)) return toast("It’s already on your start page.");
    cur.push([(t.title || host(t.url)).slice(0, 28), t.url, hueOf(host(t.url))]); await kvSet("webDial", cur); toast("Added to your start page.");
  };

  const editDial = async () => {
    let list = (await customDial()) || defaults.map((x) => [...x]);
    const m = modal({ title: "Start page shortcuts", wide: true, body: `<div id="ed-l"></div><div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap"><input class="field" id="ed-n" placeholder="Name" style="width:28%"><input class="field" id="ed-u" placeholder="https://…" style="flex:1"><button class="btn btn-accent" id="ed-a">Add</button></div>`, actions: `<button class="btn" type="button" id="ed-r">Reset to default</button><button class="btn btn-accent" type="button" data-close>Done</button>`, onClose: () => refreshStart?.() });
    const save = () => kvSet("webDial", list);
    const draw = () => { $("#ed-l", m.root).innerHTML = list.length ? list.map(([n, u], i) => `<div class="kb-li" style="display:flex;gap:6px;align-items:center"><span style="flex:1;overflow:hidden;text-overflow:ellipsis"><b>${esc(n)}</b> <small class="muted">${esc(host(u))}</small></span><button class="btn" data-up="${i}" ${i ? "" : "disabled"}>↑</button><button class="btn" data-dn="${i}" ${i < list.length - 1 ? "" : "disabled"}>↓</button><button class="btn" data-rm="${i}">Remove</button></div>`).join("") : `<p class="muted">No shortcuts. Add one below.</p>`; };
    m.root.addEventListener("click", async (e) => { const g = (k) => e.target.closest(`[data-${k}]`); const u = g("up"), d = g("dn"), r = g("rm"); if (u) { const i = +u.dataset.up; [list[i - 1], list[i]] = [list[i], list[i - 1]]; } else if (d) { const i = +d.dataset.dn; [list[i + 1], list[i]] = [list[i], list[i + 1]]; } else if (r) list.splice(+r.dataset.rm, 1); else return; await save(); draw(); });
    $("#ed-a", m.root).onclick = async () => { let u = $("#ed-u", m.root).value.trim(), n = $("#ed-n", m.root).value.trim(); if (!u) return; if (!/^https?:\/\//i.test(u)) u = "https://" + u; try { new URL(u); } catch { return toast("That isn’t a web address."); } list.push([n || host(u), u, hueOf(host(u))]); $("#ed-u", m.root).value = $("#ed-n", m.root).value = ""; await save(); draw(); };
    $("#ed-r", m.root).onclick = async () => { await kvSet("webDial", null); list = defaults.map((x) => [...x]); draw(); toast("Back to the default shortcuts."); };
    draw();
  };

  const backup = async () => {
    const data = { kitsuneBrowserBackup: 1, saved: new Date().toISOString(), kv: {}, ls: {} };
    for (const k of KEYS) { const v = await kvGet(k, null); if (v != null && !(Array.isArray(v) && !v.length)) data.kv[k] = v; }
    for (const k of LS) { try { const v = localStorage.getItem(k); if (v != null) data.ls[k] = v; } catch {} }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" })); a.download = `kitsune-browser-backup-${data.saved.slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast(`Backed up ${plural(Object.keys(data.kv).length, "kind of data", "kinds of data")}. Cookies are not included.`);
  };
  const restore = () => {
    const i = document.createElement("input"); i.type = "file"; i.accept = ".json,application/json";
    i.onchange = async () => {
      const f = i.files[0]; if (!f) return; let d; try { d = JSON.parse(await f.text()); } catch { return toast("That file isn’t a Kitsune backup."); }
      if (!d?.kitsuneBrowserBackup) return toast("That file isn’t a Kitsune backup.");
      const m = modal({ title: "Restore browser data?", body: `<p>This replaces your current ${plural(Object.keys(d.kv || {}).length, "kind of data", "kinds of data")} (bookmarks, history, tags and so on) with the backup from ${esc((d.saved || "").slice(0, 10))}.</p>`, actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="rs-go">Restore</button>` });
      $("#rs-go", m.root).onclick = async () => { for (const [k, v] of Object.entries(d.kv || {})) if (KEYS.includes(k)) await kvSet(k, v); for (const [k, v] of Object.entries(d.ls || {})) if (LS.includes(k)) { try { localStorage.setItem(k, v); } catch {} } m.close(); toast("Restored."); };
    };
    i.click();
  };

  const clearRecent = () => {
    const m = modal({ title: "Clear recent history", body: `<div class="kb-list">${[["Last hour", 3600e3], ["Last 24 hours", 864e5], ["Last 7 days", 7 * 864e5], ["Everything", Infinity]].map(([l, ms]) => `<button type="button" class="kb-li" data-ms="${ms}">${l}</button>`).join("")}</div><p class="muted">Bookmarks are not touched.</p>` });
    m.root.addEventListener("click", async (e) => { const b = e.target.closest("[data-ms]"); if (!b) return; const ms = +b.dataset.ms, h = (await kvGet("webHistory", [])) || [], keep = ms === Infinity ? [] : h.filter((x) => !x.t || x.t < Date.now() - ms); await kvSet("webHistory", keep); m.close(); toast(`Cleared ${plural(h.length - keep.length, "page")} from history.`); });
  };

  const dupTab = () => { const t = T(); if (!t.url) return toast("Open a page first."); const n = newTab(t.url); B.tabs.splice(B.active + 1, 0, n); B.active++; persistTabs(); showTab(); };
  const move = (d) => () => { const i = B.active, j = i + d; if (j < 0 || j >= B.tabs.length || B.tabs[i].pinned !== B.tabs[j].pinned) return toast("Can’t move it that way."); [B.tabs[i], B.tabs[j]] = [B.tabs[j], B.tabs[i]]; B.active = j; persistTabs(); showTab(); };
  const reloadAll = async () => { const cur = B.active; let n = 0; for (let i = 0; i < B.tabs.length; i++) if (B.tabs[i].url) { B.active = i; await go(B.tabs[i].url, { push: false }); n++; } B.active = cur; showTab(); toast(`Reloaded ${plural(n, "tab")}.`); };

  return [
    { label: "Pin this page to the start page", icon: "bookmark", run: pinHere },
    { label: "Edit start page shortcuts…", icon: "edit", run: editDial },
    { label: "Back up browser data (bookmarks, history, tags, notes)", icon: "download", run: backup },
    { label: "Restore browser data from a backup…", icon: "download", run: restore },
    { label: "Clear recent history…", icon: "x", run: clearRecent },
    { label: "Duplicate this tab", icon: "plus", run: dupTab },
    { label: "Move tab left", icon: "back", run: move(-1) },
    { label: "Move tab right", icon: "back", run: move(1) },
    { label: "Reload all tabs", icon: "play", run: reloadAll },
  ];
}
