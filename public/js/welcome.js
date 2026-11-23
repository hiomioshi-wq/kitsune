// First-run welcome: three short steps, then out of the way.
import { $, $$, esc, icon, modal, ls } from "./util.js";
import { settings, saveSettings, lib } from "./store.js";

export function maybeWelcome() {
  if (ls.get("welcomed", false)) return;
  if (lib.items.some((i) => i.id !== "sample")) { ls.set("welcomed", true); return; } // existing users
  showWelcome();
}

export function showWelcome() {
  let step = 0;
  const picks = { dir: settings.manga.dir === "ltr" ? "ltr" : settings.manga.mode === "scroll" ? "scroll" : "rtl", likes: new Set(["manga", "books"]) };
  const m = modal({ title: "Welcome to Kitsune", wide: true, body: `<div id="wc"></div>`, onClose: () => ls.set("welcomed", true) });
  const dots = () => `<div style="display:flex;gap:6px;justify-content:center;margin-top:18px">${[0, 1, 2].map((i) => `<span style="width:${i === step ? 22 : 8}px;height:8px;border-radius:4px;background:${i === step ? "var(--accent)" : "var(--line-2)"};transition:width .2s"></span>`).join("")}</div>`;
  const draw = () => {
    const box = $("#wc", m.root);
    if (step === 0) box.innerHTML = `
      <div style="display:grid;grid-template-columns:120px minmax(0,1fr);gap:24px;align-items:center">
        <svg style="width:120px;height:156px;color:var(--ink)"><use href="#fox"/></svg>
        <div><h2 class="h2" style="margin-bottom:8px">Your shelf, your rules.</h2>
          <p style="margin:0 0 10px">Kitsune reads the manga and books <strong>you own</strong>: CBZ, PDF and EPUB files, folders of scans, or your own server. It also opens thousands of free public-domain books, scans and audiobooks.</p>
          <p class="muted" style="margin:0;font-size:14px">Everything you add stays in this browser. Nothing is uploaded.</p></div></div>
      ${dots()}<div class="modal-foot" style="margin:18px -20px -20px"><button class="btn btn-ghost" type="button" data-close>Skip</button><button class="btn btn-accent" type="button" data-next>Next ${icon("next")}</button></div>`;
    if (step === 1) box.innerHTML = `
      <h2 class="h2" style="margin-bottom:6px">How do you read?</h2>
      <p class="muted" style="margin:0 0 16px">You can change any of this later in Settings.</p>
      <span class="lbl">Comics usually read…</span>
      <div class="seg" id="wc-dir" style="margin-bottom:18px">${[["rtl", "Right to left (manga)"], ["ltr", "Left to right (comics)"], ["scroll", "Long strip (webtoons)"]].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${picks.dir === v}">${l}</button>`).join("")}</div>
      <span class="lbl">You're here for…</span>
      <div class="chips" id="wc-likes">${[["manga", "Manga & comics"], ["books", "Books"], ["audio", "Audiobooks"], ["classics", "Classics & old scans"], ["learning", "Learning a language"]].map(([v, l]) => `<button class="chip" type="button" data-v="${v}" aria-pressed="${picks.likes.has(v)}">${l}</button>`).join("")}</div>
      ${dots()}<div class="modal-foot" style="margin:18px -20px -20px"><button class="btn btn-ghost" type="button" data-back>Back</button><button class="btn btn-accent" type="button" data-next>Next ${icon("next")}</button></div>`;
    if (step === 2) {
      const L = picks.likes;
      const opts = [
        ["upload", "Add files I own", "CBZ, ZIP, PDF, EPUB, or a folder of pages", "import"],
        ...(L.has("manga") || L.has("classics") ? [["compass", "Read classic manga", "Hokusai's 1814 sketchbooks and Edo picture books", "#discover/classic"]] : []),
        ...(L.has("books") || L.has("classics") ? [["book", "Pick a free book", "75,000+ ebooks from Project Gutenberg", "#books"]] : []),
        ...(L.has("audio") ? [["headphones", "Listen to an audiobook", "LibriVox recordings, read by volunteers", "#books/audio"]] : []),
        ...(L.has("learning") ? [["globe", "Read in another language", "Wikisource has Japanese, Chinese, French and more", "#books/wikisource"]] : []),
        ...(L.has("manga") ? [["link", "Connect a comic server", "Komga, Kavita or Calibre-Web", "#link"]] : []),
      ];
      box.innerHTML = `<h2 class="h2" style="margin-bottom:6px">Where would you like to start?</h2>
        <p class="muted" style="margin:0 0 16px">Tip: press <kbd>⌘K</kbd> (or <kbd>/</kbd>) anywhere to search everything, and <kbd>?</kbd> for shortcuts.</p>
        <div class="sources" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">${opts.map(([ic, t, d, go]) => `<button class="source" type="button" data-go="${esc(go)}"><span class="ico">${icon(ic)}</span><strong>${esc(t)}</strong><p>${esc(d)}</p></button>`).join("")}</div>
        ${dots()}<div class="modal-foot" style="margin:18px -20px -20px"><button class="btn btn-ghost" type="button" data-back>Back</button><button class="btn" type="button" data-close>Just look around</button></div>`;
    }
  };
  m.root.addEventListener("click", async (e) => {
    if (e.target.closest("[data-next]")) { step++; draw(); }
    if (e.target.closest("[data-back]")) { step--; draw(); }
    const d = e.target.closest("#wc-dir [data-v]");
    if (d) { picks.dir = d.dataset.v; $$("#wc-dir button", m.root).forEach((x) => x.setAttribute("aria-pressed", String(x === d))); }
    const l = e.target.closest("#wc-likes [data-v]");
    if (l) { picks.likes.has(l.dataset.v) ? picks.likes.delete(l.dataset.v) : picks.likes.add(l.dataset.v); l.setAttribute("aria-pressed", String(picks.likes.has(l.dataset.v))); }
    if (d || e.target.closest("[data-next]")) {
      if (picks.dir === "scroll") { settings.manga.mode = "scroll"; } else { settings.manga.dir = picks.dir; if (settings.manga.mode === "scroll") settings.manga.mode = "single"; }
      saveSettings();
    }
    const g = e.target.closest("[data-go]");
    if (g) {
      ls.set("welcomed", true); m.close();
      if (g.dataset.go === "import") (await import("./views/link.js")).openImport();
      else location.hash = g.dataset.go.slice(1);
    }
  });
  draw();
}
