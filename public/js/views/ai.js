// Ask AI: chat with the engine you chose, and make pictures with Pollinations.
import { $, $$, esc, icon, toast, uid } from "../util.js";
import { kvGet, kvSet, settings, lib } from "../store.js";
import { setCrumbs } from "../main.js";
import * as AI from "../ai.js";

const SYSTEM = "You are Kitsune's reading companion: an expert on books, manga, comics and writing. Recommend thoughtfully, explain clearly, never invent quotes or facts; say when you're unsure. Use short paragraphs and lists.";
const STARTERS = [
  ["Recommend from my library", () => `Here are titles in my library: ${lib.slice(0, 40).map((i) => i.title).join("; ") || "(empty)"}. Recommend 5 books or manga I might love next, with one line each on why.`],
  ["Manga for a beginner", () => "Suggest 6 manga for someone new to manga, across different genres, with one line on each."],
  ["Explain a literary term", () => "Explain the literary term \"unreliable narrator\" with two famous examples."],
  ["Help me write", () => "I'm writing a short story. Give me 5 unusual opening lines in different genres."],
  ["Plan a reading challenge", () => "Make me a fun 12-month reading challenge with one theme per month."],
];
const STYLES = { "": "No style", manga: "manga style, clean ink lines, screentone", watercolor: "soft watercolor illustration", ink: "black ink drawing, cross-hatching", pixel: "pixel art", cover: "book cover design, title space at top, dramatic lighting", cozy: "cozy storybook illustration, warm light" };

export async function render(view, _name, params) {
  setCrumbs([["Ask AI", "ai"]]);
  const tab = params?.[0] === "imagine" ? "imagine" : "chat";
  view.innerHTML = `<div class="page ai-page">
    <div class="page-head"><div><p class="eyebrow">Optional · you choose the engine</p><h1 class="h1">Ask AI</h1>
      <p class="lede">Talk about books, get recommendations, explain passages, or imagine pictures. Engine: <strong id="ai-eng-name">${esc(AI.engineName())}</strong> <button class="linkish" type="button" id="ai-pick">change</button></p></div></div>
    <div class="seg" role="tablist"><a class="seg-btn" href="#ai" aria-selected="${tab === "chat"}">${icon("spark")}Chat</a><a class="seg-btn" href="#ai/imagine" aria-selected="${tab === "imagine"}">${icon("star")}Imagine</a></div>
    <div id="ai-main"></div></div>`;
  $("#ai-pick", view).onclick = async () => { await AI.setup(); render(view, _name, params); };
  if (tab === "imagine") return imagine($("#ai-main", view));
  return chatView($("#ai-main", view));
}

async function chatView(box) {
  let chats = settings.incognito ? [] : (await kvGet("aiChats", [])) || [];
  let cur = null, ctl = null;
  box.innerHTML = `<div class="ai-chat"><aside class="ai-side"><button class="btn btn-accent" type="button" id="ai-new">${icon("plus")}New chat</button><div id="ai-list"></div>
      ${settings.incognito ? `<p class="hint">Incognito: chats aren't saved.</p>` : ""}</aside>
    <section class="ai-mainpane"><div class="ai-top" id="ai-top"></div><div class="ai-thread big" id="ai-th" aria-live="polite"></div>
      <form class="ai-compose" id="ai-f"><textarea class="field" id="ai-q" rows="2" placeholder="Ask anything about reading, books, manga…" aria-label="Message"></textarea><button class="btn btn-accent" id="ai-send">Send</button></form></section></div>`;
  const th = $("#ai-th", box);
  await AI.modelPicker($("#ai-top", box));
  const save = () => { if (!settings.incognito) kvSet("aiChats", chats.slice(0, 60)); };
  const drawList = () => { $("#ai-list", box).innerHTML = chats.map((c) => `<div class="ai-li ${cur?.id === c.id ? "on" : ""}"><button type="button" class="ai-li-open" data-open="${c.id}">${esc(c.title)}</button><button type="button" class="icon-btn" data-del="${c.id}" aria-label="Delete chat">${icon("trash")}</button></div>`).join("") || `<p class="hint">Your chats appear here.</p>`; };
  const drawThread = () => {
    if (!cur || !cur.msgs.length) { th.innerHTML = `<div class="ai-empty"><p>Try one of these:</p><div class="chips">${STARTERS.map(([l], i) => `<button class="chip" type="button" data-st="${i}">${esc(l)}</button>`).join("")}</div></div>`; return; }
    th.innerHTML = cur.msgs.map((m) => `<div class="ai-msg ai-${m.role === "user" ? "user" : "bot"}">${m.role === "user" ? esc(m.content) : `<div class="ai-text">${AI.md(m.content)}</div>`}</div>`).join("");
    th.scrollTop = th.scrollHeight;
  };
  const send = async (q) => {
    if (!(await AI.ensure())) return;
    $("#ai-eng-name")?.replaceChildren(AI.engineName());
    if (!cur) { cur = { id: uid("ch-"), title: q.slice(0, 60), msgs: [], updated: Date.now() }; chats.unshift(cur); }
    cur.msgs.push({ role: "user", content: q }); drawThread(); drawList();
    th.insertAdjacentHTML("beforeend", `<div class="ai-msg ai-bot"><span class="ai-status">Starting…</span><div class="ai-text"></div></div>`);
    const bot = th.lastElementChild, out = $(".ai-text", bot), st = $(".ai-status", bot); let text = "";
    ctl = new AbortController(); $("#ai-send", box).textContent = "Stop";
    try {
      await AI.chat([{ role: "system", content: SYSTEM }, ...cur.msgs.slice(-20)], { signal: ctl.signal,
        onToken: (t) => { text += t; st.textContent = ""; out.innerHTML = AI.md(text); th.scrollTop = th.scrollHeight; },
        onStatus: (s, p) => (st.textContent = s ? s + (p != null && p < 1 ? ` ${Math.round(p * 100)}%` : "") : "") });
    } catch (e) { if (e.name !== "AbortError") st.textContent = e.message; }
    ctl = null; $("#ai-send", box).textContent = "Send";
    if (text) { cur.msgs.push({ role: "assistant", content: text }); cur.updated = Date.now(); save(); }
  };
  box.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]"), d = e.target.closest("[data-del]"), s = e.target.closest("[data-st]");
    if (o) { cur = chats.find((c) => c.id === o.dataset.open); drawList(); drawThread(); }
    if (d) { chats = chats.filter((c) => c.id !== d.dataset.del); if (cur?.id === d.dataset.del) cur = null; save(); drawList(); drawThread(); }
    if (s) send(STARTERS[+s.dataset.st][1]());
  });
  $("#ai-new", box).onclick = () => { cur = null; drawList(); drawThread(); $("#ai-q", box).focus(); };
  $("#ai-f", box).onsubmit = (e) => { e.preventDefault(); if (ctl) return ctl.abort(); const q = $("#ai-q", box).value.trim(); if (!q) return; $("#ai-q", box).value = ""; send(q); };
  $("#ai-q", box).addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#ai-f", box).requestSubmit(); } });
  drawList(); drawThread();
  return () => ctl?.abort();
}

async function imagine(box) {
  let saved = settings.incognito ? [] : (await kvGet("aiImages", [])) || [];
  box.innerHTML = `<form class="ai-img-form" id="im-f"><textarea class="field" id="im-p" rows="2" placeholder="A fox librarian reading by lantern light…" required aria-label="Describe a picture"></textarea>
      <div class="toolbar" style="margin:0"><select class="field" id="im-size" aria-label="Shape">${Object.entries(AI.IMAGE_SIZES).map(([k, v]) => `<option value="${k}">${v[2]}</option>`).join("")}</select>
      <select class="field" id="im-style" aria-label="Style">${Object.entries(STYLES).map(([k]) => `<option value="${k}">${k ? k[0].toUpperCase() + k.slice(1) : "No style"}</option>`).join("")}</select>
      <select class="field" id="im-model" aria-label="Picture model"><option value="flux">Flux (best)</option><option value="turbo">Turbo (fast)</option></select>
      <button class="btn btn-accent">${icon("star")}Imagine 4</button><button class="btn" type="button" id="im-boost" title="Let the AI engine write a richer prompt">Improve prompt</button></div>
      <p class="hint" style="margin:0">Pictures are made by Pollinations (pollinations.ai): your description is sent to them.</p></form>
    <div class="ai-grid" id="im-new"></div><h3 class="h3" ${saved.length ? "" : "hidden"} id="im-h">Saved pictures</h3><div class="ai-grid" id="im-saved"></div>`;
  const card = (x, keep) => `<figure class="ai-pic"><img ${keep ? "loading=\"lazy\" src" : "data-src"}="${esc(AI.imageUrl(x.prompt, x))}" alt="${esc(x.prompt)}">${keep ? "" : "<span class=\"ai-wait\">Waiting…</span>"}<figcaption><button class="icon-btn" type="button" data-dl="${esc(AI.imageUrl(x.prompt, x))}" aria-label="Download">${icon("download")}</button>${keep ? `<button class="icon-btn" type="button" data-unsave="${x.seed}" aria-label="Remove">${icon("trash")}</button>` : `<button class="icon-btn" type="button" data-save='${esc(JSON.stringify(x))}' aria-label="Save">${icon("bookmark")}</button>`}</figcaption></figure>`;
  let batch = 0;
  const drawSaved = () => { $("#im-saved", box).innerHTML = saved.map((x) => card(x, true)).join(""); $("#im-h", box).hidden = !saved.length; };
  $("#im-f", box).onsubmit = (e) => {
    e.preventDefault();
    const style = STYLES[$("#im-style", box).value] || "", prompt = [$("#im-p", box).value.trim(), style].filter(Boolean).join(", ");
    const opts = { size: $("#im-size", box).value, model: $("#im-model", box).value };
    $("#im-new", box).innerHTML = Array.from({ length: 4 }, () => card({ prompt, ...opts, seed: Math.floor(Math.random() * 1e9) }, false)).join("");
    // Pollinations makes one picture at a time for people without an account, so they load in turn.
    const run = ++batch, imgs = [...box.querySelectorAll("#im-new img[data-src]")];
    (async () => { for (const im of imgs) { if (run !== batch) return; const w = im.nextElementSibling; if (w) w.textContent = "Painting…"; await new Promise((ok) => { im.onload = im.onerror = ok; im.src = im.dataset.src; }); if (w) w.textContent = im.naturalWidth ? "" : "Couldn't make this one"; if (!im.naturalWidth) im.hidden = true; } })();
  };
  $("#im-boost", box).onclick = async () => {
    const p = $("#im-p", box); if (!p.value.trim() || !(await AI.ensure())) return;
    const b = $("#im-boost", box); b.disabled = true; b.textContent = "Improving…";
    try { const t = await AI.chat([{ role: "system", content: "Rewrite the user's picture idea as one vivid, specific image-generation prompt under 60 words. Reply with the prompt only." }, { role: "user", content: p.value }]); if (t.trim()) p.value = t.trim().replace(/^"|"$/g, ""); } catch (err) { toast(err.message); }
    b.disabled = false; b.textContent = "Improve prompt";
  };
  box.addEventListener("click", async (e) => {
    const s = e.target.closest("[data-save]"), u = e.target.closest("[data-unsave]"), d = e.target.closest("[data-dl]");
    if (s) { if (settings.incognito) return toast("Incognito: pictures aren't saved."); saved.unshift(JSON.parse(s.dataset.save)); kvSet("aiImages", saved.slice(0, 200)); drawSaved(); toast("Saved."); }
    if (u) { saved = saved.filter((x) => String(x.seed) !== u.dataset.unsave); kvSet("aiImages", saved); drawSaved(); }
    if (d) { try { const r = await fetch(d.dataset.dl); const blob = await r.blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "kitsune-imagine.jpg"; document.body.append(a); a.click(); a.remove(); } catch { window.open(d.dataset.dl, "_blank", "noopener"); } }
  });
  drawSaved();
}
