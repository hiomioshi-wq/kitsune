// The cursor picker in Settings: browse by group, search, favourites, size, a separate cursor for links,
// cursors that change by themselves, trails and click effects.
import { esc, toast, ls } from "../util.js";
import { settings, saveSettings } from "../store.js";
import { CURSORS, cursorCss, AUTO_CURSOR, effectiveCursor } from "../themes.js";
import { CURSOR_GROUPS } from "../cursors.js";
import { TRAILS, CLICKS, preview } from "../cursorfx.js";

const SIZES = [[24, "Small"], [32, "Medium"], [48, "Large"], [64, "Huge"]];
const urlOf = (k) => cursorCss(k)?.match(/url\("([^"]+)"\)/)?.[1] || "";
const opts = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${k === v ? "selected" : ""}>${esc(l)}</option>`).join("");

export function mountCursorPicker(box) {
  let group = "All";
  const owned = ls.get("xmasOwned", []), entries = Object.entries(CURSORS).filter(([k, c]) => !c.xmas || owned.includes(k)), custom = () => ls.get("customCursorUrl", ""), favs = () => settings.cursorFavs || [], fx = () => (settings.cursorFx ||= { trail: settings.trail ? "foxfire" : "none", click: "none", quiet: true });
  const groupOf = (c) => c.group || "Classic", names = Object.fromEntries([["", "Same as my cursor"], ...entries.filter(([k]) => k !== "default").map(([k, c]) => [k, c.name])]);
  box.innerHTML = `<style>.cp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:6px;max-height:340px;overflow:auto;padding:3px;margin-top:10px}.cp-w{position:relative;display:grid}.cp-t{display:grid;justify-items:center;align-content:start;gap:3px;padding:8px 3px;border-radius:10px;border:2px solid var(--line);background:var(--surface);color:inherit;font:500 11px/1.2 system-ui;text-align:center}.cp-t[aria-pressed=true]{border-color:var(--accent)}.cp-t img{width:32px;height:32px}.cp-t span.ph{width:32px;height:32px;display:grid;place-items:center;font-size:18px}.cp-f{all:unset;position:absolute;top:2px;right:4px;font-size:13px;line-height:1;padding:2px;opacity:.45;cursor:pointer}.cp-f[aria-pressed=true]{opacity:1;color:#e3b04b}.cp-f:hover,.cp-f:focus-visible{opacity:1}.cp-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:12px}.cp-row label{display:grid;gap:3px;font-size:13px;font-weight:600}</style>
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div><strong>Cursor</strong><p class="muted" style="margin:2px 0 0;font-size:14px" id="cp-now"></p></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm" type="button" id="cp-rand">Surprise me</button><a class="btn btn-sm" href="#studio">Upload your own</a></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center"><input class="field" type="search" id="cp-q" placeholder="Search cursors" aria-label="Search cursors" style="flex:1 1 160px"><div class="seg" id="cp-size" role="group" aria-label="Cursor size">${SIZES.map(([v, l]) => `<button type="button" data-z="${v}" aria-pressed="${(settings.cursorSize || 32) === v}">${l}</button>`).join("")}</div></div>
    <div class="chips" id="cp-g" style="margin-top:8px">${["All", "Favourites", ...CURSOR_GROUPS.filter((g) => g !== "Winterfest" || entries.some(([, c]) => c.xmas))].map((g) => `<button class="chip" type="button" data-g="${esc(g)}" aria-pressed="${g === "All"}">${g === "Favourites" ? "★ " : ""}${esc(g)}</button>`).join("")}</div><div class="cp-grid" id="cp-l"></div>
    <div class="cp-row"><label>Over links and buttons<select class="field" id="cp-link">${opts(names, settings.cursorLink || "")}</select></label><label>Change by itself<select class="field" id="cp-auto">${opts(AUTO_CURSOR, settings.cursorAuto || "off")}</select></label><label>Trail<span style="display:flex;gap:6px"><select class="field" id="cp-trail" style="flex:1;min-width:0">${opts(TRAILS, fx().trail)}</select><button class="btn btn-sm" type="button" id="cp-try-t">Try</button></span></label><label>When you click<span style="display:flex;gap:6px"><select class="field" id="cp-click" style="flex:1;min-width:0">${opts(CLICKS, fx().click)}</select><button class="btn btn-sm" type="button" id="cp-try-c">Try</button></span></label></div>
    <label class="check" style="margin-top:10px"><input type="checkbox" id="cp-quiet" ${fx().quiet !== false ? "checked" : ""}> Pause trails and click effects while reading</label>
    <div id="cp-motion" hidden style="margin-top:6px"><p class="muted" style="font-size:12px;margin:0 0 4px">Your device asks for reduced motion, so effects are off.</p><label class="check"><input type="checkbox" id="cp-force" ${fx().force ? "checked" : ""}> Show cursor effects anyway</label></div>`;
  const $ = (s) => box.querySelector(s);
  if (document.documentElement.dataset.motion !== "reduce" && matchMedia("(prefers-reduced-motion: reduce)").matches) $("#cp-motion").hidden = false;
  $("#cp-force").onchange = (e) => { fx().force = e.target.checked; saveSettings(); };
  const label = () => { const k = effectiveCursor(settings), auto = settings.cursorAuto && settings.cursorAuto !== "off"; $("#cp-now").textContent = `Using: ${k === "custom" ? "your own cursor" : CURSORS[k]?.name || "System"}${auto ? ` (${AUTO_CURSOR[settings.cursorAuto].toLowerCase()})` : ""}. Touch screens don't show cursors.`; };
  const draw = () => {
    const s = $("#cp-q").value.toLowerCase().trim(), cur = settings.cursor || "default", f = favs();
    const list = entries.filter(([k, c]) => (group === "All" || (group === "Favourites" ? f.includes(k) : k !== "default" && groupOf(c) === group)) && (!s || c.name.toLowerCase().includes(s) || groupOf(c).toLowerCase().includes(s)));
    $("#cp-l").innerHTML = list.map(([k, c]) => { const u = k === "default" ? "" : urlOf(k), hover = k === "default" ? "" : esc((cursorCss(k).match(/cursor:([^;}]+)/) || [])[0] || ""); return `<div class="cp-w"><button class="cp-t" type="button" data-c="${k}" aria-pressed="${cur === k}" style="${hover}">${u ? `<img alt="" loading="lazy" src="${esc(u)}">` : `<span class="ph">↖</span>`}<span>${esc(c.name)}</span></button>${k === "default" ? "" : `<button class="cp-f" type="button" data-fav="${k}" aria-pressed="${f.includes(k)}" aria-label="${f.includes(k) ? "Remove from" : "Add to"} favourites: ${esc(c.name)}">${f.includes(k) ? "★" : "☆"}</button>`}</div>`; }).join("") + (group === "All" && !s && custom() ? `<div class="cp-w"><button class="cp-t" type="button" data-c="custom" aria-pressed="${cur === "custom"}"><img alt="" src="${esc(custom())}"><span>Your cursor</span></button></div>` : "") || `<p class="muted">${group === "Favourites" && !s ? "Tap the ☆ on a cursor to keep it here. “Change by itself: every day” picks from these." : "No cursor by that name."}</p>`;
    label();
  };
  const pick = (k) => { settings.cursor = k; if (settings.cursorAuto && settings.cursorAuto !== "off") { settings.cursorAuto = "off"; $("#cp-auto").value = "off"; toast("Auto-change is off, since you picked a cursor."); } saveSettings(); box.querySelectorAll("[data-c]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.c === k))); label(); };
  $("#cp-l").onclick = (e) => { const fv = e.target.closest("[data-fav]"); if (fv) { const k = fv.dataset.fav, l = favs(); settings.cursorFavs = l.includes(k) ? l.filter((x) => x !== k) : [...l, k]; saveSettings(); draw(); return; } const b = e.target.closest("[data-c]"); if (b) pick(b.dataset.c); };
  $("#cp-q").oninput = draw;
  $("#cp-g").onclick = (e) => { const b = e.target.closest("[data-g]"); if (!b) return; group = b.dataset.g; box.querySelectorAll("[data-g]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); };
  $("#cp-size").onclick = (e) => { const b = e.target.closest("[data-z]"); if (!b) return; settings.cursorSize = +b.dataset.z; saveSettings(); box.querySelectorAll("[data-z]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); };
  $("#cp-rand").onclick = () => { const l = entries.filter(([k]) => k !== "default" && k !== settings.cursor), [k, c] = l[Math.floor(Math.random() * l.length)]; group = "All"; $("#cp-q").value = ""; box.querySelectorAll("[data-g]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.g === "All"))); pick(k); draw(); box.querySelector(`[data-c="${k}"]`)?.scrollIntoView({ block: "nearest" }); toast(`Cursor: ${c.name}`); };
  $("#cp-link").onchange = (e) => { settings.cursorLink = e.target.value; saveSettings(); };
  $("#cp-auto").onchange = (e) => { settings.cursorAuto = e.target.value; saveSettings(); label(); };
  $("#cp-trail").onchange = (e) => { fx().trail = e.target.value; settings.trail = e.target.value !== "none"; saveSettings(); };
  $("#cp-click").onchange = (e) => { fx().click = e.target.value; saveSettings(); };
  $("#cp-quiet").onchange = (e) => { fx().quiet = e.target.checked; saveSettings(); };
  const at = (b) => { const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top - 18]; };
  $("#cp-try-t").onclick = (e) => { const v = $("#cp-trail").value; if (v === "none") return toast("Pick a trail first."); preview("trail", v, ...at(e.currentTarget)); };
  $("#cp-try-c").onclick = (e) => { const v = $("#cp-click").value; if (v === "none") return toast("Pick an effect first."); preview("click", v, ...at(e.currentTarget)); };
  draw();
}
