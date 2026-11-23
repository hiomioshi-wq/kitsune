// Kitsune Browser, v127:
//  - Share to…: Bluesky, Mastodon (remembers your server), Threads, Reddit, Hacker News, LinkedIn, WhatsApp, Telegram, email
//  - Scan a QR code with the camera and open what it points to
//  - Read the text in a picture on this page (memes, screenshots, scanned pages, comic panels), on this device
import { $, esc, toast, modal } from "./util.js";

// ---------- share to ----------
const SHARE = [
  ["Bluesky", (u, t) => `https://bsky.app/intent/compose?text=${encodeURIComponent(`${t} ${u}`)}`],
  ["Mastodon", null],
  ["Threads", (u, t) => `https://www.threads.net/intent/post?text=${encodeURIComponent(`${t} ${u}`)}`],
  ["Reddit", (u, t) => `https://www.reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}`],
  ["Hacker News", (u, t) => `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}`],
  ["LinkedIn", (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`],
  ["WhatsApp", (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}`],
  ["Telegram", (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`],
  ["Email", (u, t) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}`],
];
function shareTo(t) {
  if (!t.url) return toast("Open a page first.");
  const title = (t.custom || t.title || "").slice(0, 200);
  const m = modal({ title: "Share to…", body: `<p class="muted" style="margin-top:0;word-break:break-all">${esc(title)}<br><small>${esc(t.url)}</small></p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">${SHARE.map(([n]) => `<button class="btn" type="button" data-s="${esc(n)}">${esc(n)}</button>`).join("")}</div><p class="hint">Each opens that service's own share page with the link filled in. Kitsune doesn't post anything for you.</p>` });
  m.root.onclick = (e) => {
    const b = e.target.closest("[data-s]"); if (!b) return; const name = b.dataset.s;
    if (name === "Mastodon") {
      let inst = localStorage.getItem("kitsune.mastodon") || ""; inst = prompt("Your Mastodon server (for example mastodon.social)", inst) || ""; inst = inst.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""); if (!inst) return;
      try { localStorage.setItem("kitsune.mastodon", inst); } catch {}
      open(`https://${inst}/share?text=${encodeURIComponent(`${title} ${t.url}`)}`, "_blank", "noopener"); return;
    }
    const f = SHARE.find(([n]) => n === name)?.[1]; if (f) open(f(t.url, title), "_blank", "noopener");
  };
}

// ---------- QR scanner ----------
async function scanQr(go) {
  if (!("BarcodeDetector" in window)) return toast("This browser can't scan codes. Chrome on Android and desktop Chrome or Edge can.");
  let stream; try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); } catch { return toast("Kitsune needs the camera to scan. Allow camera access and try again."); }
  const det = new BarcodeDetector({ formats: ["qr_code", "ean_13", "ean_8", "upc_a", "code_128"] });
  const m = modal({ title: "Scan a code", body: `<video id="qr-v" playsinline muted style="width:100%;max-height:60vh;border-radius:12px;background:#000"></video><p class="status" id="qr-s">Point the camera at a QR code or barcode.</p>`, onClose: () => stream.getTracks().forEach((x) => x.stop()) });
  const v = $("#qr-v", m.root); v.srcObject = stream; await v.play().catch(() => {});
  let done = false;
  const loop = async () => {
    if (done || !m.root.isConnected) { stream.getTracks().forEach((x) => x.stop()); return; }
    try { const codes = await det.detect(v); const c = codes[0]; if (c) { done = true; stream.getTracks().forEach((x) => x.stop()); const val = c.rawValue;
      if (/^https?:\/\//i.test(val)) { m.close(); go(val, { newTab: true }); toast("Opened the link from the code."); }
      else if (/^\d{8,14}$/.test(val)) { m.close(); go(`https://openlibrary.org/search?q=${val}`, { newTab: true }); toast("Looked up that barcode (as a book ISBN)."); }
      else { $("#qr-s", m.root).innerHTML = `The code says: <b>${esc(val)}</b> <button class="btn btn-sm" type="button" id="qr-c">Copy</button>`; $("#qr-c", m.root).onclick = () => navigator.clipboard?.writeText(val).then(() => toast("Copied.")); }
      return; } } catch {}
    requestAnimationFrame(() => setTimeout(loop, 120));
  };
  loop();
}

// ---------- text in a picture ----------
const TESS = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const loadTess = () => (window.Tesseract ? Promise.resolve(window.Tesseract) : new Promise((res, rej) => { const s = document.createElement("script"); s.src = TESS; s.onload = () => res(window.Tesseract); s.onerror = () => rej(new Error("The text engine couldn't be downloaded.")); document.head.append(s); }));
async function imageBlob(src) {
  try { const r = await fetch(src, { mode: "cors" }); if (r.ok) { const b = await r.blob(); if (/^image\//.test(b.type)) return b; } } catch {}
  const r = await fetch("/api/browse/img?url=" + encodeURIComponent(src)); if (r.ok) return r.blob();
  throw new Error("That picture's site won't let it be read.");
}
function pictureText(root) {
  const imgs = [...new Map([...(root?.querySelectorAll("img") || [])].map((i) => [i.currentSrc || i.src, i]).filter(([s, i]) => s && !s.startsWith("data:") && (i.naturalWidth || 200) >= 120))].map(([src, i]) => ({ src, alt: i.alt || "" })).slice(0, 80);
  if (!imgs.length) return toast("There are no pictures on this page to read.");
  const m = modal({ title: "Read the text in a picture", wide: true, body: `<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap"><label>Language <select class="field" id="pt2-l">${[["eng", "English"], ["jpn", "Japanese"], ["kor", "Korean"], ["chi_sim", "Chinese (simplified)"], ["chi_tra", "Chinese (traditional)"], ["fra", "French"], ["spa", "Spanish"], ["deu", "German"], ["rus", "Russian"]].map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label><span class="hint">Pick a picture. The reading happens on this device.</span></div><div id="pt2-g" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">${imgs.map((x, i) => `<button type="button" data-i="${i}" style="padding:0;border:1px solid rgba(127,127,160,.3);border-radius:8px;overflow:hidden;background:none;cursor:pointer"><img src="${esc(x.src)}" alt="${esc(x.alt)}" loading="lazy" referrerpolicy="no-referrer" style="width:100%;height:100px;object-fit:cover;display:block"></button>`).join("")}</div><p class="status" id="pt2-s"></p><textarea class="field" id="pt2-o" style="width:100%;min-height:140px;display:none"></textarea><p id="pt2-a" style="display:none"><button class="btn btn-sm" type="button" id="pt2-c">Copy</button> <button class="btn btn-sm" type="button" id="pt2-t">Translate</button></p>` });
  m.root.onclick = async (e) => {
    const b = e.target.closest("[data-i]"); if (b) {
      const x = imgs[+b.dataset.i], s = $("#pt2-s", m.root), o = $("#pt2-o", m.root); s.textContent = "Getting the picture…";
      try {
        const blob = await imageBlob(x.src); s.textContent = "Starting the text engine (first time downloads it)…";
        const T = await loadTess(), lang = $("#pt2-l", m.root).value;
        const w = await T.createWorker(lang, 1, { logger: (p) => { if (p.status === "recognizing text") s.textContent = `Reading… ${Math.round(p.progress * 100)}%`; } });
        const url = URL.createObjectURL(blob), im = new Image(); im.src = url; await im.decode(); const sc = Math.min(2.5, Math.max(1, 1600 / Math.max(im.naturalWidth || 800, im.naturalHeight || 800))), cv = document.createElement("canvas"); cv.width = Math.round((im.naturalWidth || 800) * sc); cv.height = Math.round((im.naturalHeight || 800) * sc); const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
        try { const px = g.getImageData(0, 0, cv.width, cv.height), dd = px.data, hist = new Uint32Array(256); for (let k = 0; k < dd.length; k += 4) { const y = (dd[k] * 0.299 + dd[k + 1] * 0.587 + dd[k + 2] * 0.114) | 0; dd[k] = dd[k + 1] = dd[k + 2] = y; hist[y]++; } let lo = 0, hi = 255, acc = 0, N = dd.length / 4; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > N * 0.02) { lo = v; break; } } acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > N * 0.02) { hi = v; break; } } if (hi - lo > 40) for (let k = 0; k < dd.length; k += 4) { const y = Math.max(0, Math.min(255, ((dd[k] - lo) * 255) / (hi - lo))) | 0; dd[k] = dd[k + 1] = dd[k + 2] = y; } g.putImageData(px, 0, 0); } catch {}
        await w.setParameters({ tessedit_pageseg_mode: "11" });
        const { data } = await w.recognize(cv); await w.terminate();
        const text = (data.text || "").trim(); o.style.display = ""; $("#pt2-a", m.root).style.display = ""; o.value = text || "(No text found in that picture.)"; s.textContent = text ? `Read ${text.split(/\s+/).length} words (about ${Math.round(data.confidence || 0)}% sure).` : "";
      } catch (err) { s.textContent = err.message; }
      return;
    }
    if (e.target.id === "pt2-c") navigator.clipboard?.writeText($("#pt2-o", m.root).value).then(() => toast("Copied."));
    if (e.target.id === "pt2-t") { const { translate } = await import("./lookup.js"); const from = { eng: "en", jpn: "ja", kor: "ko", chi_sim: "zh-CN", chi_tra: "zh-TW", fra: "fr", spa: "es", deu: "de", rus: "ru" }[$("#pt2-l", m.root).value]; const to = (navigator.language || "en").slice(0, 2) === from.slice(0, 2) ? (from === "en" ? "es" : "en") : (navigator.language || "en").slice(0, 2); try { const r = await translate($("#pt2-o", m.root).value.slice(0, 480), from, to); $("#pt2-o", m.root).value += `\n\n— ${to}:\n${r.text}`; } catch (err) { toast(err.message); } }
  };
}

export function items({ T, go, root }) {
  return [
    { label: "Share to… (Bluesky, Mastodon, Reddit, WhatsApp…)", icon: "share", run: () => shareTo(T()) },
    { label: "Scan a QR code or barcode…", icon: "zoom", run: () => scanQr(go) },
    { label: "Read the text in a picture on this page…", icon: "type", run: () => pictureText(root()) },
  ];
}
