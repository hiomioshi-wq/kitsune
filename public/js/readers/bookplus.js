// Book reader extras: go to a percentage (G), a quote card from your selection (Q), and facts about this book (W).
import { $, esc, toast, modal } from "../util.js";

export function goToPercent() {
  const s = $("#b-scrub"); if (!s) return;
  const v = prompt("Go to what percent of the book? (0–100)", String(Math.round(+s.value / 10))); if (v == null || v === "") return;
  const n = +String(v).replace("%", ""); if (!(n >= 0 && n <= 100)) return toast("Pick a number from 0 to 100.");
  s.value = String(Math.round(n * 10)); s.dispatchEvent(new Event("input", { bubbles: true })); s.dispatchEvent(new Event("change", { bubbles: true }));
}

function wrap(g, text, w) { const out = []; let line = ""; for (const word of text.split(/\s+/)) { const t = line ? line + " " + word : word; if (g.measureText(t).width > w && line) { out.push(line); line = word; } else line = t; } if (line) out.push(line); return out; }
const THEMES = { Night: ["#14152a", "#f4efe4", "#e3b04b"], Paper: ["#f6efe0", "#2b241a", "#a8562a"], Ember: ["#3a1712", "#fff1e0", "#ffcf6b"], Sea: ["#10323a", "#eaf7f4", "#7fd6c2"] };
export function quoteCard(item) {
  const quote = getSelection()?.toString().replace(/\s+/g, " ").trim(); if (!quote) return toast("Select a line first, then press Q.");
  const text = quote.slice(0, 420) + (quote.length > 420 ? "…" : ""); let theme = "Night", blob = null, url = "";
  const m = modal({ title: "Quote card", body: `<div class="chips" id="qc-t">${Object.keys(THEMES).map((k) => `<button class="chip" type="button" data-k="${k}" aria-pressed="${k === theme}">${k}</button>`).join("")}</div><img id="qc-i" alt="Your quote as a picture" style="width:100%;margin-top:10px;border-radius:8px">`, actions: `<button class="btn" type="button" id="qc-c">Copy</button><button class="btn btn-accent" type="button" id="qc-s">Save</button>`, onClose: () => url && URL.revokeObjectURL(url) });
  const draw = async () => {
    const [bg, ink, ac] = THEMES[theme], c = document.createElement("canvas"); c.width = c.height = 1080; const g = c.getContext("2d"); g.fillStyle = bg; g.fillRect(0, 0, 1080, 1080);
    let size = 58, lines; do { g.font = `${size}px Georgia, serif`; lines = wrap(g, text, 860); size -= 2; } while (lines.length * size * 1.42 > 680 && size > 26); size += 2;
    const lh = size * 1.42; let y = 540 - (lines.length * lh) / 2 + size * 0.4 - 40; g.fillStyle = ac; g.font = "150px Georgia, serif"; g.fillText("“", 96, Math.max(190, y - 30)); g.fillStyle = ink; g.font = `${size}px Georgia, serif`; for (const l of lines) { g.fillText(l, 110, y); y += lh; }
    g.fillStyle = ac; g.fillRect(110, 910, 70, 4); g.fillStyle = ink; g.font = "600 30px system-ui, sans-serif"; g.fillText(String(item.title || "").slice(0, 52), 110, 960); g.globalAlpha = .7; g.font = "26px system-ui, sans-serif"; g.fillText(String(item.author || "").slice(0, 60), 110, 998); g.globalAlpha = 1;
    blob = await new Promise((ok) => c.toBlob(ok, "image/png")); if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob); $("#qc-i", m.root).src = url;
  };
  $("#qc-t", m.root).onclick = (e) => { const b = e.target.closest("[data-k]"); if (!b) return; theme = b.dataset.k; [...b.parentNode.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); };
  $("#qc-s", m.root).onclick = () => { const a = document.createElement("a"); a.href = url; a.download = `${String(item.title || "quote").replace(/[^\w\s-]/g, "").trim().slice(0, 40)} quote.png`; a.click(); toast("Saved."); };
  $("#qc-c", m.root).onclick = async () => { try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast("Copied."); } catch { toast("Couldn't copy here. Save it instead."); } };
  draw();
}

const STOP = new Set("the and to of a in that it is was he she his her i you for on with as at by be had not but they this from or have an are were which we my me him them so all there would their what if when out up one been who do no said will could then into more than very about some can your its did just like over only other our now these little down before after".split(" "));
export function bookFacts(item, blocks) {
  const text = blocks.map((b) => b.textContent).join("\n"), words = text.match(/[\p{L}\p{N}’'-]+/gu) || []; if (!words.length) return toast("This book's text hasn't loaded yet.");
  const sent = text.split(/[.!?…]+[\s”"]+/).filter((s) => s.trim().length > 2), syll = (w) => Math.max(1, (w.toLowerCase().replace(/e$/, "").match(/[aeiouy]+/g) || []).length), sample = words.slice(0, 40000), s = sample.reduce((a, w) => a + syll(w), 0) / sample.length, wps = words.length / Math.max(1, sent.length), grade = Math.max(1, 0.39 * wps + 11.8 * s - 15.59);
  const f = {}; for (const w of words) { const k = w.toLowerCase(); if (k.length > 2 && !STOP.has(k)) f[k] = (f[k] || 0) + 1; } const top = Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 14), uniq = new Set(words.map((w) => w.toLowerCase())).size;
  const names = {}; for (const m of text.matchAll(/[a-z,;] ([A-Z][a-z]{2,})/g)) names[m[1]] = (names[m[1]] || 0) + 1; const who = Object.entries(names).filter(([k]) => !STOP.has(k.toLowerCase())).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const mins = words.length / 230, stat = (k, v) => `<div style="border:1px solid rgba(127,127,160,.3);border-radius:10px;padding:10px"><div class="muted" style="font-size:12px">${k}</div><b style="font-size:18px">${v}</b></div>`;
  modal({ title: "About this book", body: `<p class="muted" style="margin-top:0">${esc(item.title)}</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${stat("Words", words.length.toLocaleString())}${stat("Reading time", mins < 60 ? Math.round(mins) + " min" : (mins / 60).toFixed(1) + " hours")}${stat("Different words", uniq.toLocaleString())}${stat("Words per sentence", wps.toFixed(1))}${stat("Reading level", "Grade " + Math.round(grade))}${stat("Read aloud", (words.length / 155 / 60).toFixed(1) + " hours")}</div>${who.length ? `<h3 class="h3" style="margin-top:14px">Most-mentioned names</h3><p>${who.map(([k, n]) => `${esc(k)} <small class="muted">${n}</small>`).join(" · ")}</p>` : ""}<h3 class="h3" style="margin-top:14px">Favourite words</h3><p>${top.map(([k, n]) => `${esc(k)} <small class="muted">${n}</small>`).join(" · ")}</p>` });
}
