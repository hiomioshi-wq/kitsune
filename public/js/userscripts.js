// Userscripts and user styles for Kitsune's browser, in the Greasemonkey / Tampermonkey format.
// Scripts only ever run inside Live mode's sealed sandbox, never in Kitsune itself, so a script can't reach your
// library or your data. User styles work everywhere.
import { $, $$, esc, icon, toast, modal, uid, api, plural, debounce, confirmBox } from "./util.js";
import { kvGet, kvSet } from "./store.js";

// ---------- storage ----------
export async function all() { return (await kvGet("userscripts", [])) || []; }
async function saveAll(list) { await kvSet("userscripts", list); }
export async function values(id) { return ((await kvGet("usValues", {})) || {})[id] || {}; }
export async function setValue(id, key, value) {
  const v = { ...((await kvGet("usValues", {})) || {}) };
  const m = { ...(v[id] || {}) };
  if (value === undefined) delete m[key]; else m[key] = value;
  v[id] = m; await kvSet("usValues", v);
}

// ---------- the ==UserScript== header ----------
export function parseMeta(code) {
  const block = String(code).match(/\/\/\s*==(UserScript|UserStyle)==([\s\S]*?)\/\/\s*==\/\1==/) || String(code).match(/\/\*\s*==(UserStyle)==([\s\S]*?)==\/UserStyle==\s*\*\//);
  const meta = { name: "", namespace: "", version: "", description: "", author: "", match: [], include: [], exclude: [], grant: [], require: [], runAt: "document-idle", icon: "", noframes: false };
  if (!block) return meta;
  for (const line of block[2].split(/\r?\n/)) {
    const m = line.match(/^\s*(?:\/\/)?\s*@([\w:.-]+)\s*(.*?)\s*$/); if (!m) continue;
    const [, k0, v] = m, k = k0.split(":")[0].toLowerCase();
    if (k === "match" || k === "include" || k === "exclude" || k === "grant" || k === "require") meta[k].push(v);
    else if (k === "run-at") meta.runAt = v;
    else if (k === "noframes") meta.noframes = true;
    else if (k in meta && !meta[k]) meta[k] = v; // first value wins (localised names come after)
  }
  return meta;
}

// ---------- which pages a script runs on ----------
const escRe = (s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
function matchPattern(p, url) {
  if (p === "<all_urls>" || p === "*") return /^https?:/.test(url);
  const m = p.match(/^(\*|https?|file|ftp):\/\/([^/]*)(\/.*)?$/); if (!m) return false;
  let u; try { u = new URL(url); } catch { return false; }
  const [, scheme, hostPat, pathPat = "/*"] = m;
  if (scheme === "*" ? !/^https?:$/.test(u.protocol) : u.protocol !== scheme + ":") return false;
  const h = u.hostname;
  const hostOk = hostPat === "*" || (hostPat.startsWith("*.") ? h === hostPat.slice(2) || h.endsWith(hostPat.slice(1)) : h === hostPat);
  if (!hostOk) return false;
  return new RegExp("^" + pathPat.split("*").map(escRe).join(".*") + "$").test(u.pathname + u.search);
}
function globMatch(g, url) {
  if (g.length > 2 && g.startsWith("/") && g.endsWith("/")) { try { return new RegExp(g.slice(1, -1)).test(url); } catch { return false; } }
  // * matches anything; ".tld" matches any top-level domain, as in Greasemonkey
  return new RegExp("^" + g.split("*").map(escRe).join(".*").replace(/\\\.tld(?=\/|$)/g, "\\.[a-z.]{2,8}") + "$").test(url);
}
export function runsOn(meta, url) {
  if (!/^https?:/.test(url)) return false;
  if (meta.exclude.some((g) => globMatch(g, url))) return false;
  return meta.match.some((p) => matchPattern(p, url)) || meta.include.some((g) => globMatch(g, url));
}
export async function forUrl(url, kind) { return (await all()).filter((s) => s.enabled && (!kind || s.kind === kind) && runsOn(s.meta, url)); }

// ---------- what goes into a live page ----------
// Each script is wrapped with its own Greasemonkey API (from the helper inside the sandbox) and its saved values.
export async function livePayload(url) {
  const list = await forUrl(url);
  const scripts = [], styles = [];
  for (const s of list) {
    if (s.kind === "style") { styles.push(stripMeta(s.code)); continue; }
    const info = { script: { name: s.meta.name, namespace: s.meta.namespace, version: s.meta.version, description: s.meta.description, matches: s.meta.match, includes: s.meta.include, excludes: s.meta.exclude, grant: s.meta.grant, "run-at": s.meta.runAt }, scriptHandler: "Kitsune", version: "1.0", scriptMetaStr: (s.code.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/) || [""])[0] };
    const req = Object.values(s.requires || {}).join("\n;\n");
    const body = `${req}\n;\n${s.code}`;
    const run = s.meta.runAt === "document-start" ? "now" : s.meta.runAt === "document-end" ? "ready" : "idle";
    scripts.push(`(function () {
  var GM = window.__kbGM(${JSON.stringify(s.id)}, ${JSON.stringify(info)}, ${JSON.stringify(await values(s.id))});
  var GM_info = GM.info, GM_getValue = GM.getValueSync, GM_setValue = GM.setValueSync, GM_deleteValue = GM.deleteValueSync, GM_listValues = GM.listValuesSync,
      GM_addStyle = GM.addStyle, GM_xmlhttpRequest = GM.xhr, GM_notification = GM.notify, GM_openInTab = GM.openInTab, GM_setClipboard = GM.setClipboard,
      GM_registerMenuCommand = GM.registerMenuCommand, GM_unregisterMenuCommand = GM.unregisterMenuCommand, GM_getResourceText = GM.getResourceText, GM_getResourceURL = GM.getResourceURL,
      GM_addElement = GM.addElement, GM_download = GM.download, GM_log = console.log.bind(console), GM_addValueChangeListener = GM.addValueChangeListener, GM_removeValueChangeListener = GM.removeValueChangeListener;
  var unsafeWindow = window;
  window.__kbRun(${JSON.stringify(run)}, ${JSON.stringify(s.meta.name || "userscript")}, function () {
${body}
  });
})();`);
  }
  return { scripts, styles };
}
const stripMeta = (css) => String(css).replace(/\/\*\s*==UserStyle==[\s\S]*?==\/UserStyle==\s*\*\//, "").replace(/\/\/\s*==UserStyle==[\s\S]*?\/\/\s*==\/UserStyle==/, "");
export async function stylesFor(url) { return (await forUrl(url, "style")).map((s) => stripMeta(s.code)).join("\n"); }

// ---------- installing ----------
async function fetchText(url) {
  const r = await fetch("/api/browse/raw?url=" + encodeURIComponent(url));
  if (!r.ok) throw new Error(`Couldn't download it (${r.status}).`);
  return r.text();
}
export async function installFromUrl(url) {
  let code;
  try { code = await fetchText(url); } catch (e) { return toast(e.message); }
  return installDialog(code, url);
}
export async function installDialog(code, source = "") {
  const kind = /==UserStyle==/.test(code) || /\.user\.css(\?|$)/.test(source) ? "style" : "script";
  const meta = parseMeta(code);
  if (!meta.name) return toast("That isn't a userscript (it has no ==UserScript== header).");
  const existing = (await all()).find((s) => s.meta.name === meta.name && s.meta.namespace === meta.namespace);
  const where = [...meta.match, ...meta.include];
  const powerful = meta.grant.filter((g) => /xmlhttpRequest|xmlHttpRequest|openInTab|download|setClipboard|unsafeWindow/i.test(g));
  const m = modal({ title: existing ? `Update “${meta.name}”` : `Install “${meta.name}”`, wide: true, body: `
    <p class="muted" style="margin-top:0">${esc(meta.description || "No description.")}</p>
    <dl class="kb-info">
      ${meta.version ? `<dt>Version</dt><dd>${esc(meta.version)}${existing ? ` (you have ${esc(existing.meta.version || "an older one")})` : ""}</dd>` : ""}
      ${meta.author ? `<dt>Author</dt><dd>${esc(meta.author)}</dd>` : ""}
      <dt>Runs on</dt><dd>${where.length ? where.slice(0, 8).map((w) => `<code>${esc(w)}</code>`).join(" ") + (where.length > 8 ? ` and ${where.length - 8} more` : "") : "Nowhere yet (no @match). Add one in the editor."}</dd>
      ${meta.grant.length ? `<dt>Asks for</dt><dd>${meta.grant.map((g) => `<code>${esc(g)}</code>`).join(" ")}</dd>` : ""}
      ${meta.require.length ? `<dt>Also loads</dt><dd>${meta.require.map((r) => `<code>${esc(r)}</code>`).join(" ")}</dd>` : ""}
      ${source ? `<dt>From</dt><dd>${esc(source)}</dd>` : ""}
    </dl>
    ${powerful.length ? `<p class="hint">This script can fetch other websites through Kitsune${powerful.some((g) => /openInTab/.test(g)) ? " and open tabs" : ""}. Like every userscript here, it runs in Live mode's sealed sandbox and can't see your library or your Kitsune data.</p>` : `<p class="hint">It runs in Live mode's sealed sandbox, so it can't see your library or your Kitsune data.</p>`}
    <details><summary>Show the code (${(code.length / 1024).toFixed(1)} KB)</summary><pre class="us-code">${esc(code.slice(0, 20000))}${code.length > 20000 ? "\n…" : ""}</pre></details>
    <p class="status" id="us-s"></p>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="us-go">${existing ? "Update" : "Install"}</button>` });
  return new Promise((done) => {
    $("#us-go", m.root).onclick = async () => {
      const s = $("#us-s", m.root), requires = {};
      for (const r of meta.require.slice(0, 8)) { s.className = "status"; s.textContent = `Loading ${r.split("/").pop()}…`; try { requires[r] = await fetchText(r); } catch { s.className = "status err"; s.textContent = `Couldn't load ${r}.`; return; } }
      const list = await all(), rec = { id: existing?.id || uid("us-"), kind, code, meta, enabled: true, source, requires, installed: existing?.installed || Date.now(), updated: Date.now() };
      await saveAll(existing ? list.map((x) => (x.id === existing.id ? rec : x)) : [...list, rec]);
      m.close(); toast(`${existing ? "Updated" : "Installed"} “${meta.name}”. It runs ${kind === "style" ? "on matching pages" : "in Live mode on matching pages"}.`);
      done(rec);
    };
  });
}

// ---------- templates ----------
const TEMPLATES = {
  blank: (host) => `// ==UserScript==
// @name         My script for ${host}
// @namespace    kitsune
// @version      1.0
// @description  What it does
// @match        https://${host}/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  // Your code here. It runs in Live mode, inside the page, in a sealed sandbox.
})();
`,
  hide: (host) => `// ==UserScript==
// @name         Tidy ${host}
// @namespace    kitsune
// @version      1.0
// @description  Hides sidebars, pop-ups and comment sections
// @match        https://${host}/*
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(\`
  aside, [class*="sidebar"], [class*="comments"], [id*="comments"], [class*="newsletter"], [class*="popup"] { display: none !important; }
\`);
`,
  counter: (host) => `// ==UserScript==
// @name         Visit counter for ${host}
// @namespace    kitsune
// @version      1.0
// @description  Counts your visits with GM_setValue and shows a small badge
// @match        https://${host}/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

const n = GM_getValue("visits", 0) + 1;
GM_setValue("visits", n);
const b = document.createElement("div");
b.textContent = "Visit #" + n;
b.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:99999;padding:6px 12px;border-radius:99px;background:#f2a03f;color:#111;font:600 13px system-ui";
document.body.append(b);
GM_registerMenuCommand("Reset the count", () => { GM_setValue("visits", 0); b.textContent = "Reset"; });
`,
  style: (host) => `/* ==UserStyle==
@name         My style for ${host}
@namespace    kitsune
@version      1.0
@match        https://${host}/*
==/UserStyle== */

body { font-family: Georgia, serif !important; line-height: 1.7 !important; }
`,
};

// ---------- the manager ----------
export async function manager({ url = "", go = null } = {}) {
  const host = (() => { try { return new URL(url).hostname; } catch { return "example.com"; } })();
  const draw = async () => {
    const list = await all();
    const here = url ? list.filter((s) => runsOn(s.meta, url)) : [];
    m.root.querySelector("#us-body").innerHTML = `
      <div class="toolbar" style="margin:0 0 12px">
        <button class="btn btn-accent btn-sm" type="button" data-new="blank">${icon("plus")}New script</button>
        <button class="btn btn-sm" type="button" data-new="style">${icon("type")}New style</button>
        <button class="btn btn-sm" type="button" data-new="hide">Tidy-up template</button>
        <button class="btn btn-sm" type="button" data-new="counter">Example: visit counter</button>
        ${url ? `<button class="btn btn-sm" type="button" id="us-find">${icon("search")}Find scripts for ${esc(host.replace(/^www\./, ""))}</button>` : ""}
        <button class="btn btn-sm" type="button" id="us-paste">Install from a link</button>
      </div>
      ${url ? `<p class="hint" style="margin:0 0 10px">${here.length ? `${plural(here.length, "script")} ${here.length === 1 ? "matches" : "match"} this page.` : "Nothing you have runs on this page yet."} Scripts run in Live mode; styles run in every mode.</p>` : ""}
      <div id="us-found"></div>
      ${list.length ? `<div class="us-list">${list.map((s) => `<div class="us-row ${s.enabled ? "" : "off"} ${here.includes(s) ? "here" : ""}">
          <label class="us-sw" title="${s.enabled ? "On" : "Off"}"><input type="checkbox" data-toggle="${esc(s.id)}" ${s.enabled ? "checked" : ""} aria-label="Turn ${esc(s.meta.name)} on or off"><i></i></label>
          <span class="us-main"><strong>${esc(s.meta.name)}</strong><small>${esc([s.kind === "style" ? "Style" : "Script", s.meta.version && "v" + s.meta.version, [...s.meta.match, ...s.meta.include][0] || "no @match", here.includes(s) && "runs here"].filter(Boolean).join(" · "))}</small></span>
          <span class="us-acts"><button class="btn btn-sm" type="button" data-edit="${esc(s.id)}">Edit</button>${s.source ? `<button class="btn btn-sm" type="button" data-update="${esc(s.id)}" title="Check the original for a newer version">Update</button>` : ""}<button class="btn btn-sm" type="button" data-export="${esc(s.id)}" aria-label="Save as a file">${icon("download")}</button><button class="btn btn-sm" type="button" data-del="${esc(s.id)}" aria-label="Delete">${icon("trash")}</button></span></div>`).join("")}</div>`
        : `<div class="us-empty"><strong>No userscripts yet.</strong><p>Userscripts change websites to suit you: hide clutter, add buttons, fix annoyances. Find thousands on Greasy Fork, or write your own.</p></div>`}`;
  };
  const m = modal({ title: "Userscripts and styles", wide: true, body: `<div id="us-body"></div>` });
  m.root.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const list = await all();
    if (b.dataset.new) return edit({ code: TEMPLATES[b.dataset.new](host), kind: b.dataset.new === "style" ? "style" : "script" }, draw);
    if (b.dataset.edit) return edit(list.find((s) => s.id === b.dataset.edit), draw);
    if (b.dataset.del) { const s = list.find((x) => x.id === b.dataset.del); if (!(await confirmBox(`Delete “${s.meta.name}”?`, "It and anything it saved are removed. This can't be undone.", "Delete"))) return; await saveAll(list.filter((x) => x.id !== s.id)); const v = { ...((await kvGet("usValues", {})) || {}) }; delete v[s.id]; await kvSet("usValues", v); return draw(); }
    if (b.dataset.export) { const s = list.find((x) => x.id === b.dataset.export); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([s.code], { type: "text/javascript" })); a.download = `${s.meta.name.replace(/[^\w\s-]/g, "").trim() || "userscript"}.user.${s.kind === "style" ? "css" : "js"}`; document.body.append(a); a.click(); a.remove(); return; }
    if (b.dataset.update) { const s = list.find((x) => x.id === b.dataset.update); try { const code = await fetchText(s.source); const nm = parseMeta(code); if (nm.version === s.meta.version) return toast(`“${s.meta.name}” is up to date (v${s.meta.version}).`); await installDialog(code, s.source); draw(); } catch (err) { toast(err.message); } return; }
    if (b.dataset.install) { await installFromUrl(b.dataset.install); return draw(); }
    if (b.id === "us-paste") { const u = prompt("Link to a .user.js (or .user.css) file:"); if (u && /^https?:\/\//.test(u.trim())) { await installFromUrl(u.trim()); draw(); } return; }
    if (b.id === "us-find") return findScripts(host, $("#us-found", m.root));
  });
  m.root.addEventListener("change", async (e) => {
    const t = e.target.closest("[data-toggle]"); if (!t) return;
    const list = await all(); await saveAll(list.map((s) => (s.id === t.dataset.toggle ? { ...s, enabled: t.checked } : s)));
    draw(); void go;
  });
  draw();
}

// ---------- Greasy Fork: scripts other people made for this site ----------
async function findScripts(host, box) {
  const site = host.replace(/^www\./, "").split(".").slice(-2).join(".");
  box.innerHTML = `<p class="status">Looking on Greasy Fork…</p>`;
  let list;
  try { list = await api(`feed?as=json&url=${encodeURIComponent(`https://api.greasyfork.org/en/scripts/by-site/${site}.json`)}`); }
  catch (e) { box.innerHTML = `<p class="status err">${esc(e.message)}</p>`; return; }
  list = (Array.isArray(list) ? list : []).filter((s) => !s.deleted).sort((a, b) => b.total_installs - a.total_installs).slice(0, 30);
  box.innerHTML = list.length ? `<h4 class="kb-mh">On Greasy Fork for ${esc(site)} · ${list.length}</h4><div class="us-found">${list.map((s) => `<div class="us-frow">
      <span class="us-main"><strong>${esc(s.name)}</strong><small>${esc(s.description || "")}</small><em>${Number(s.total_installs).toLocaleString()} installs · v${esc(s.version || "?")}${s.license ? " · " + esc(String(s.license).split(";")[0]) : ""}</em></span>
      <span class="us-acts"><a class="btn btn-sm" href="${esc(s.url)}" target="_blank" rel="noopener">Page</a><button class="btn btn-sm btn-accent" type="button" data-install="${esc(s.code_url)}">Install…</button></span></div>`).join("")}</div>
      <p class="hint">Scripts on Greasy Fork are written by volunteers. Read what a script asks for before you install it.</p>`
    : `<p class="muted">Greasy Fork has no scripts for ${esc(site)}.</p>`;
}

// ---------- the editor ----------
async function edit(rec, after) {
  const isNew = !rec.id;
  const m = modal({ title: isNew ? (rec.kind === "style" ? "New style" : "New userscript") : `Edit “${rec.meta.name}”`, wide: true, body: `
    <div class="us-ed"><div class="us-gutter" id="us-gut" aria-hidden="true"></div><textarea id="us-code" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Code">${esc(rec.code)}</textarea></div>
    <p class="hint" id="us-meta"></p>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="us-save">Save</button>` });
  const ta = $("#us-code", m.root), gut = $("#us-gut", m.root), metaEl = $("#us-meta", m.root);
  const paint = () => {
    const n = ta.value.split("\n").length; gut.textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n"); gut.scrollTop = ta.scrollTop;
    const meta = parseMeta(ta.value);
    metaEl.textContent = meta.name ? `${meta.name}${meta.version ? " v" + meta.version : ""} · runs on ${[...meta.match, ...meta.include].join(", ") || "nothing yet (add @match)"} · ${meta.runAt}` : "Needs a header with at least @name and @match.";
  };
  ta.addEventListener("input", debounce(paint, 120));
  ta.addEventListener("scroll", () => (gut.scrollTop = ta.scrollTop));
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab") { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText("  ", s, ta.selectionEnd, "end"); paint(); }
    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); $("#us-save", m.root).click(); }
    e.stopPropagation();
  });
  paint(); setTimeout(() => ta.focus(), 50);
  $("#us-save", m.root).onclick = async () => {
    const code = ta.value, meta = parseMeta(code);
    if (!meta.name) return toast("Add a ==UserScript== header with an @name first.");
    if (rec.kind === "script") { try { new Function(code); } catch (err) { return toast(`There's a mistake in the code: ${err.message}`); } }
    const list = await all(), now = Date.now();
    const out = { ...rec, id: rec.id || uid("us-"), code, meta, enabled: rec.enabled ?? true, requires: rec.requires || {}, installed: rec.installed || now, updated: now, kind: rec.kind || "script" };
    await saveAll(isNew ? [...list, out] : list.map((s) => (s.id === out.id ? out : s)));
    m.close(); toast(`Saved “${meta.name}”.`); after?.();
  };
}
void $$;
