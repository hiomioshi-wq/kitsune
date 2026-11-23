// Kitsune Browser, v131:
//  - flashcards from highlights: tap a word in any web highlight to make it a fill-in-the-blank flashcard
//    (it joins your Notebook vocabulary and its spaced-repetition reviews)
//  - highlights as an Anki deck (CSV with the word blanked out of its sentence)
//  - a highlight of yours on the start page, to bring back something you once marked
import { $, esc, toast, modal } from "./util.js";
import { kvGet } from "./store.js";

const clipsOf = async (url) => { const all = (await kvGet("webClips", {})) || {}; if (url) { const k = Object.keys(all).find((x) => url.startsWith(x) || x.startsWith(url.replace(/#.*$/, ""))); return k ? [all[k]] : []; } return Object.values(all); };

async function cardsFromHighlights(t, everywhere) {
  const pages = (await clipsOf(everywhere ? "" : t.url)).filter((p) => p.clips?.length);
  if (!pages.length) return toast(everywhere ? "You haven't highlighted anything in the browser yet." : "You haven't highlighted anything on this page. Select text and pick a colour to highlight it.");
  const { saveWord, define } = await import("./lookup.js");
  const m = modal({ title: "Make flashcards from highlights", wide: true, body: `<p class="muted" style="margin-top:0">Tap a word in a highlight. It becomes a fill-in-the-blank card with that sentence, looked up in the dictionary, and joins your Notebook reviews.</p><div id="fc-l" style="max-height:60vh;overflow:auto">${pages.map((p) => `<h4 style="margin:12px 0 4px">${esc(p.title || p.url)}</h4>${p.clips.map((c) => `<p style="margin:0 0 8px;padding:6px 8px;border-radius:6px;background:rgba(255,224,102,.15);line-height:1.9" data-ctx="${esc(c.text)}" data-src="${esc(p.title || "")}">${c.text.split(/(\s+)/).map((w) => /\p{L}{3,}/u.test(w) ? `<button type="button" class="fc-w" style="border:0;background:none;color:inherit;font:inherit;padding:0 1px;cursor:pointer;border-bottom:1px dotted currentColor">${esc(w)}</button>` : esc(w)).join("")}</p>`).join("")}`).join("")}</div><p class="status" id="fc-s"></p>` });
  m.root.onclick = async (e) => {
    const b = e.target.closest(".fc-w"); if (!b) return;
    const word = b.textContent.replace(/^[^\p{L}]+|[^\p{L}'-]+$/gu, ""), p = b.closest("[data-ctx]"), s = $("#fc-s", m.root);
    s.textContent = `Looking up “${word}”…`;
    let def = "", pos = ""; try { const d = await define(word); def = d.senses[0]?.defs[0] || ""; pos = d.senses[0]?.pos || ""; } catch {}
    const ok = await saveWord({ word, def: def || "(add a meaning in your Notebook)", pos, context: p.dataset.ctx, book: p.dataset.src || "Web highlight" });
    b.style.background = ok ? "rgba(63,166,106,.35)" : "rgba(127,127,160,.3)"; b.style.borderRadius = "4px";
    s.textContent = ok ? `Added “${word}” to your flashcards${def ? `: ${def.slice(0, 80)}` : ""}.` : `“${word}” is already in your flashcards.`;
  };
}

async function ankiCsv() {
  const pages = (await clipsOf("")).filter((p) => p.clips?.length); if (!pages.length) return toast("You haven't highlighted anything in the browser yet.");
  const cell = (s) => `"${String(s).replace(/"/g, '""')}"`, rows = [];
  for (const p of pages) for (const c of p.clips) { const words = c.text.match(/\p{L}{6,}/gu) || []; const w = words.sort((a, b) => b.length - a.length)[0]; const front = w ? c.text.replace(w, "{{c1::" + w + "}}") : c.text; rows.push([front, `${p.title || ""} — ${p.url}`].map(cell).join(",")); }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" })); a.download = "kitsune-highlights-anki.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast(`Saved ${rows.length} cards. In Anki, import as “Cloze”, with fields separated by commas.`, { ms: 6000 });
}

export async function startHighlight(container, go) {
  if (!container || container.querySelector("#kb-hlq")) return;
  const pages = (await clipsOf("")).filter((p) => p.clips?.length); if (!pages.length) return;
  const all = pages.flatMap((p) => p.clips.filter((c) => c.text.length > 30 && c.text.length < 400).map((c) => ({ ...c, p }))); if (!all.length) return;
  const day = Math.floor(Date.now() / 864e5), pick = all[day % all.length];
  const sec = document.createElement("section"); sec.id = "kb-hlq"; sec.style.cssText = "margin:0 0 22px";
  sec.innerHTML = `<h3 style="margin:0 0 8px;font-size:15px">From your highlights</h3><blockquote style="margin:0;padding:12px 16px;border-left:4px solid var(--accent,#f2a03f);border-radius:0 10px 10px 0;background:rgba(127,127,160,.08);font:17px/1.55 Georgia,serif">“${esc(pick.text)}”<footer style="font:12px system-ui,sans-serif;opacity:.7;margin-top:6px"><a href="#" data-u="${esc(pick.p.url)}" style="color:inherit">${esc(pick.p.title || pick.p.url)}</a>${pick.t ? ` · ${new Date(pick.t).toLocaleDateString()}` : ""}</footer></blockquote>`;
  sec.onclick = (e) => { const a = e.target.closest("[data-u]"); if (a) { e.preventDefault(); go(a.dataset.u); } };
  const start = container.querySelector(".kb-start") || container, cont = start.querySelector("#kb-cont");
  const f = start.querySelector("form"); if (cont) cont.after(sec); else if (f) f.after(sec); else start.prepend(sec);
}

export function items({ T }) {
  return [
    { label: "Make flashcards from this page's highlights…", icon: "highlight", run: () => cardsFromHighlights(T(), false) },
    { label: "Make flashcards from all my web highlights…", icon: "highlight", run: () => cardsFromHighlights(T(), true) },
    { label: "Export my highlights as an Anki deck (CSV)", icon: "download", run: ankiCsv },
  ];
}
