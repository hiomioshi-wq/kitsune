// Theme studio: pick or build a theme, choose a cursor, share themes as codes.
import { $, $$, esc, icon, toast, modal, confirmBox, ls } from "../util.js";
import { settings, saveSettings } from "../store.js";
import { PRESETS, FONT_CHOICES, DISPLAY_CHOICES, CURSORS, contrast, themeCss, getCustomThemes, saveCustomThemes, encodeTheme, decodeTheme, imageToCursor, cursorCss } from "../themes.js";
import { setCrumbs } from "../main.js";

const BUILTIN = { system: ["Follow my device", "#eef0f6", "#11132a"], light: ["Kitsune light", "#eef0f6", "#ffffff"], dark: ["Kitsune dark", "#11132a", "#1a1d39"] };

function swatchCard(choice, t, active) {
  return `<button class="theme-card ${active ? "on" : ""}" type="button" data-choice="${esc(choice)}" aria-pressed="${active}">
    <span class="tc-preview" style="background:${t.bg};color:${t.ink};border-color:${t.line}">
      <span class="tc-bar" style="background:${t.surface};border-color:${t.line}"><i style="background:${t.accent}"></i><i style="background:${t.muted};opacity:.5"></i></span>
      <span class="tc-lines"><b style="background:${t.ink}"></b><b style="background:${t.muted}"></b><b style="background:${t.muted};width:40%"></b></span>
      <span class="tc-btn" style="background:${t.accent}"></span>
    </span>
    <span class="tc-name">${esc(t.name)}</span><span class="tc-mode">${t.mode === "light" ? "Light" : t.mode === "dark" ? "Dark" : "Auto"}</span>
  </button>`;
}

export async function render(view) {
  setCrumbs([["Settings", "settings"], ["Theme studio", ""]]);
  const custom = getCustomThemes();
  const cur = settings.theme;
  const customCursor = ls.get("customCursorUrl", "");
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Make it yours</p><h1 class="h1">Theme studio</h1>
      <p class="lede">Pick a theme, build your own colours and fonts, and choose a cursor. Themes are saved per profile and can be shared as a code.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="st-import">${icon("download")}Import a theme code</button><button class="btn btn-accent" type="button" id="st-new">${icon("plus")}New theme</button></div></div>

    <section class="section" style="margin-top:0"><h2 class="h2" style="margin-bottom:14px">Kitsune</h2>
      <div class="theme-grid">${Object.entries(BUILTIN).map(([k, [name, bg, surface]]) => swatchCard(k, { name, bg, surface, ink: k === "dark" ? "#ecebf6" : "#1b1d33", muted: "#8a8db0", line: k === "dark" ? "#2b2f55" : "#d7dae6", accent: k === "dark" ? "#f2a03f" : "#c9661a", mode: k === "system" ? "auto" : k }, cur === k)).join("")}</div></section>

    <section class="section"><h2 class="h2" style="margin-bottom:14px">Presets</h2>
      <div class="theme-grid">${Object.entries(PRESETS).map(([k, t]) => swatchCard("preset:" + k, t, cur === "preset:" + k)).join("")}</div></section>

    <section class="section"><div class="section-head"><h2 class="h2">Your themes</h2></div>
      ${Object.keys(custom).length ? `<div class="theme-grid">${Object.entries(custom).map(([id, t]) => `<div class="theme-wrap">${swatchCard("custom:" + id, t, cur === "custom:" + id)}
        <div class="tc-actions"><button class="btn btn-sm" type="button" data-edit="${esc(id)}">Edit</button><button class="btn btn-sm" type="button" data-share="${esc(id)}">Share</button><button class="icon-btn" type="button" data-del="${esc(id)}" aria-label="Delete ${esc(t.name)}">${icon("trash")}</button></div></div>`).join("")}</div>`
        : `<p class="muted" style="margin:0">None yet. Start from a preset with <strong>New theme</strong>, or import a code someone shared.</p>`}</section>

    <section class="section"><h2 class="h2" style="margin-bottom:6px">Cursor</h2>
      <p class="muted" style="margin:0 0 14px">Hover a tile to try it. Touch screens don't show cursors.</p>
      <div class="cursor-grid">${Object.entries(CURSORS).map(([k, c]) => `<button class="cursor-tile ${ (settings.cursor || "default") === k ? "on" : ""}" type="button" data-cursor="${k}" style="${k === "default" ? "" : esc(cursorCss(k).match(/cursor:([^;}]+)/)[1].replace(/,auto$/, ",auto").replace(/^/, "cursor:"))}">
          <span class="ct-prev">${k === "default" ? icon("next") : `<img alt="" src="${esc(cursorCss(k).match(/url\("([^"]+)"\)/)[1])}">`}</span><span>${esc(c.name)}</span></button>`).join("")}
        <button class="cursor-tile ${settings.cursor === "custom" ? "on" : ""}" type="button" data-cursor="custom" ${customCursor ? `style="cursor:url('${esc(customCursor)}') 2 2,auto"` : ""}>
          <span class="ct-prev">${customCursor ? `<img alt="" src="${esc(customCursor)}">` : icon("upload")}</span><span>${customCursor ? "Your cursor" : "Upload your own"}</span></button>
      </div>
      <input type="file" id="st-cursor-file" accept="image/png,image/svg+xml,image/gif,image/webp" hidden>
      <label class="check" style="margin-top:16px"><input type="checkbox" id="st-trail" ${settings.trail ? "checked" : ""}> Foxfire trail: little blue kitsune-bi flames follow your mouse (off if your device asks for reduced motion)</label>
    </section>`;

  const choose = (choice) => {
    settings.theme = choice; saveSettings();
    if (!/:/.test(choice)) { document.getElementById("kt-theme")?.remove(); ls.set("themeCss", ""); }
    $$(".theme-card", view).forEach((c) => { const on = c.dataset.choice === choice; c.classList.toggle("on", on); c.setAttribute("aria-pressed", String(on)); });
  };
  view.addEventListener("click", async (e) => {
    const card = e.target.closest(".theme-card"); if (card) return choose(card.dataset.choice);
    const ed = e.target.closest("[data-edit]"); if (ed) return editTheme(view, ed.dataset.edit);
    const sh = e.target.closest("[data-share]");
    if (sh) {
      const code = encodeTheme(getCustomThemes()[sh.dataset.share]);
      try { await navigator.clipboard.writeText(code); toast("Theme code copied. Paste it into Import a theme code on any Kitsune."); }
      catch { modal({ title: "Theme code", body: `<textarea class="field" rows="4" readonly>${esc(code)}</textarea>` }); }
      return;
    }
    const del = e.target.closest("[data-del]");
    if (del) {
      const all = getCustomThemes(), t = all[del.dataset.del];
      if (!(await confirmBox(`Delete “${t.name}”?`, "This theme is removed from this profile.", "Delete"))) return;
      delete all[del.dataset.del]; saveCustomThemes(all);
      if (settings.theme === "custom:" + del.dataset.del) choose("system");
      return render(view);
    }
    const cu = e.target.closest("[data-cursor]");
    if (cu) {
      if (cu.dataset.cursor === "custom" && !ls.get("customCursorUrl", "")) return $("#st-cursor-file", view).click();
      settings.cursor = cu.dataset.cursor; saveSettings();
      $$(".cursor-tile", view).forEach((x) => x.classList.toggle("on", x === cu));
    }
  });
  view.addEventListener("dblclick", (e) => { if (e.target.closest('[data-cursor="custom"]')) $("#st-cursor-file", view).click(); });
  $("#st-cursor-file", view).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { ls.set("customCursorUrl", await imageToCursor(f, 32)); settings.cursor = "custom"; saveSettings(); toast("Your cursor is on. Double-click its tile to replace it."); render(view); }
    catch { toast("That image couldn't be used. Try a small PNG or SVG."); }
  };
  $("#st-trail", view).onchange = (e) => { settings.trail = e.target.checked; settings.cursorFx = { ...(settings.cursorFx || { click: "none", quiet: true }), trail: e.target.checked ? "foxfire" : "none" }; saveSettings(); };
  $("#st-new", view).onclick = () => editTheme(view, null);
  $("#st-import", view).onclick = () => {
    const m = modal({ title: "Import a theme code", body: `<textarea class="field" id="ti-code" rows="4" placeholder="KITSUNE-THEME:…" autofocus></textarea><p class="status" id="ti-s"></p>`,
      actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="ti-go">Import</button>` });
    $("#ti-go", m.root).onclick = () => {
      try {
        const t = decodeTheme($("#ti-code", m.root).value);
        const all = getCustomThemes(), id = Date.now().toString(36);
        all[id] = t; saveCustomThemes(all); m.close(); choose("custom:" + id); render(view);
        toast(`Imported “${t.name}”.`);
      } catch (err) { $("#ti-s", m.root).className = "status err"; $("#ti-s", m.root).textContent = err.message; }
    };
  };
}

// ---------- editor with live preview ----------
function editTheme(view, id) {
  const all = getCustomThemes();
  const base = id ? all[id] : (settings.theme.startsWith("preset:") ? PRESETS[settings.theme.slice(7)] : settings.theme.startsWith("custom:") ? all[settings.theme.slice(7)] : PRESETS.sumi);
  const t = { ...base, name: id ? base.name : `My ${base?.name || "theme"}` };
  const fields = [["bg", "Background"], ["surface", "Cards & panels"], ["ink", "Text"], ["muted", "Quiet text"], ["line", "Borders"], ["accent", "Accent"]];
  const m = modal({ title: id ? `Edit ${t.name}` : "New theme", wide: true, body: `
    <div class="studio">
      <form class="form" id="te-f">
        <div class="row2"><div><label class="lbl" for="te-name">Name</label><input class="field" id="te-name" value="${esc(t.name)}" maxlength="40"></div>
          <div><span class="lbl">Base</span><div class="seg" id="te-mode"><button type="button" data-m="light" aria-pressed="${t.mode === "light"}">Light</button><button type="button" data-m="dark" aria-pressed="${t.mode === "dark"}">Dark</button></div></div></div>
        <div class="colors">${fields.map(([k, l]) => `<label class="color-field"><input type="color" data-k="${k}" value="${t[k]}"><span>${l}</span><code>${t[k]}</code></label>`).join("")}</div>
        <div class="row2"><div><label class="lbl" for="te-font">Text font</label><select class="field" id="te-font">${Object.entries(FONT_CHOICES).map(([k, [, l]]) => `<option value="${k}" ${t.font === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
          <div><label class="lbl" for="te-disp">Headings font</label><select class="field" id="te-disp">${Object.entries(DISPLAY_CHOICES).map(([k, l]) => `<option value="${k}" ${t.display === k ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
        <p class="status" id="te-check"></p>
      </form>
      <div class="studio-preview" id="te-prev"></div>
    </div>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="te-save">${id ? "Save" : "Save and use"}</button>` });
  const root = m.root;
  const draw = () => {
    // Scoped preview: the same CSS the theme will use, applied inside the preview box only.
    const css = themeCss(t).replace(/html:root\[data-theme\] body/g, "#te-prev").replace(/html:root\[data-theme\]/g, "#te-prev");
    $("#te-prev", root).innerHTML = `<style>${css} #te-prev{background:var(--bg);color:var(--ink);font-family:var(--f-body)}</style>
      <div class="pv-top"><svg style="width:20px;height:26px;color:var(--ink)"><use href="#fox"/></svg><strong style="font-family:var(--f-display);letter-spacing:.1em">KITSUNE</strong><span style="margin-left:auto" class="pv-btn">+ Add</span></div>
      <h3 style="font-family:var(--f-display);font-weight:400;font-size:26px;margin:16px 0 4px">Library</h3>
      <p style="color:var(--muted);margin:0 0 14px;font-size:13px">12 manga volumes, 4 books</p>
      <div class="pv-cards">${["#e8892b", "#6f9fe0", "#8fd18f"].map((c, i) => `<div class="pv-card"><div style="background:${c};aspect-ratio:2/3;border-radius:4px"></div><b>Volume ${i + 1}</b><span>${["Reading · 40%", "Finished", "Unread"][i]}</span></div>`).join("")}</div>
      <div class="pv-panel"><span class="pill reading">Reading</span><span class="pill completed">Finished</span><p style="margin:10px 0 0;font-size:13px">Body text in your chosen font. <a href="#" onclick="return false" style="color:var(--accent)">A link</a>.</p></div>`;
    const c1 = contrast(t.ink, t.bg), c2 = contrast(t.muted, t.bg), c3 = contrast(t.ink, t.surface);
    const warn = [c1 < 4.5 && "Text is hard to read on the background", c3 < 4.5 && "Text is hard to read on cards", c2 < 3 && "Quiet text is very faint"].filter(Boolean);
    const s = $("#te-check", root);
    s.className = warn.length ? "status err" : "status";
    s.textContent = warn.length ? `${warn.join(". ")}. Try more difference between them.` : `Readable: text contrast ${c1.toFixed(1)}:1 (4.5 or more is good).`;
  };
  $$("[data-k]", root).forEach((inp) => (inp.oninput = () => { t[inp.dataset.k] = inp.value; inp.parentElement.querySelector("code").textContent = inp.value; draw(); }));
  $("#te-mode", root).onclick = (e) => { const b = e.target.closest("[data-m]"); if (!b) return; t.mode = b.dataset.m; $$("#te-mode button", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); };
  $("#te-font", root).onchange = (e) => { t.font = e.target.value; draw(); };
  $("#te-disp", root).onchange = (e) => { t.display = e.target.value; draw(); };
  $("#te-name", root).oninput = (e) => (t.name = e.target.value);
  $("#te-save", root).onclick = () => {
    const all2 = getCustomThemes();
    const key = id || Date.now().toString(36);
    all2[key] = { name: t.name.trim() || "My theme", mode: t.mode, bg: t.bg, surface: t.surface, ink: t.ink, muted: t.muted, line: t.line, accent: t.accent, font: t.font || "body", display: t.display || "display" };
    saveCustomThemes(all2);
    settings.theme = "custom:" + key; saveSettings();
    m.close(); toast(`“${all2[key].name}” is on.`); render(view);
  };
  draw();
}
