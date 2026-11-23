// Settings, in tabs: Appearance, Sounds, Reading, Browser, Visual novels, Sync and profiles, Data.
import { ls, esc, toast, confirmBox } from "../util.js";
import { settings, saveSettings, kvGet, kvSet } from "../store.js";

const TABS = [["look", "Appearance"], ["sounds", "Sounds"], ["reading", "Reading"], ["browser", "Browser"], ["vn", "Visual novels"], ["winter", "Winterfest"], ["sync", "Sync and profiles"], ["data", "Data and about"]];
const tabOf = (p) => { const t = (p.querySelector("h3")?.textContent || "").toLowerCase(), id = p.id; if (p.dataset.tab) return p.dataset.tab; if (id === "a11y" || /appearance/.test(t)) return "look"; if (id === "reminder" || /reader|reminder|reading/.test(t)) return "reading"; if (id === "sync" || id === "profiles" || id === "ai") return "sync"; return "data"; };
const DEEP = { data: "data", profiles: "sync", reminder: "reading", sync: "sync", ai: "sync", a11y: "look", browser: "browser", vn: "vn", winter: "winter", sounds: "sounds", reading: "reading", look: "look" };

const row = (label, help, control) => `<div class="setting"><div><strong>${esc(label)}</strong>${help ? `<p>${esc(help)}</p>` : ""}</div>${control}</div>`;
const check = (attr, on, label) => `<label class="check" style="flex:none"><input type="checkbox" ${attr} ${on ? "checked" : ""} aria-label="${esc(label)}"></label>`;
const slider = (attr, min, max, v, label) => `<input type="range" ${attr} min="${min}" max="${max}" value="${v}" aria-label="${esc(label)}" style="width:170px">`;

// ---------- Winterfest ----------
async function winterPanel(p) {
  const X = await import("../xmas/core.js"), F = await import("../xmas/fx.js"), s = await X.loadXmas();
  const opts = [["on", "Winterfest", "The whole event. Your Snowbells, pets and prizes stay safe if you turn it off."], ["snow", "Snowfall", "Light snow over the app. It stops while you read."], ["lights", "Fairy lights", "A string of lights along the top bar."], ["pet", "Pet companion", "Your pet walks along the bottom of the screen. It never blocks a click."], ["readers", "Pet in the readers", "Let your pet keep you company while you read."], ["drops", "Surprise presents", "A present sometimes appears for you to open."], ["strips", "Winterfest cards", "A small card at the top of each page."]];
  p.innerHTML = `<h3 class="h3">Winterfest</h3><p class="muted" style="margin-top:-6px">Runs November 15 to January 6. <a href="#xmas">Open the event</a>.</p>${opts.map(([k, l, h]) => row(l, h, check(`data-xo="${k}"`, s.opts[k], l))).join("")}`;
  p.querySelectorAll("[data-xo]").forEach((c) => (c.onchange = () => { s.opts[c.dataset.xo] = c.checked; X.save(); F.applyXmas(); }));
}

// ---------- Sounds ----------
async function soundsPanel(p) {
  const { SOUND_PACKS, SFX_EVENTS, playSound, eventOn } = await import("../sfx.js");
  p.innerHTML = `<h3 class="h3">Sound effects</h3><p class="muted" style="margin-top:-6px">Made on your device, so nothing downloads. Tap a pack to hear it.</p><div class="chips" id="sx-p">${Object.entries(SOUND_PACKS).filter(([k]) => !["sleigh", "musicbox"].includes(k) || ls.get("xmasOwned", []).includes(k)).map(([k, l]) => `<button class="chip" type="button" data-p="${k}" aria-pressed="${(settings.uiSound || "off") === k}">${esc(l)}</button>`).join("")}</div>
    <div style="margin-top:12px">${row("Volume", "", slider('id="sx-v"', 5, 100, settings.uiSoundVol ?? 40, "Sound volume"))}${row("Pitch", "Lower or higher than the pack's normal sound.", slider('id="sx-t"', 60, 160, settings.uiSoundPitch ?? 100, "Sound pitch"))}</div>
    <h3 class="h3" style="margin-top:16px">What makes a sound</h3><div style="display:grid;gap:2px" id="sx-e">${Object.entries(SFX_EVENTS).map(([k, l]) => `<div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid var(--line)"><label class="check" style="flex:1;margin:0"><input type="checkbox" data-e="${k}" ${eventOn(settings, k) ? "checked" : ""}> ${esc(l)}</label><button class="btn btn-sm" type="button" data-try="${k}" aria-label="Play: ${esc(l)}">Play</button></div>`).join("")}</div>`;
  const pack = () => { const k = settings.uiSound; return k && k !== "off" ? k : "soft"; }, vol = () => settings.uiSoundVol ?? 40, pit = () => settings.uiSoundPitch ?? 100;
  p.querySelector("#sx-p").onclick = (e) => { const b = e.target.closest("[data-p]"); if (!b) return; settings.uiSound = b.dataset.p; saveSettings(); p.querySelectorAll("[data-p]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); if (b.dataset.p !== "off") { playSound("turn", b.dataset.p, vol(), pit()); setTimeout(() => playSound("done", b.dataset.p, vol(), pit()), 300); } };
  p.querySelector("#sx-v").onchange = (e) => { settings.uiSoundVol = +e.target.value; saveSettings(); playSound("success", pack(), vol(), pit()); };
  p.querySelector("#sx-t").onchange = (e) => { settings.uiSoundPitch = +e.target.value; saveSettings(); playSound("success", pack(), vol(), pit()); };
  p.querySelector("#sx-e").addEventListener("change", (e) => { const k = e.target.dataset.e; if (!k) return; settings.sfxOn = { ...(settings.sfxOn || {}), [k]: e.target.checked }; saveSettings(); });
  p.querySelector("#sx-e").addEventListener("click", (e) => { const b = e.target.closest("[data-try]"); if (b) playSound(b.dataset.try, pack(), vol(), pit()); });
}

// ---------- Browser ----------
const BROWSER = [
  ["Tabs", [["webVTabs", 0, "Vertical tabs", "Show tabs down the side."], ["webReuseTab", 0, "Reuse open tabs", "Go to a tab that already has the page."], ["webNoTabPeek", 1, "Tab previews", "Hover a tab to see what's in it."]]],
  ["Reading pages", [["webEndless", 0, "Endless pages", "Load the next page as you reach the bottom."], ["webParaFocus", 0, "Paragraph focus", "Dim everything but the paragraph you're on."], ["webMagnifier", 0, "Magnifier", "Hold to magnify part of a page."], ["webNoMinutesLeft", 1, "Minutes left", "Show an estimate on long pages."], ["webNoAge", 1, "Publication dates", "Show how old an article is."], ["webNoFootnotes", 1, "Footnote pop-ups", "Hover or tap a footnote to read it."], ["webNoTerms", 1, "Highlight search words", "Mark what you searched for on the page."], ["webNoTopBtn", 1, "Back-to-top button", "On long pages."]]],
  ["Comfort", [["webTouch", 0, "Bigger links and buttons", "Easier to tap."], ["webNoMotion", 0, "Stop page animations", "Calms moving pages."], ["webNoGestures", 1, "Swipe gestures", "Swipe from an edge to go back."], ["webDarkNight", 0, "Dark pages at night", "Darken sites after sunset."]]],
  ["Media and helpers", [["webAutoEmbed", 2, "Turn video links into players", "YouTube and other links play in the page."], ["webNoSchemaChip", 1, "Page info button", "Recipes, products and more."], ["webNoAniChip", 1, "“Find this series” button", "On manga and anime pages."], ["webNoComicChip", 1, "Comic reader button", "On pages that look like comics."], ["webNoEbookChip", 1, "Ebook button", "On pages with ebooks."]]],
  ["Speed and privacy", [["webProgressive", 0, "Load long pages in chunks", "Opt-in. Can help on very long pages."], ["webNoPrefetch", 1, "Load links ahead of time", "Faster clicks, slightly more data."], ["webNoBatterySaver", 1, "Battery saver", "Eases off when the battery is low."], ["webNoIndex", 1, "Remember pages for search", "Lets you search pages you've read."]]],
];
const getB = (k, mode) => { let v = null; try { v = localStorage.getItem("kitsune." + k); } catch {} return mode === 1 ? v !== "1" : mode === 2 ? v !== "0" : v === "1"; };
const setB = (k, mode, on) => { try { const key = "kitsune." + k; if (mode === 2) localStorage.setItem(key, on ? "1" : "0"); else if (mode === 1 ? !on : on) localStorage.setItem(key, "1"); else localStorage.removeItem(key); } catch {} };
async function browserPanel(p) {
  let engines = {}; try { engines = (await import("./web.js")).ENGINES || {}; } catch {}
  const cur = (() => { try { return localStorage.getItem("kitsune.webEngine") || "marginalia"; } catch { return "marginalia"; } })();
  p.innerHTML = `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:6px"><h3 class="h3" style="margin:0">Browser</h3><a class="btn btn-sm" href="#web">Open Browser</a></div>${row("Search engine", "Used when you type something that isn't a web address.", `<select class="field" id="br-e" aria-label="Search engine" style="max-width:220px">${Object.entries(engines).map(([k, x]) => `<option value="${esc(k)}" ${k === cur ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>`)}${BROWSER.map(([g, l]) => `<h3 class="h3" style="margin-top:16px">${esc(g)}</h3>${l.map(([k, m, n, h]) => row(n, h, check(`data-b="${k}" data-m="${m}"`, getB(k, m), n))).join("")}`).join("")}<p class="muted" style="font-size:13px;margin-bottom:0">Changes apply the next time a page loads.</p>`;
  p.querySelector("#br-e")?.addEventListener("change", (e) => { try { localStorage.setItem("kitsune.webEngine", e.target.value); } catch {} toast("Search engine changed."); });
  p.addEventListener("change", (e) => { const k = e.target.dataset.b; if (k) setB(k, +e.target.dataset.m, e.target.checked); });
}

// ---------- Visual novels ----------
async function vnPanel(p) {
  const [V, C, O] = await Promise.all([import("./vn.js"), import("../vnchar.js"), import("../originals.js")]), P = (settings.vn ||= { speed: 45, size: 20, box: 82, auto: 50, voice: false }); if (P.choices === undefined) P.choices = true;
  const all = (await kvGet("vnSaves", {})) || {}, list = Object.values(all), cat = V.vnCatalog(), db = await V.loadCast(), allowed = new Set(["kitsune", ...cat.map((x) => x.sid).filter(Boolean)]), names = Object.keys(db).filter((k) => allowed.has(k.split(":")[0])), series = { kitsune: "Kitsune Originals", ...Object.fromEntries(O.SERIES.map((s) => [s.id, s.title])) };
  const tog = (k, n, h, dflt = true) => row(n, h, check(`data-v="${k}"`, P[k] === undefined ? dflt : P[k] !== false && !!P[k], n)), rng = (k, n, a, z) => row(n, "", slider(`data-r="${k}"`, a, z, P[k] ?? 50, n));
  p.innerHTML = `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:6px"><h3 class="h3" style="margin:0">Visual novels</h3><a class="btn btn-sm" href="#vn">Open visual novels</a></div>
    <p class="muted" style="margin:4px 0 10px">${cat.length} titles · ${list.length} started · ${list.filter((x) => x.done).length} finished · ${list.reduce((a, x) => a + Object.keys(x.endings || {}).length, 0)} endings found</p>
    ${rng("speed", "Text speed", 5, 100)}${rng("auto", "Auto-play speed", 5, 100)}${rng("size", "Text size", 14, 34)}${rng("box", "Text box opacity", 20, 100)}
    ${tog("choices", "Choices", "Turn off to read straight through.")}${tog("cast", "Show characters", "Hide portraits for a plain text-and-scene view.")}${tog("outfits", "Outfits change with the scene", "Coats in the snow, campus jackets at school, and so on.")}${tog("poses", "Character poses", "Characters tilt and look around as they talk.")}${tog("weather", "Rain, snow and embers", "Moving weather on the scenes.")}${tog("voice", "Read aloud", "Uses your device's voices.", false)}
    <h3 class="h3" style="margin-top:16px">Character gallery</h3><p class="muted" style="margin-top:-6px">${names.length} characters, each with their own design, in ${Object.keys(C.OUTFITS).length} outfits, ${Object.keys(C.MOODS).length} expressions and ${Object.keys(C.POSES).length} poses.</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap"><input class="field" type="search" id="vg-q" placeholder="Search characters" aria-label="Search characters" style="flex:1 1 160px"><select class="field" id="vg-s" aria-label="Series"><option value="">All series</option>${[...allowed].map((s) => `<option value="${esc(s)}">${esc(series[s] || s)}</option>`).join("")}</select></div>
    <div id="vg-big" hidden style="margin-top:10px;padding:10px;border:1px solid var(--line);border-radius:12px"></div><div id="vg-l" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:6px;max-height:380px;overflow:auto;margin-top:10px"></div>
    <div style="margin-top:14px">${row("Reset visual novel progress", "Clears saves, choices and endings. Your stories stay.", `<button class="btn" type="button" id="vg-reset">Reset…</button>`)}</div>`;
  p.addEventListener("change", (e) => { const k = e.target.dataset.v; if (k) { P[k] = e.target.checked; saveSettings(); } const r = e.target.dataset.r; if (r) { P[r] = +e.target.value; saveSettings(); } });
  const label = (k) => k.slice(k.indexOf(":") + 1);
  let shown = 60; const draw = () => { const q = p.querySelector("#vg-q").value.toLowerCase().trim(), s = p.querySelector("#vg-s").value, l = names.filter((k) => (!s || k.startsWith(s + ":")) && (!q || label(k).toLowerCase().includes(q))); p.querySelector("#vg-l").innerHTML = l.slice(0, shown).map((k) => `<button type="button" data-c="${esc(k)}" style="all:unset;box-sizing:border-box;cursor:pointer;text-align:center;font:600 11px/1.2 system-ui;padding:4px;border-radius:8px;border:1px solid var(--line)"><span style="display:block;height:96px;overflow:hidden">${C.characterSvg(label(k), db[k], "calm", {})}</span>${esc(label(k))}</button>`).join("") + (l.length > shown ? `<button class="btn btn-sm" type="button" id="vg-more" style="grid-column:1/-1">Show more (${l.length - shown})</button>` : "") || `<p class="muted">No one by that name.</p>`; };
  const big = (k) => { const b = p.querySelector("#vg-big"), d = db[k]; let st = { mood: "calm", outfit: d.f || "casual", pose: "front" }; const seg = (name, o) => `<div class="chips" data-g="${name}" style="margin-top:6px">${Object.entries(o).map(([v, t]) => `<button class="chip" type="button" data-x="${v}" aria-pressed="${st[name] === v}" style="padding:3px 9px;font-size:12px">${esc(t)}</button>`).join("")}</div>`; const pic = () => { b.querySelector("#vg-pic").innerHTML = C.characterSvg(label(k), d, st.mood, { outfit: st.outfit, pose: st.pose }); }; b.hidden = false; b.innerHTML = `<div style="display:flex;gap:12px;flex-wrap:wrap"><div id="vg-pic" style="width:170px;height:238px;flex:none;background:rgba(127,127,160,.14);border-radius:10px;overflow:hidden"></div><div style="flex:1;min-width:190px"><b>${esc(label(k))}</b> <small class="muted">${esc(series[k.split(":")[0]] || "")}</small>${seg("mood", C.MOODS)}${seg("outfit", C.OUTFITS)}${seg("pose", C.POSES)}</div></div>`; pic(); b.onclick = (e) => { const x = e.target.closest("[data-x]"); if (!x) return; const g = x.closest("[data-g]"); st[g.dataset.g] = x.dataset.x; g.querySelectorAll("[data-x]").forEach((y) => y.setAttribute("aria-pressed", String(y === x))); pic(); }; b.scrollIntoView({ block: "nearest" }); };
  p.querySelector("#vg-q").oninput = () => { shown = 60; draw(); }; p.querySelector("#vg-s").onchange = () => { shown = 60; draw(); };
  p.querySelector("#vg-l").onclick = (e) => { if (e.target.closest("#vg-more")) { shown += 60; return draw(); } const c = e.target.closest("[data-c]"); if (c) big(c.dataset.c); };
  p.querySelector("#vg-reset").onclick = async () => { if (await confirmBox("Reset visual novel progress?", "This deletes all your visual novel saves, choices and endings on this device. It can't be undone.", "Reset")) { kvSet("vnSaves", {}); toast("Visual novel progress cleared."); vnPanel(p); } };
  draw();
}

export function mountTabs(view, params = []) {
  const box = view.querySelector(".settings"); if (!box) return;
  for (const [id] of [["sounds"], ["browser"], ["vn"], ["winter"]]) { const p = document.createElement("div"); p.className = "panel"; p.id = "st-" + id; p.dataset.tab = id; p.innerHTML = `<p class="muted" style="margin:0">Loading…</p>`; box.append(p); }
  const bar = document.createElement("div"); bar.className = "chips"; bar.setAttribute("role", "tablist"); bar.setAttribute("aria-label", "Settings sections"); bar.style.cssText = "position:sticky;top:64px;z-index:6;padding:8px;border-radius:12px;background:var(--surface);border:1px solid var(--line)"; bar.innerHTML = TABS.map(([k, l]) => `<button class="chip" type="button" role="tab" data-st="${k}">${esc(l)}</button>`).join(""); box.prepend(bar);
  const loaded = {}, loaders = { sounds: soundsPanel, browser: browserPanel, vn: vnPanel, winter: winterPanel };
  const applyTab = (k) => { for (const p of box.querySelectorAll(":scope > .panel")) p.hidden = tabOf(p) !== k; };
  let cur = DEEP[params[0]] || (() => { try { return sessionStorage.getItem("kitsune.settingsTab"); } catch { return null; } })() || "look"; if (!TABS.some((t) => t[0] === cur)) cur = "look";
  const open = (k) => { cur = k; try { sessionStorage.setItem("kitsune.settingsTab", k); } catch {} bar.querySelectorAll("[data-st]").forEach((b) => { const on = b.dataset.st === k; b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-selected", String(on)); }); applyTab(k); if (loaders[k] && !loaded[k]) { loaded[k] = true; loaders[k](box.querySelector("#st-" + k)).catch((e) => { box.querySelector("#st-" + k).innerHTML = `<p class="muted">${esc(e.message)}</p>`; loaded[k] = false; }); } };
  bar.onclick = (e) => { const b = e.target.closest("[data-st]"); if (b) { open(b.dataset.st); window.scrollTo({ top: 0 }); } };
  new MutationObserver(() => applyTab(cur)).observe(box, { childList: true });
  open(cur);
}
