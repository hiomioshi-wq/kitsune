// Kitsune AI: one small interface over four engines, all optional.
//  • Pollinations (pollinations.ai): free, no account. Your text goes to Pollinations.
//  • Puter (puter.com): sign in with a free Puter account for many big models. Your text goes to Puter.
//  • On this device (WebGPU): a small open model runs in your browser with WebLLM. Nothing leaves the device.
//  • Built into this browser: Chrome's on-device model, where available. Nothing leaves the device.
// Nothing is sent anywhere until you pick an engine. Pictures ("Imagine") are made by Pollinations.
import { $, $$, esc, icon, toast, modal } from "./util.js";

const KEY = "kitsune.ai";
const WEBLLM = "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm";
const PUTER = "https://js.puter.com/v2/";

export const ENGINES = {
  pollinations: { name: "Pollinations", where: "cloud", about: "Free, no account. What you ask is sent to pollinations.ai." },
  puter: { name: "Puter", where: "cloud", about: "Sign in with a free Puter account to use many large models. What you ask is sent to Puter. Loads Puter's script into Kitsune." },
  webgpu: { name: "On this device (WebGPU)", where: "device", about: "Private: a small open model runs on your graphics chip. Downloads the model once (about 0.4 to 2 GB)." },
  builtin: { name: "Built into this browser", where: "device", about: "Private: your browser's own on-device model (Chrome's Gemini Nano)." },
};

export function cfg() { try { return { provider: "", models: {}, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { provider: "", models: {} }; } }
export function setCfg(patch) { const c = { ...cfg(), ...patch }; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} return c; }
export const engineName = (p = cfg().provider) => ENGINES[p]?.name || "None";

export async function availability() {
  const out = { pollinations: "ready", puter: "ready", webgpu: "unavailable", builtin: "unavailable" };
  try { if (navigator.gpu && (await navigator.gpu.requestAdapter())) out.webgpu = "ready"; } catch {}
  try { if (self.LanguageModel) { const a = await LanguageModel.availability(); out.builtin = a === "available" ? "ready" : a === "unavailable" ? "unavailable" : "download"; } } catch {}
  return out;
}

// ---------- engines ----------
function loadScript(src) {
  return new Promise((ok, no) => { if ([...document.scripts].some((s) => s.src === src)) return ok(); const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => no(new Error("Couldn't load " + new URL(src).host)); document.head.append(s); });
}

async function viaPollinations(messages, { onToken, onStatus, signal, model }) {
  const r = await fetch("https://text.pollinations.ai/openai", { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: model || "openai", messages, stream: true, private: true, referrer: "kitsune-reader" }) });
  if (!r.ok) throw new Error(r.status === 429 ? "Pollinations is busy. Wait a moment and try again." : `Pollinations answered ${r.status}.`);
  if (!/event-stream/.test(r.headers.get("content-type") || "")) { const j = await r.json(); const t = j.choices?.[0]?.message?.content || ""; onToken(t); return t; }
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "", full = "", thinking = false;
  for (;;) {
    const { done, value } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim(); if (data === "[DONE]") return full;
      try { const d = JSON.parse(data).choices?.[0]?.delta || {}; if (d.reasoning && !thinking && !full) { thinking = true; onStatus("Thinking…"); } if (d.content) { if (thinking) { thinking = false; onStatus(""); } full += d.content; onToken(d.content); } } catch {}
    }
  }
  return full;
}
export async function pollinationsModels() {
  try { const r = await fetch("https://text.pollinations.ai/models"); const j = await r.json(); return j.map((m) => ({ id: m.name, label: `${m.name} · ${m.description || ""}`.slice(0, 80) })); } catch { return [{ id: "openai", label: "openai" }]; }
}

async function viaPuter(messages, { onToken, onStatus, signal, model }) {
  if (!window.puter) { onStatus("Loading Puter…"); await loadScript(PUTER); }
  onStatus("Waiting for Puter (sign in if it asks)…");
  const res = await window.puter.ai.chat(messages, { stream: true, ...(model ? { model } : {}) });
  onStatus(""); let full = "";
  if (res && typeof res[Symbol.asyncIterator] === "function") { for await (const part of res) { if (signal?.aborted) break; const t = part?.text || ""; if (t) { full += t; onToken(t); } } }
  else { full = String(res?.message?.content ?? res ?? ""); onToken(full); }
  return full;
}
export const PUTER_MODELS = ["", "gpt-5-nano", "gpt-4o-mini", "claude-sonnet-4", "gemini-2.0-flash", "deepseek-chat", "mistral-large-latest"];

const W = { lib: null, engine: null, id: "" };
const webllm = async () => (W.lib ||= await import(WEBLLM));
export async function webgpuModels() {
  const lib = await webllm();
  return lib.prebuiltAppConfig.model_list.filter((m) => /instruct|-it-|chat/i.test(m.model_id) && !/vision/i.test(m.model_id) && (m.vram_required_MB || 0) < 7000)
    .map((m) => ({ id: m.model_id, mb: Math.round(m.vram_required_MB || 0) })).sort((a, b) => a.mb - b.mb);
}
async function defaultWebgpuModel() {
  const list = await webgpuModels(), ids = new Set(list.map((m) => m.id));
  let f16 = false; try { f16 = (await navigator.gpu.requestAdapter())?.features.has("shader-f16"); } catch {}
  for (const base of ["Qwen2.5-1.5B-Instruct", "Llama-3.2-1B-Instruct", "Qwen2.5-0.5B-Instruct", "gemma-2-2b-it"]) { const id = `${base}-${f16 ? "q4f16_1" : "q4f32_1"}-MLC`; if (ids.has(id)) return id; }
  return list[0]?.id;
}
async function viaWebgpu(messages, { onToken, onStatus, signal, model }) {
  if (!navigator.gpu) throw new Error("This browser doesn't have WebGPU. Try Chrome or Edge, or pick another engine.");
  onStatus("Loading WebLLM…");
  const lib = await webllm(), id = model || (await defaultWebgpuModel());
  if (!W.engine || W.id !== id) {
    if (W.engine) { try { await W.engine.unload(); } catch {} }
    W.engine = null;
    W.engine = await lib.CreateMLCEngine(id, { initProgressCallback: (p) => onStatus(`${p.text || "Loading model…"}`, p.progress) });
    W.id = id;
  }
  onStatus("");
  const chunks = await W.engine.chat.completions.create({ messages, stream: true, temperature: 0.6 });
  let full = "";
  for await (const c of chunks) { if (signal?.aborted) { try { W.engine.interruptGenerate(); } catch {} break; } const t = c.choices?.[0]?.delta?.content || ""; if (t) { full += t; onToken(t); } }
  return full;
}

async function viaBuiltin(messages, { onToken, onStatus, signal }) {
  if (!self.LanguageModel) throw new Error("This browser has no built-in AI model.");
  const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
  const hist = messages.filter((m) => m.role !== "system"), last = hist.pop();
  const s = await LanguageModel.create({ signal, initialPrompts: [...(sys ? [{ role: "system", content: sys }] : []), ...hist], monitor(m) { m.addEventListener("downloadprogress", (e) => onStatus("Downloading the browser's model…", e.loaded)); } });
  onStatus(""); let full = "";
  try { for await (const ch of s.promptStreaming(last.content, { signal })) { full += ch; onToken(ch); } } finally { try { s.destroy(); } catch {} }
  return full;
}

const RUN = { pollinations: viaPollinations, puter: viaPuter, webgpu: viaWebgpu, builtin: viaBuiltin };
// chat(messages) → the whole answer; tokens stream to onToken as they arrive.
export async function chat(messages, { onToken = () => {}, onStatus = () => {}, signal, provider } = {}) {
  const c = cfg(), p = provider || c.provider;
  if (!RUN[p]) throw new Error("Pick an AI engine first.");
  return RUN[p](messages, { onToken, onStatus, signal, model: c.models?.[p] || "" });
}

// ---------- pictures (Pollinations) ----------
export const IMAGE_SIZES = { square: [1024, 1024, "Square"], cover: [832, 1216, "Book cover"], wide: [1216, 704, "Wide"], phone: [720, 1280, "Phone wallpaper"] };
export function imageUrl(prompt, { size = "square", seed = Math.floor(Math.random() * 1e9), model = "flux" } = {}) {
  const [w, h] = IMAGE_SIZES[size] || IMAGE_SIZES.square;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&model=${model}&nologo=true&private=true&referrer=kitsune-reader`;
}

// ---------- choosing an engine ----------
export async function setup() {
  const av = await availability(), c = cfg();
  return new Promise((done) => {
    const lbl = { ready: "", download: " · will download", unavailable: " · not available here" };
    const m = modal({ title: "Choose an AI engine", wide: true, onClose: () => done(cfg().provider || null), body: `<p class="muted" style="margin-top:0">AI in Kitsune is optional. Nothing is sent anywhere until you choose. You can change this any time in Settings.</p>
      <div class="ai-engines">${Object.entries(ENGINES).map(([k, e]) => `<button type="button" class="ai-engine" data-p="${k}" aria-pressed="${c.provider === k}" ${av[k] === "unavailable" ? "disabled" : ""}>
        <span class="ai-engine-top"><strong>${esc(e.name)}</strong><span class="chip ${e.where === "device" ? "chip-good" : ""}">${e.where === "device" ? "Private" : "Cloud"}</span></span>
        <small>${esc(e.about)}${esc(lbl[av[k]] || "")}</small></button>`).join("")}</div>`,
      actions: `<button class="btn btn-ghost" type="button" data-off style="margin-right:auto">Turn AI off</button><button class="btn" type="button" data-close>Close</button>` });
    m.root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-p]"); if (b && !b.disabled) { setCfg({ provider: b.dataset.p }); toast(`AI engine: ${ENGINES[b.dataset.p].name}.`); m.close(); }
      if (e.target.closest("[data-off]")) { setCfg({ provider: "" }); toast("AI is off."); m.close(); }
    });
  });
}
export async function ensure() { return cfg().provider || (await setup()); }

export async function modelPicker(anchorRoot) {
  const p = cfg().provider; let opts = [];
  if (p === "pollinations") opts = (await pollinationsModels()).map((m) => [m.id, m.label]);
  else if (p === "puter") opts = PUTER_MODELS.map((x) => [x, x || "Puter's default"]);
  else if (p === "webgpu") { try { opts = (await webgpuModels()).map((m) => [m.id, `${m.id} · ${m.mb ? (m.mb / 1024).toFixed(1) + " GB" : ""}`]); } catch { opts = []; } opts.unshift(["", "Recommended for this device"]); }
  else return null;
  const cur = cfg().models?.[p] || "";
  const sel = document.createElement("select"); sel.className = "field ai-model"; sel.setAttribute("aria-label", "Model");
  sel.innerHTML = opts.map(([v, l]) => `<option value="${esc(v)}" ${v === cur ? "selected" : ""}>${esc(l)}</option>`).join("");
  sel.onchange = () => setCfg({ models: { ...cfg().models, [p]: sel.value } });
  anchorRoot?.append(sel);
  return sel;
}

// ---------- a tiny, safe markdown renderer for answers ----------
export function md(text) {
  const blocks = String(text).split(/```/);
  return blocks.map((b, i) => {
    if (i % 2) return `<pre class="ai-code"><code>${esc(b.replace(/^[\w-]*\n/, ""))}</code></pre>`;
    const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`);
    const out = []; let list = null;
    for (const raw of b.split("\n")) {
      const line = raw.trimEnd(), li = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/), h = line.match(/^(#{1,4})\s+(.*)/);
      if (li) { if (!list) { list = /^\s*\d/.test(line) ? "ol" : "ul"; out.push(`<${list}>`); } out.push(`<li>${inline(li[1])}</li>`); continue; }
      if (list) { out.push(`</${list}>`); list = null; }
      if (h) out.push(`<h4>${inline(h[2])}</h4>`); else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    }
    if (list) out.push(`</${list}>`);
    return out.join("");
  }).join("");
}

// ---------- a ready-made "ask" panel used across Kitsune ----------
// askPanel({ title, system, prompt, context }) streams the answer and lets you ask follow-ups.
export async function askPanel({ title = "Ask AI", system = "", prompt = "", context = "", quote = "" } = {}) {
  if (!(await ensure())) return;
  const msgs = [{ role: "system", content: (system || "You are a helpful reading companion inside Kitsune, a reading app. Be clear and concise; use short paragraphs or lists.") + (context ? `\n\nContext:\n${context.slice(0, 14000)}` : "") }];
  const m = modal({ title, wide: true, body: `${quote ? `<blockquote class="ai-quote">${esc(quote.slice(0, 600))}${quote.length > 600 ? "…" : ""}</blockquote>` : ""}
    <div class="ai-thread" id="ai-th" aria-live="polite"></div>
    <form class="ai-compose" id="ai-f"><textarea class="field" id="ai-q" rows="1" placeholder="Ask a follow-up…" aria-label="Your question"></textarea><button class="btn btn-accent" type="submit" id="ai-send">Ask</button></form>
    <p class="ai-foot"><span>${esc(engineName())}</span> · <button type="button" class="linkish" id="ai-eng">change engine</button></p>` });
  const th = $("#ai-th", m.root); let ctl = null;
  const send = async (q) => {
    msgs.push({ role: "user", content: q });
    th.insertAdjacentHTML("beforeend", `<div class="ai-msg ai-user">${esc(q.length > 400 && prompt === q ? q.slice(0, 160) + "…" : q)}</div><div class="ai-msg ai-bot"><span class="ai-status">Starting…</span><div class="ai-text"></div></div>`);
    const bot = th.lastElementChild, out = $(".ai-text", bot), st = $(".ai-status", bot); let text = "";
    ctl = new AbortController(); $("#ai-send", m.root).textContent = "Stop";
    try {
      text = await chat(msgs, { signal: ctl.signal, onToken: (t) => { text += t; st.textContent = ""; out.innerHTML = md(text); th.scrollTop = th.scrollHeight; }, onStatus: (s, p) => (st.textContent = s ? s + (p != null && p < 1 ? ` ${Math.round(p * 100)}%` : "") : "") });
      msgs.push({ role: "assistant", content: text });
    } catch (e) { if (e.name !== "AbortError") st.textContent = e.message; }
    if (!text && !st.textContent) st.textContent = "No answer.";
    ctl = null; $("#ai-send", m.root).textContent = "Ask";
    bot.insertAdjacentHTML("beforeend", text ? `<button type="button" class="btn btn-sm ai-copy">Copy</button>` : "");
  };
  m.root.addEventListener("click", (e) => { const c = e.target.closest(".ai-copy"); if (c) navigator.clipboard?.writeText(c.parentElement.querySelector(".ai-text").innerText).then(() => toast("Copied.")); });
  $("#ai-eng", m.root).onclick = async () => { await setup(); $(".ai-foot span", m.root).textContent = engineName(); };
  $("#ai-f", m.root).onsubmit = (e) => { e.preventDefault(); if (ctl) return ctl.abort(); const q = $("#ai-q", m.root).value.trim(); if (!q) return; $("#ai-q", m.root).value = ""; send(q); };
  $("#ai-q", m.root).addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#ai-f", m.root).requestSubmit(); } });
  if (prompt) send(prompt); else $("#ai-q", m.root).focus();
}

// ---------- a picture of a passage ----------
const STYLE_WORDS = { "": "detailed storybook illustration", watercolor: "soft watercolor illustration", ink: "black ink drawing, cross-hatching", manga: "manga panel, clean ink lines, screentone", oil: "classical oil painting, rich light" };
const styleSeg = (id) => `<div class="seg" id="${id}">${[["", "Illustration"], ["watercolor", "Watercolor"], ["ink", "Ink"], ["manga", "Manga"], ["oil", "Oil painting"]].map(([v, n], i) => `<button type="button" data-v="${v}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div>`;
async function loadInTurn(imgs) { for (const im of imgs) { const w = im.nextElementSibling; if (w) w.textContent = "Painting…"; await new Promise((ok) => { im.onload = im.onerror = ok; im.src = im.dataset.src; }); if (w) w.textContent = im.naturalWidth ? "" : "Couldn't make this one"; } }
export async function illustrate(text, { title = "" } = {}) {
  const base = String(text).replace(/\s+/g, " ").trim().slice(0, 600);
  const m = modal({ title: "Picture this", wide: true, body: `<blockquote class="ai-quote">${esc(base.slice(0, 300))}${base.length > 300 ? "…" : ""}</blockquote>${styleSeg("il-s")}<div class="ai-grid" id="il-g" style="margin-top:12px"><p class="hint">Imagining the scene…</p></div><p class="hint" style="margin:6px 0 0">Pictures by Pollinations: this passage is sent to pollinations.ai.</p>`,
    actions: `<button class="btn" type="button" id="il-again">Another</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  let style = "", prompt = base.slice(0, 300);
  if (cfg().provider) { try { const t = await chat([{ role: "system", content: "Turn this book passage into one vivid image-generation prompt under 50 words: the setting, who is there, what is happening, mood and lighting. No text or letters in the image. Reply with the prompt only." }, { role: "user", content: base }]); if (t.trim()) prompt = t.trim().replace(/^["']|["']$/g, "").slice(0, 400); } catch {} }
  const make = () => { const u = imageUrl(`${prompt}, ${STYLE_WORDS[style]}${title ? `, scene from the book ${title}` : ""}, no text`, { size: "wide" }); $("#il-g", m.root).innerHTML = `<figure class="ai-pic" style="grid-column:1/-1"><img data-src="${esc(u)}" alt="An illustration of the passage"><span class="ai-wait"></span><figcaption><a class="icon-btn" href="${esc(u)}" target="_blank" rel="noopener" aria-label="Open full size">${icon("download")}</a></figcaption></figure>`; loadInTurn([...m.root.querySelectorAll("#il-g img")]); };
  m.root.addEventListener("click", (e) => { const b = e.target.closest("#il-s [data-v]"); if (b) { style = b.dataset.v; $$("#il-s [data-v]", m.root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); make(); } if (e.target.closest("#il-again")) make(); });
  make();
}

// ---------- a cover for a book or manga ----------
export async function coverDialog(item, after = () => {}) {
  const kind = item.type === "manga" ? "manga volume cover art" : item.type === "comic" ? "comic book cover art" : "book cover illustration";
  const m = modal({ title: "Make a cover · " + item.title, wide: true, body: `<p class="muted" style="margin-top:0">Pick one to use as the cover in your library. The title${item.author ? " and author are" : " is"} sent to Pollinations (pollinations.ai) to make them.</p>${styleSeg("cv-s")}<div class="ai-grid" id="cv-g" style="margin-top:12px"></div>`,
    actions: `<button class="btn" type="button" id="cv-more">Make 4 more</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  let style = "";
  const make = () => {
    const prompt = `${kind} for "${item.title}"${item.author ? ` by ${item.author}` : ""}${item.series ? `, series ${item.series}` : ""}, ${STYLE_WORDS[style]}, striking composition, no text, no letters, no title`;
    $("#cv-g", m.root).innerHTML = Array.from({ length: 4 }, () => { const u = imageUrl(prompt, { size: "cover" }); return `<figure class="ai-pic ai-cover"><img data-src="${esc(u)}" alt="A cover choice"><span class="ai-wait">Waiting…</span><figcaption><button class="btn btn-sm btn-accent" type="button" data-use="${esc(u)}">Use this</button></figcaption></figure>`; }).join("");
    loadInTurn([...m.root.querySelectorAll("#cv-g img")]);
  };
  m.root.addEventListener("click", async (e) => {
    const b = e.target.closest("#cv-s [data-v]"); if (b) { style = b.dataset.v; $$("#cv-s [data-v]", m.root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); make(); }
    if (e.target.closest("#cv-more")) make();
    const use = e.target.closest("[data-use]");
    if (use) {
      use.disabled = true; use.textContent = "Saving…";
      try {
        const r = await fetch("/api/browse/img?url=" + encodeURIComponent(use.dataset.use)); if (!r.ok) throw new Error();
        const { saveItem } = await import("./store.js");
        item.coverBlob = await r.blob(); item.aiCover = true; item.coverV = Date.now();
        await saveItem(item); m.close(); toast("New cover saved."); after();
      } catch { use.disabled = false; use.textContent = "Use this"; toast("Couldn't save that picture. Try another."); }
    }
  });
  make();
}
