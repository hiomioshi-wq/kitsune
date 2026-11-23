import { $, $$, esc, icon, toast, fmtBytes, confirmBox, getJSZip, plural, modal } from "../util.js";
import { settings, saveSettings, ACCENTS, DEFAULT_SETTINGS, lib, idb, kvFlush, loadLibrary, kvGet, kvSet } from "../store.js";
import { setCrumbs } from "../main.js";

export async function render(view, _name, params) {
  setCrumbs([["Settings", "settings"]]);
  const est = await navigator.storage?.estimate?.().catch(() => null);
  const persisted = await navigator.storage?.persisted?.().catch(() => false);
  const m = settings.manga, b = settings.book;
  const userFontName = (await kvGet("userFont", null))?.name || "";
  const P = await import("../profiles.js");
  const profs = P.getProfiles(), curId = P.currentId();
  const seg = (key, sub, opts) => `<div class="seg" data-set="${key}" data-sub="${sub}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(settings[sub][key]) === String(v)}">${l}</button>`).join("")}</div>`;

  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Make it yours</p><h1 class="h1">Settings</h1></div></div>
    <div class="settings">
      <div class="panel"><h3 class="h3">Appearance</h3>
        <div class="setting"><div><strong>Theme studio</strong><p>${/:/.test(settings.theme) ? "You're using a custom theme. " : ""}Presets like Washi paper and Akihabara neon, your own colours and fonts, cursors, and shareable theme codes.</p></div>
          <a class="btn btn-accent" href="#studio">${icon("sliders")}Open theme studio</a></div>
        <div class="setting"><div><strong>Theme</strong><p>System follows your device.</p></div>
          <div class="seg" id="s-theme">${[["system", "System"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${settings.theme === v}">${l}</button>`).join("")}</div></div>
        <div class="setting"><div><strong>Accent color</strong><p>Used for buttons, progress and highlights.</p></div>
          <div class="swatches" id="s-accent">${Object.entries(ACCENTS).map(([k, [l, d, name]]) => `<button class="swatch" type="button" data-v="${k}" aria-pressed="${settings.accent === k}" title="${name}" aria-label="${name}" style="background:linear-gradient(135deg, ${l} 50%, ${d} 50%)"></button>`).join("")}
            <label class="swatch" title="Pick your own colour" aria-label="Pick your own colour" aria-pressed="${settings.accent === "custom"}" style="position:relative;background:conic-gradient(#e44,#ea4,#4c4,#4ae,#a4e,#e44);overflow:hidden"><input type="color" id="s-custom" value="${esc(settings.customAccent || "#c9661a")}" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div></div>
        <div class="setting"><div><strong>Your own reading font</strong><p>${userFontName ? `Using <strong>${esc(userFontName)}</strong>. Pick it as “Yours” in the book reader's Aa menu.` : "Upload a .ttf, .otf or .woff2 font you have the rights to use. It appears as “Yours” in the book reader."}</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">${userFontName ? `<button class="btn" type="button" id="s-font-rm">Remove</button>` : ""}<label class="btn" style="position:relative">${icon("upload")}${userFontName ? "Replace" : "Upload font"}<input type="file" id="s-font" accept=".ttf,.otf,.woff,.woff2,font/*" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div></div>
        <div class="setting"><div><strong>Daily goal</strong><p>Pages per day for your streak and progress ring.</p></div>
          <div style="display:flex;align-items:center;gap:10px"><input type="range" id="s-goal" min="5" max="200" step="5" value="${settings.goal}" style="accent-color:var(--accent)"><span class="mono tnum" id="s-goal-v" style="min-width:3ch">${settings.goal}</span></div></div>
        <div class="setting"><div><strong>Yearly challenge</strong><p>Volumes and books to finish this year.</p></div>
          <div style="display:flex;align-items:center;gap:10px"><input type="range" id="s-ygoal" min="1" max="200" step="1" value="${settings.yearGoal}" style="accent-color:var(--accent)"><span class="mono tnum" id="s-ygoal-v" style="min-width:3ch">${settings.yearGoal}</span></div></div>
      </div>

      ${(await import("../reminders.js")).reminderPanelHtml()}

      ${(await import("../privacy.js")).privacyPanelHtml()}

      <div class="panel" id="a11y"><h3 class="h3">Accessibility</h3>
        <div class="setting"><div><strong>Motion</strong><p>Reduce turns off page turns, the 3D cover flow, page transitions, Wrapped animations and moving backgrounds. "Follow device" uses your system setting.</p></div>${seg("motion", "a11y", [["system", "Follow device"], ["reduce", "Reduce motion"]])}</div>
        <div class="setting"><div><strong>Interface font</strong><p>Atkinson Hyperlegible is designed for low vision. OpenDyslexic has weighted letter bottoms some dyslexic readers find easier. Both are also in the book reader's Aa menu.</p></div>${seg("font", "a11y", [["default", "Default"], ["hyperlegible", "Hyperlegible"], ["dyslexic", "OpenDyslexic"]])}</div>
        <div class="setting"><div><strong>Text size</strong><p>Scales the whole interface. Readers have their own size controls.</p></div>${seg("scale", "a11y", [["100", "100%"], ["112", "112%"], ["125", "125%"], ["140", "140%"]])}</div>
        <div class="setting"><div><strong>Underline links</strong><p>So links don't rely on colour alone.</p></div><input type="checkbox" data-a11y="underline" ${settings.a11y.underline ? "checked" : ""} style="accent-color:var(--accent);width:20px;height:20px"></div>
        <div class="setting"><div><strong>Strong focus outlines</strong><p>A thick, high-contrast ring around whatever the keyboard is on.</p></div><input type="checkbox" data-a11y="focus" ${settings.a11y.focus ? "checked" : ""} style="accent-color:var(--accent);width:20px;height:20px"></div>
        <p class="hint">Screen readers: pages, buttons and both readers are labelled, the manga reader announces each page, and every view can be reached with the keyboard (press ? for shortcuts).</p>
      </div>

      <div class="panel" id="sync"><h3 class="h3">Sync between devices</h3>
        <p class="muted" style="margin:0 0 6px;font-size:13px">No account needed. Sync carries reading positions, bookmarks, highlights, stats (and with them your Den level), vocabulary, Up next, the wishlist, and the free and linked titles in your library. Files you added stay on their device. Nothing is overwritten: the newest position wins and everything else is combined.</p>
        <div class="setting"><div><strong>Sync file</strong><p id="sy-file-p">${"showSaveFilePicker" in window ? "Save a sync file in a folder your cloud drive already syncs (iCloud Drive, Dropbox, OneDrive, Google Drive). Choose the same file on your other computers and Kitsune keeps them in step while it's open." : "Sync files work in Chrome and Edge on a computer. On this device, use a sync code below."}</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap" id="sy-file-btns"></div></div>
        <div class="setting"><div><strong>Sync code</strong><p>Copy a code here, paste it on your phone or another browser, and the two merge. Works anywhere.</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-accent" type="button" id="sy-copy">${icon("upload")}Copy sync code</button><button class="btn" type="button" id="sy-paste">${icon("download")}Paste a code</button></div></div>
        <p class="status" id="sy-status" role="status"></p>
      </div>

      <div class="panel"><h3 class="h3">Manga reader defaults</h3>
        <div class="setting"><div><strong>Layout</strong><p>Spread shows two pages side by side.</p></div>${seg("mode", "manga", [["single", "Single"], ["double", "Spread"], ["scroll", "Long strip / webtoon"]])}</div>
        <div class="setting"><div><strong>Direction</strong><p>Each series remembers its own direction and layout once you change it in the reader.</p></div>${seg("dir", "manga", [["rtl", "Right to left"], ["ltr", "Left to right"]])}</div>
        <div class="setting"><div><strong>Fit</strong></div>${seg("fit", "manga", [["height", "Screen"], ["tall", "Height"], ["width", "Width"], ["original", "Original"]])}</div>
        <div class="setting"><div><strong>Go to the next volume automatically</strong><p>At the end of a volume, offer the next one in the series.</p></div><input type="checkbox" data-bool="autoNext" ${m.autoNext ? "checked" : ""} style="accent-color:var(--accent);width:20px;height:20px"></div>
        <div class="setting"><div><strong>High-quality scans</strong><p>Archive.org pages at 1400px. Turn off to save data.</p></div><input type="checkbox" data-bool="hq" ${m.hq ? "checked" : ""} style="accent-color:var(--accent);width:20px;height:20px"></div>
      </div>

      <div class="panel"><h3 class="h3">Book reader defaults</h3>
        <div class="setting"><div><strong>Theme</strong></div>${seg("theme", "book", [["paper", "Paper"], ["sepia", "Sepia"], ["matcha", "Matcha"], ["night", "Night"], ["ink", "Ink"]])}</div>
        <div class="setting"><div><strong>Typeface</strong></div>${seg("font", "book", [["literata", "Literata"], ["mincho", "Mincho"], ["atkinson", "Hyperlegible"], ["sans", "Sans"]])}</div>
        <div class="setting"><div><strong>Layout</strong></div>${seg("layout", "book", [["scroll", "Scroll"], ["paged", "Pages"]])}</div>
        <p class="hint">Size, spacing and width can be changed inside the reader.</p>
      </div>

      <div class="panel" id="profiles"><h3 class="h3">Profiles</h3>
        <p class="muted" style="margin:0 0 6px;font-size:13px">Everyone sharing this device gets their own library, progress, notes and settings. Files aren't shared between profiles.</p>
        ${profs.map((p) => `<div class="setting" data-pid="${esc(p.id)}">
          <div style="display:flex;gap:12px;align-items:center;min-width:0"><span class="av" style="width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;background:${esc(p.color)};flex:none">${esc([...p.name][0]?.toUpperCase() || "?")}</span>
            <div style="min-width:0"><strong>${esc(p.name)}${p.id === curId ? ` <span class="pill completed">This profile</span>` : ""}</strong><p>${p.kids ? `Kids profile${p.pin ? " · PIN to leave" : ""}` : "Full access"}</p></div></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${p.id !== curId ? `<button class="btn btn-sm" type="button" data-psw>Switch</button>` : ""}<button class="btn btn-sm" type="button" data-pedit>Edit</button>${p.id !== "main" ? `<button class="btn btn-sm btn-ghost" type="button" data-pdel style="color:var(--bad)">Delete</button>` : ""}</div></div>`).join("")}
        <div style="margin-top:12px"><button class="btn btn-accent" type="button" id="p-add">${icon("plus")}Add a profile</button></div>
      </div>

      <div class="panel" id="data"><h3 class="h3">Your data</h3>
        <div class="setting"><div><strong>Storage on this device</strong><p>${est ? `${fmtBytes(est.usage)} used of about ${fmtBytes(est.quota)} available.` : "Your browser doesn't report storage use."} ${persisted ? "Protected from automatic cleanup." : "Your browser may clear it if space runs low."}</p>
          ${est ? `<div class="meter"><i style="width:${Math.max(1, (est.usage / est.quota) * 100).toFixed(1)}%"></i></div>` : ""}</div>
          ${persisted ? `<span class="pill completed">${icon("check")}Protected</span>` : `<button class="btn" type="button" id="s-persist">Protect storage</button>`}</div>
        <div class="setting"><div><strong>Back up</strong><p>Everything in one .zip: library details, progress, bookmarks, highlights, notes and stats. Include files to move your manga too.</p>
          <label class="check" style="margin-top:8px"><input type="checkbox" id="s-withfiles"> Include files I added (can be large)</label></div>
          <button class="btn btn-accent" type="button" id="s-backup">${icon("download")}Make backup</button></div>
        <div class="setting"><div><strong>Restore</strong><p>Merge a Kitsune backup into this library. Nothing here is deleted.</p></div>
          <label class="btn" style="position:relative">${icon("upload")}Choose backup<input type="file" id="s-restore" accept=".zip,.json" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div>
        <div class="setting"><div><strong>Reset Kitsune</strong><p>Delete your library, files, progress and settings from this browser.</p></div>
          <button class="btn" type="button" id="s-reset" style="color:var(--bad)">${icon("trash")}Delete everything</button></div>
        <p class="status" id="s-status" role="status"></p>
      </div>

      <div class="panel"><h3 class="h3">Keyboard</h3>
        <p class="mono" style="font-size:12.5px;line-height:2;margin:0;color:var(--muted)">
          ⌘K or / · search everything<br>1–5 · Home, Library, Discover, Books, Link<br>
          Manga: ← → turn · Space next · T thumbnails · B bookmark · F full screen · Z zoom · S settings · Esc close<br>
          Books: ← → page · T contents · / search in book · B bookmark · R read aloud · Esc close</p></div>

      <div class="panel"><h3 class="h3">About</h3>
        <p class="muted" style="margin:0">Kitsune ${lib.features.host === "local" ? "is running on this computer" : "is hosted on Vercel"}. Book and series info comes from Project Gutenberg (Gutendex), Internet Archive, LibriVox and AniList. Your files never leave this device.</p></div>
    </div>`;

  if (params?.[0] === "data") $("#data", view).scrollIntoView({ block: "start" });
  if (params?.[0] === "profiles") $("#profiles", view).scrollIntoView({ block: "start" });

  // ---------- profiles ----------
  const editProfile = (p) => {
    const isNew = !p;
    p = p || { name: "", kids: false, color: P.PROFILE_COLORS[profs.length % P.PROFILE_COLORS.length], pin: "" };
    const m = modal({
      title: isNew ? "Add a profile" : `Edit ${p.name}`,
      body: `<form class="form" id="pf">
        <div><label class="lbl" for="pf-name">Name</label><input class="field" id="pf-name" value="${esc(p.name)}" maxlength="24" required autofocus placeholder="Sam"></div>
        <div><span class="lbl">Colour</span><div class="swatches" id="pf-col">${P.PROFILE_COLORS.map((c) => `<button class="swatch" type="button" data-c="${c}" aria-pressed="${c === p.color}" style="background:${c}" aria-label="Colour ${c}"></button>`).join("")}</div></div>
        ${p.id === "main" ? "" : `<label class="check"><input type="checkbox" id="pf-kids" ${p.kids ? "checked" : ""}> Kids profile: public-domain books and classic manga, their own shelf, no AniList or trending manga</label>
        <div id="pf-pinrow" ${p.kids ? "" : "hidden"}><label class="lbl" for="pf-pin">Parent PIN to leave this profile (optional)</label><input class="field" id="pf-pin" inputmode="numeric" maxlength="8" value="${esc(p.pin || "")}" placeholder="4–8 digits" autocomplete="off" style="max-width:180px"><p class="hint">A gentle lock for younger readers, not real security: it's stored on this device.</p></div>`}
      </form>`,
      actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="pf">${isNew ? "Create" : "Save"}</button>`,
    });
    let color = p.color;
    $("#pf-col", m.root).onclick = (e) => { const b = e.target.closest("[data-c]"); if (!b) return; color = b.dataset.c; $$("#pf-col .swatch", m.root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); };
    $("#pf-kids", m.root)?.addEventListener("change", (e) => ($("#pf-pinrow", m.root).hidden = !e.target.checked));
    $("#pf", m.root).onsubmit = (e) => {
      e.preventDefault();
      const name = $("#pf-name", m.root).value.trim();
      const kids = !!$("#pf-kids", m.root)?.checked;
      const pin = kids ? ($("#pf-pin", m.root)?.value || "").replace(/\D/g, "").slice(0, 8) : "";
      if (pin && pin.length < 4) { toast("Use at least 4 digits for the PIN, or leave it empty."); return; }
      if (isNew) { const id = P.createProfile({ name, kids, color }); if (pin) P.updateProfile(id, { pin }); toast(`Added ${name || "the profile"}.`, { action: "Switch", onAction: () => P.switchProfile(id) }); }
      else { P.updateProfile(p.id, { name: name || p.name, kids, color, pin }); }
      m.close(); render(view, _name, ["profiles"]);
      if (!isNew && p.id === curId) location.reload();
    };
  };
  $("#p-add", view).onclick = () => editProfile(null);
  $("#profiles", view).addEventListener("click", async (e) => {
    const row = e.target.closest("[data-pid]"); if (!row) return;
    const p = profs.find((x) => x.id === row.dataset.pid);
    if (e.target.closest("[data-psw]")) P.switchProfile(p.id);
    if (e.target.closest("[data-pedit]")) editProfile(p);
    if (e.target.closest("[data-pdel]")) {
      if (!(await confirmBox(`Delete ${p.name}'s profile?`, "Their library, files, progress, notes and settings are removed from this device. This can't be undone.", "Delete profile"))) return;
      await P.deleteProfile(p.id); toast("Profile deleted."); render(view, _name, ["profiles"]);
    }
  });

  $("#s-theme", view).onclick = (e) => { const x = e.target.closest("[data-v]"); if (!x) return; settings.theme = x.dataset.v; saveSettings(); $$("#s-theme button", view).forEach((y) => y.setAttribute("aria-pressed", String(y === x))); };
  $("#s-accent", view).onclick = (e) => { const x = e.target.closest("[data-v]"); if (!x) return; settings.accent = x.dataset.v; saveSettings(); $$("#s-accent .swatch", view).forEach((y) => y.setAttribute("aria-pressed", String(y === x))); };
  $("#s-custom", view).oninput = (e) => { settings.accent = "custom"; settings.customAccent = e.target.value; saveSettings(); $$("#s-accent .swatch", view).forEach((y) => y.setAttribute("aria-pressed", String(y.tagName === "LABEL"))); };
  $("#s-font", view).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const face = new FontFace("KitsuneUser", await f.arrayBuffer());
      await face.load(); // checks the file is a real font
      kvSet("userFont", { name: f.name.replace(/\.[^.]+$/, ""), blob: f });
      settings.book.font = "custom"; saveSettings();
      toast(`“${f.name}” is now your reading font.`);
      render(view, _name, params);
    } catch { toast("That file isn't a font Kitsune can use. Try a .ttf, .otf or .woff2 file."); }
  };
  $("#s-font-rm", view)?.addEventListener("click", () => { kvSet("userFont", null); if (settings.book.font === "custom") { settings.book.font = "literata"; saveSettings(); } render(view, _name, params); });
  $("#s-goal", view).oninput = (e) => { settings.goal = Number(e.target.value); $("#s-goal-v", view).textContent = settings.goal; saveSettings(); };
  $("#s-ygoal", view).oninput = (e) => { settings.yearGoal = Number(e.target.value); $("#s-ygoal-v", view).textContent = settings.yearGoal; saveSettings(); };
  $$("[data-set]", view).forEach((g) => (g.onclick = (e) => {
    const x = e.target.closest("[data-v]"); if (!x) return;
    settings[g.dataset.sub][g.dataset.set] = x.dataset.v; saveSettings();
    $$("button", g).forEach((y) => y.setAttribute("aria-pressed", String(y === x)));
  }));
  $$("[data-bool]", view).forEach((c) => (c.onchange = () => { settings.manga[c.dataset.bool] = c.checked; saveSettings(); }));
  $$("[data-a11y]", view).forEach((c) => (c.onchange = () => { settings.a11y[c.dataset.a11y] = c.checked; saveSettings(); }));
  wireSync(view);
  (await import("../reminders.js")).wireReminderPanel(view, () => render(view, _name, ["reminder"]));
  (await import("../privacy.js")).wirePrivacyPanel(view, () => render(view, _name, ["privacy"]));
  $("#s-persist", view)?.addEventListener("click", async () => { const ok = await navigator.storage.persist().catch(() => false); toast(ok ? "Storage is protected." : "Your browser didn't allow it. Installing Kitsune as an app usually helps."); render(view, _name, params); });
  $("#s-backup", view).onclick = () => backup($("#s-withfiles", view).checked, $("#s-status", view));
  $("#s-restore", view).onchange = (e) => e.target.files[0] && restore(e.target.files[0], $("#s-status", view));
  $("#s-reset", view).onclick = async () => {
    if (!(await confirmBox("Delete everything?", "Your library, added files, progress, highlights, notes, stats and settings are removed from this browser. This can't be undone.", "Delete everything"))) return;
    await idb.clear("items"); await idb.clear("kv");
    try { Object.keys(localStorage).filter((k) => k.startsWith("kitsune.")).forEach((k) => localStorage.removeItem(k)); } catch {}
    location.hash = "home"; location.reload();
  };
}

async function wireSync(view) {
  const S = await import("../sync.js");
  const status = $("#sy-status", view), say = (t, err) => { status.className = "status" + (err ? " err" : ""); status.textContent = t; };
  const fileBtns = async () => {
    const box = $("#sy-file-btns", view);
    if (!box || !S.fileSyncSupported()) return;
    const h = await S.syncFileHandle();
    const last = Number(localStorage.getItem("kitsune.lastSync") || 0);
    box.innerHTML = h ? `<button class="btn btn-accent" type="button" id="sy-now">Sync now</button><button class="btn" type="button" id="sy-stop">Stop syncing</button>` : `<button class="btn btn-accent" type="button" id="sy-choose">Choose a sync file</button>`;
    if (h) say(`Syncing with ${h.name}${last ? `, last synced ${new Date(last).toLocaleString()}` : ""}.`);
    $("#sy-choose", view)?.addEventListener("click", async () => { try { const r = await S.chooseSyncFile(); say(r?.needsPermission ? "Kitsune needs permission to use that file." : `Synced. ${r.newItems ? plural(r.newItems, "title") + " added. " : ""}`); S.startAutoSync(); fileBtns(); } catch (e) { if (e.name !== "AbortError") say(e.message, true); } });
    $("#sy-now", view)?.addEventListener("click", async () => { try { const r = await S.syncNow({ ask: true }); say(r?.needsPermission ? "Kitsune needs permission to use the sync file." : `Synced${r.newItems ? `, ${plural(r.newItems, "title")} added` : ""}.`); fileBtns(); } catch (e) { say(e.message, true); } });
    $("#sy-stop", view)?.addEventListener("click", async () => { await S.forgetSyncFile(); say("Stopped syncing. The file is still where you saved it."); fileBtns(); });
  };
  fileBtns();
  $("#sy-copy", view).onclick = async () => {
    say("Making a sync code…");
    try {
      const code = await S.makeCode();
      try { await navigator.clipboard.writeText(code); say(`Copied a sync code (${Math.ceil(code.length / 1024)} KB). Paste it on your other device in Settings → Sync between devices.`); }
      catch { modal({ title: "Your sync code", body: `<p class="muted" style="margin-top:0">Copy all of this and paste it on your other device.</p><textarea class="field" readonly rows="8" style="width:100%;font:12px var(--f-mono);word-break:break-all">${esc(code)}</textarea>` }); say("Your sync code is ready."); }
    } catch (e) { say(e.message, true); }
  };
  $("#sy-paste", view).onclick = () => {
    const m = modal({ title: "Paste a sync code", body: `<form class="form" id="sy-f"><textarea class="field" id="sy-code" rows="7" placeholder="KITSUNE1…" style="width:100%;font:12px var(--f-mono)" required></textarea><p class="status" id="sy-f-s"></p></form>`,
      actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="sy-f">Merge</button>` });
    $("#sy-f", m.root).onsubmit = async (e) => {
      e.preventDefault();
      const st = $("#sy-f-s", m.root);
      try { const r = await S.readCode($("#sy-code", m.root).value); m.close(); say(`Merged. ${plural(r.progress, "reading position")} checked${r.newItems ? `, ${plural(r.newItems, "title")} added` : ""}.`); }
      catch (err) { st.className = "status err"; st.textContent = err.message || "That code couldn't be read. Copy it again, all of it."; }
    };
  };
}

async function backup(withFiles, status) {
  status.className = "status"; status.textContent = "Packing your backup…";
  kvFlush();
  try {
    const JSZip = await getJSZip();
    const zip = new JSZip();
    const items = await idb.all("items"), kv = await idb.all("kv");
    const meta = [];
    let files = 0;
    for (const it of items) {
      const copy = { ...it, source: { ...it.source } };
      delete copy.offline; delete copy.offlineBytes; delete copy.source.epubBlob;
      if (it.coverBlob) { if (withFiles) zip.file(`files/${it.id}/cover`, it.coverBlob); delete copy.coverBlob; copy._cover = withFiles; }
      if (it.source?.kind === "blobs") { if (withFiles) { it.source.blobs.forEach((b, i) => zip.file(`files/${it.id}/${String(i).padStart(4, "0")}`, b)); files += it.source.blobs.length; copy.source.blobs = it.source.blobs.map((b) => b.type); } else copy.source.blobs = null; }
      if (it.source?.blob) { if (withFiles) { zip.file(`files/${it.id}/doc`, it.source.blob); files++; copy.source.blob = it.source.blob.type || "application/octet-stream"; } else copy.source.blob = null; }
      if (it.source?.kind === "server") continue;
      meta.push(copy);
    }
    zip.file("kitsune.json", JSON.stringify({ app: "Kitsune", version: 2, created: new Date().toISOString(), items: meta, kv }, null, 1));
    const blob = await zip.generateAsync({ type: "blob", compression: withFiles ? "STORE" : "DEFLATE" }, (m) => (status.textContent = `Packing your backup… ${Math.round(m.percent)}%`));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kitsune-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
    status.textContent = `Backup ready: ${plural(meta.length, "item")}${withFiles ? `, ${plural(files, "file")}` : ""}, ${fmtBytes(blob.size)}.`;
  } catch (e) { status.className = "status err"; status.textContent = e.message; }
}

async function restore(file, status) {
  status.className = "status"; status.textContent = "Reading backup…";
  try {
    const JSZip = await getJSZip();
    let data, zip = null;
    if (/\.json$/i.test(file.name)) data = JSON.parse(await file.text());
    else { zip = await JSZip.loadAsync(file); data = JSON.parse(await zip.file("kitsune.json").async("string")); }
    if (data.app !== "Kitsune") throw new Error("That isn't a Kitsune backup.");
    let added = 0, skipped = 0;
    for (const it of data.items) {
      const s = it.source || {};
      const get = async (p, type) => { const f = zip?.file(p); return f ? new Blob([await f.async("arraybuffer")], { type }) : null; };
      if (s.kind === "blobs") {
        if (!s.blobs) { skipped++; continue; }
        const blobs = [];
        for (const [i, type] of s.blobs.entries()) { const b = await get(`files/${it.id}/${String(i).padStart(4, "0")}`, type); if (b) blobs.push(b); }
        if (!blobs.length) { skipped++; continue; }
        s.blobs = blobs;
      }
      if (s.blob !== undefined) { if (!s.blob) { skipped++; continue; } const b = await get(`files/${it.id}/doc`, s.blob); if (!b) { skipped++; continue; } s.blob = b; }
      if (it._cover) { it.coverBlob = await get(`files/${it.id}/cover`, "image/jpeg") || undefined; }
      delete it._cover;
      await idb.put("items", it); added++;
      status.textContent = `Restoring… ${added}`;
    }
    for (const row of data.kv || []) {
      const cur = await idb.get("kv", row.k);
      if (!cur || row.k === "settings") { await idb.put("kv", row); continue; }
      if (row.k === "stats") {
        const m = cur.v; for (const [d, v] of Object.entries(row.v.days || {})) if (!m.days[d] || m.days[d].secs < v.secs) m.days[d] = v;
        m.finished = [...m.finished, ...(row.v.finished || []).filter((f) => !m.finished.some((x) => x.id === f.id))];
        await idb.put("kv", { k: "stats", v: m });
      } else if (Array.isArray(row.v)) await idb.put("kv", { k: row.k, v: [...cur.v, ...row.v.filter((x) => !cur.v.some((y) => JSON.stringify(y) === JSON.stringify(x)))] });
      else if (typeof row.v === "object" && row.v) await idb.put("kv", { k: row.k, v: { ...row.v, ...cur.v } });
    }
    status.textContent = `Restored ${plural(added, "item")}${skipped ? ` (${skipped} saved without their files were skipped)` : ""}. Reloading…`;
    setTimeout(() => location.reload(), 1200);
  } catch (e) { status.className = "status err"; status.textContent = e.message || "That backup couldn't be read."; }
}
