// Kitsune Browser, v114: tools for code. Every code block on a page gets syntax colours, a language label, a copy
// button and line wrapping; the menu adds a list of a page's code blocks (copy or download each), a JavaScript
// playground that runs in a locked sandbox, a regular-expression tester, a text diff, a Markdown preview, and
// "copy as curl / fetch" for the page's address — plus this round: a JSON→JSON-Schema inferrer, a timestamp
// toolkit (Unix ⇄ ISO, with a "now" button), a regex golf scorer that times a pattern against the page's code
// blocks, and a text table aligner for messy delimited text.
import { $, esc, toast, modal } from "./util.js";

// ---------- a small highlighter (comments, strings, numbers, keywords) ----------
const KW = {
  js: "async await break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield true false null undefined interface type enum implements private public protected readonly as",
  py: "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield self match case",
  c: "auto break case char const continue default do double else enum extern float for goto if inline int long register return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false nullptr class public private protected namespace template typename using virtual override new delete this throw try catch fn let mut pub impl trait use mod crate match loop where func package go defer chan map range select type var interface struct import return",
  sh: "if then else elif fi for in do done while until case esac function return local export echo exit set unset source alias sudo cd",
  sql: "select from where and or not insert into values update set delete create table drop alter add index primary key foreign references join left right inner outer on group by order having limit offset as distinct union all null is like in between case when then else end count sum avg min max",
  css: "important media supports keyframes import font-face root",
};
const LANG = (cls, text) => {
  const m = (cls || "").match(/(?:language|lang|highlight-source|brush:?)-?\s*([\w+#-]+)/i), l = (m?.[1] || "").toLowerCase();
  if (/^(js|javascript|jsx|ts|tsx|typescript|mjs|json|java|kotlin|swift|dart|scala|csharp|cs|c#|php)$/.test(l)) return l === "json" ? "json" : "js";
  if (/^(py|python|python3|ruby|rb)$/.test(l)) return "py";
  if (/^(c|cpp|c\+\+|h|hpp|rust|rs|go|golang|zig|objc)$/.test(l)) return "c";
  if (/^(sh|bash|zsh|shell|console|powershell|ps1|fish)$/.test(l)) return "sh";
  if (/^(sql|mysql|postgres|postgresql|sqlite)$/.test(l)) return "sql";
  if (/^(css|scss|sass|less)$/.test(l)) return "css";
  if (/^(html|xml|svg|vue|svelte)$/.test(l)) return "html";
  if (/^(yaml|yml|toml|ini)$/.test(l)) return "yaml";
  if (l) return l;
  const t = text.slice(0, 2000);
  if (/^\s*[{[][\s\S]*[}\]]\s*$/.test(t) && /"\s*:/.test(t)) return "json";
  if (/^\s*<[a-z!]/i.test(t)) return "html";
  if (/\bdef \w+\(|^\s*import \w+$|print\(/m.test(t)) return "py";
  if (/^\s*(\$ |sudo |npm |pip |git |cd |curl |brew )/m.test(t)) return "sh";
  if (/\b(SELECT|INSERT|UPDATE|CREATE TABLE)\b/.test(t)) return "sql";
  if (/\b(fn |let mut|impl |#include|func |package main)/.test(t)) return "c";
  if (/\b(const|let|function|=>|import .* from)\b/.test(t)) return "js";
  if (/^[\w.#-][^{]*\{[^}]*:[^}]*\}/m.test(t)) return "css";
  return "";
};
function highlight(text, lang) {
  if (!lang || text.length > 60000) return esc(text);
  if (lang === "html") return esc(text).replace(/(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?)([\w:-]+)|([\w:-]+)(=)(&quot;[^&]*?&quot;|"[^"]*")/g, (m, com, open, tag, attr, eq, val) => com ? `<i class="c">${com}</i>` : open ? `${open}<b class="k">${tag}</b>` : `<b class="a">${attr}</b>${eq}<i class="s">${val}</i>`);
  const kw = new Set((KW[lang === "json" ? "js" : lang === "yaml" ? "py" : lang] || KW.js).split(" "));
  const comment = lang === "py" || lang === "sh" || lang === "yaml" ? "#[^\\n]*" : lang === "sql" ? "--[^\\n]*" : "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/";
  const re = new RegExp(`(${comment})|("(?:\\\\.|[^"\\\\\\n])*"|'(?:\\\\.|[^'\\\\\\n])*'|\`(?:\\\\.|[^\`\\\\])*\`)|(\\b\\d[\\d_]*(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b|\\b0x[0-9a-f]+\\b)|([A-Za-z_$][\\w$]*)`, "gi");
  let out = "", last = 0;
  for (const m of text.matchAll(re)) {
    out += esc(text.slice(last, m.index)); last = m.index + m[0].length;
    if (m[1]) out += `<i class="c">${esc(m[1])}</i>`;
    else if (m[2]) out += `<i class="s">${esc(m[2])}</i>`;
    else if (m[3]) out += `<i class="n">${esc(m[3])}</i>`;
    else out += kw.has(lang === "sql" ? m[4].toLowerCase() : m[4]) ? `<b class="k">${esc(m[4])}</b>` : /^[A-Z][a-z]/.test(m[4]) ? `<span class="t">${esc(m[4])}</span>` : text[last] === "(" ? `<span class="f">${esc(m[4])}</span>` : esc(m[4]);
  }
  return out + esc(text.slice(last));
}
const EXT = { js: "js", py: "py", c: "c", sh: "sh", sql: "sql", css: "css", html: "html", json: "json", yaml: "yaml" };

const STYLE = `.kbc-wrap{position:relative}.kbc-bar{position:absolute;top:4px;right:4px;display:flex;gap:4px;opacity:.15;transition:opacity .15s;z-index:2}.kbc-wrap:hover .kbc-bar,.kbc-bar:focus-within{opacity:1}
.kbc-bar button,.kbc-bar span{font:11px/1 system-ui,sans-serif;padding:4px 7px;border-radius:5px;border:1px solid #8886;background:#fffd;color:#222;cursor:pointer}.kbc-bar span{cursor:default;opacity:.8}
pre.kbc-hl i.c{color:#6a737d;font-style:italic}pre.kbc-hl i.s{color:#22863a;font-style:normal}pre.kbc-hl i.n{color:#005cc5;font-style:normal}pre.kbc-hl b.k{color:#d73a49;font-weight:600}pre.kbc-hl b.a{color:#6f42c1;font-weight:400}pre.kbc-hl span.t{color:#6f42c1}pre.kbc-hl span.f{color:#e36209}
.kb-dark pre.kbc-hl i.s,:host(.kb-dark) pre.kbc-hl i.s{color:#85e89d}:host(.kb-dark) pre.kbc-hl b.k{color:#f97583}:host(.kb-dark) pre.kbc-hl i.n{color:#79b8ff}:host(.kb-dark) pre.kbc-hl span.t{color:#b392f0}:host(.kb-dark) pre.kbc-hl span.f{color:#ffab70}
pre.kbc-wrapped,pre.kbc-wrapped code{white-space:pre-wrap!important;word-break:break-word}`;

// ---------- on every page ----------
const coloursOn = () => localStorage.getItem("kitsune.codeColours") !== "0";
export function enhance(root) {
  if (!root?.querySelectorAll) return;
  if (!root.querySelector("#kbc-style")) { const s = document.createElement("style"); s.id = "kbc-style"; s.textContent = STYLE; (root.querySelector(".kb-html") || root).append(s); }
  const pres = [...root.querySelectorAll("pre")].filter((p) => !p.dataset.kbc && (p.textContent || "").trim().length > 2).slice(0, 300);
  for (const pre of pres) {
    pre.dataset.kbc = "1";
    const code = pre.querySelector("code") || pre, text = code.textContent || "";
    const lang = LANG(`${code.className} ${pre.className} ${pre.parentElement?.className || ""}`, text);
    pre.dataset.kbcLang = lang;
    const coloured = code.querySelector("span[class], b, i, em, strong");
    if (coloursOn() && !coloured && lang && lang !== "text") { code.innerHTML = highlight(text, lang); pre.classList.add("kbc-hl"); }
    const wrap = document.createElement("div"); wrap.className = "kbc-wrap"; pre.replaceWith(wrap); wrap.append(pre);
    const bar = document.createElement("div"); bar.className = "kbc-bar";
    bar.innerHTML = `${lang ? `<span>${esc(lang)}</span>` : ""}<button type="button" data-k="wrap" title="Wrap long lines">wrap</button><button type="button" data-k="copy">copy</button>`;
    bar.onclick = async (e) => {
      const k = e.target.closest("button")?.dataset.k; if (!k) return; e.preventDefault(); e.stopPropagation();
      if (k === "wrap") pre.classList.toggle("kbc-wrapped");
      if (k === "copy") { try { await navigator.clipboard.writeText(text.replace(/\n$/, "")); e.target.textContent = "copied ✓"; setTimeout(() => (e.target.textContent = "copy"), 1400); } catch { toast("Couldn't copy. Select the code instead."); } }
    };
    wrap.append(bar);
  }
}
const blocks = (root) => [...(root?.querySelectorAll("pre") || [])].map((p) => ({ text: ((p.querySelector("code") || p).textContent || "").replace(/\n$/, ""), lang: p.dataset.kbcLang || LANG((p.querySelector("code") || p).className, p.textContent || "") })).filter((b) => b.text.trim());
const download = (name, text, type = "text/plain") => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); };

// ---------- tools ----------
function playground(initial = "") {
  const m = modal({ title: "JavaScript playground", wide: true, body: `<p class="muted" style="margin-top:0">Runs in a locked sandbox with no access to Kitsune, your data or the page. <kbd>⌘/Ctrl Enter</kbd> runs it.</p>
    <textarea class="field" id="pg-code" spellcheck="false" style="width:100%;min-height:220px;font:13px/1.5 ui-monospace,Menlo,monospace">${esc(initial || 'const words = ["kitsune", "fox", "lantern"];\nconsole.log(words.map((w) => w.toUpperCase()));\nreturn words.length;')}</textarea>
    <div style="display:flex;gap:8px;margin:8px 0"><button class="btn btn-accent" type="button" id="pg-run">Run</button><button class="btn" type="button" id="pg-clear">Clear output</button></div>
    <pre id="pg-out" style="min-height:90px;max-height:260px;overflow:auto;padding:10px;border-radius:8px;background:rgba(127,127,160,.12);font:12.5px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap"></pre>` });
  const out = $("#pg-out", m.root), code = $("#pg-code", m.root); let frame = null, runId = "";
  const onMsg = (e) => { if (!e.data?.kbpg || e.data.id !== runId) return; const { level, text } = e.data; out.insertAdjacentHTML("beforeend", `<span style="color:${level === "error" ? "#e5534b" : level === "warn" ? "#d4a72c" : level === "result" ? "#3fa66a" : "inherit"}">${esc(text)}</span>\n`); out.scrollTop = out.scrollHeight; };
  addEventListener("message", onMsg);
  const run = () => {
    frame?.remove(); out.textContent = ""; runId = Math.random().toString(36).slice(2);
    frame = document.createElement("iframe"); frame.setAttribute("sandbox", "allow-scripts"); frame.style.display = "none";
    const src = JSON.stringify(code.value);
    frame.srcdoc = `<script>const send=(level,a)=>parent.postMessage({kbpg:1,id:"${runId}",level,text:a.map(x=>{try{return typeof x==="string"?x:JSON.stringify(x,null,2)}catch{return String(x)}}).join(" ")},"*");
      ["log","info","warn","error","table"].forEach(k=>{console[k]=(...a)=>send(k==="info"||k==="table"?"log":k,a)});
      addEventListener("error",e=>send("error",[e.message]));addEventListener("unhandledrejection",e=>send("error",["Unhandled: "+(e.reason&&e.reason.message||e.reason)]));
      (async()=>{try{const r=await (new Function("return (async()=>{"+${src}+"\\n})()"))();if(r!==undefined)send("result",["→ ",r])}catch(e){send("error",[e.name+": "+e.message])}})();<\/script>`;
    document.body.append(frame);
    setTimeout(() => { if (frame && !out.textContent) out.textContent = "(no output)"; }, 4000);
  };
  $("#pg-run", m.root).onclick = run; $("#pg-clear", m.root).onclick = () => (out.textContent = "");
  code.onkeydown = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } if (e.key === "Tab") { e.preventDefault(); const s = code.selectionStart; code.setRangeText("  ", s, code.selectionEnd, "end"); } };
  const obs = new MutationObserver(() => { if (!m.root.isConnected) { removeEventListener("message", onMsg); frame?.remove(); obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
}

function regexTester() {
  const m = modal({ title: "Regular expression tester", wide: true, body: `<div style="display:grid;grid-template-columns:1fr 90px;gap:8px"><input class="field" id="rx-p" placeholder="Pattern, e.g. \\b\\w+@\\w+\\.\\w+" spellcheck="false" style="font-family:ui-monospace,Menlo,monospace"><input class="field" id="rx-f" value="g" placeholder="flags" style="font-family:ui-monospace,Menlo,monospace"></div>
    <textarea class="field" id="rx-t" spellcheck="false" style="width:100%;min-height:140px;margin-top:8px;font:13px/1.5 ui-monospace,Menlo,monospace">Write to kitsu@example.com or fox@lantern.org by 2026-12-01.</textarea>
    <input class="field" id="rx-r" placeholder="Replace with (optional, $1 for groups)" style="margin-top:8px;font-family:ui-monospace,Menlo,monospace">
    <p class="status" id="rx-s"></p><div id="rx-o" style="padding:10px;border-radius:8px;background:rgba(127,127,160,.12);font:13px/1.6 ui-monospace,Menlo,monospace;white-space:pre-wrap;max-height:220px;overflow:auto"></div><div id="rx-g" style="margin-top:8px;font:12.5px ui-monospace,Menlo,monospace;max-height:180px;overflow:auto"></div>` });
  const draw = () => {
    const p = $("#rx-p", m.root).value, f = $("#rx-f", m.root).value, t = $("#rx-t", m.root).value, rep = $("#rx-r", m.root).value, s = $("#rx-s", m.root);
    if (!p) { s.textContent = ""; $("#rx-o", m.root).textContent = t; $("#rx-g", m.root).innerHTML = ""; return; }
    let re; try { re = new RegExp(p, f.includes("g") ? f : f + "g"); } catch (e) { s.textContent = e.message; s.className = "status err"; return; }
    s.className = "status"; const ms = [...t.matchAll(re)].slice(0, 500);
    s.textContent = `${ms.length} match${ms.length === 1 ? "" : "es"}`;
    if (rep) { $("#rx-o", m.root).textContent = t.replace(re, rep); }
    else { let h = "", last = 0; for (const x of ms) { if (!x[0].length) continue; h += esc(t.slice(last, x.index)) + `<mark>${esc(x[0])}</mark>`; last = x.index + x[0].length; } $("#rx-o", m.root).innerHTML = h + esc(t.slice(last)); }
    $("#rx-g", m.root).innerHTML = ms.slice(0, 50).map((x, i) => `<div>#${i + 1} @${x.index}: <b>${esc(x[0])}</b>${x.length > 1 ? " · " + x.slice(1).map((g, k) => `$${k + 1}=${esc(g ?? "∅")}`).join(" ") : ""}${x.groups ? " · " + Object.entries(x.groups).map(([k, v]) => `${esc(k)}=${esc(v ?? "∅")}`).join(" ") : ""}</div>`).join("");
  };
  ["#rx-p", "#rx-f", "#rx-t", "#rx-r"].forEach((id) => ($(id, m.root).oninput = draw)); draw();
}

// Line diff using the longest common subsequence.
function diffLines(a, b) {
  const A = a.split("\n"), Bl = b.split("\n"); if (A.length * Bl.length > 4e6) return null;
  const n = A.length, mm = Bl.length, L = Array.from({ length: n + 1 }, () => new Uint32Array(mm + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = mm - 1; j >= 0; j--) L[i][j] = A[i] === Bl[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n && j < mm) { if (A[i] === Bl[j]) { out.push([" ", A[i]]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) out.push(["-", A[i++]]); else out.push(["+", Bl[j++]]); }
  while (i < n) out.push(["-", A[i++]]); while (j < mm) out.push(["+", Bl[j++]]);
  return out;
}
function diffTool(left = "", right = "") {
  const m = modal({ title: "Compare two texts", wide: true, body: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><textarea class="field" id="df-a" placeholder="Original" spellcheck="false" style="min-height:160px;font:12.5px/1.5 ui-monospace,Menlo,monospace">${esc(left)}</textarea><textarea class="field" id="df-b" placeholder="Changed" spellcheck="false" style="min-height:160px;font:12.5px/1.5 ui-monospace,Menlo,monospace">${esc(right)}</textarea></div>
    <p class="status" id="df-s"></p><pre id="df-o" style="max-height:320px;overflow:auto;padding:10px;border-radius:8px;background:rgba(127,127,160,.1);font:12.5px/1.5 ui-monospace,Menlo,monospace"></pre>` });
  const draw = () => {
    const d = diffLines($("#df-a", m.root).value, $("#df-b", m.root).value);
    if (!d) { $("#df-s", m.root).textContent = "Those texts are too long to compare here."; return; }
    const add = d.filter((x) => x[0] === "+").length, del = d.filter((x) => x[0] === "-").length;
    $("#df-s", m.root).textContent = add || del ? `${add} line${add === 1 ? "" : "s"} added, ${del} removed` : "The texts are the same.";
    $("#df-o", m.root).innerHTML = d.map(([k, l]) => `<div style="background:${k === "+" ? "rgba(63,166,106,.2)" : k === "-" ? "rgba(229,83,75,.2)" : "none"}">${k} ${esc(l)}</div>`).join("");
  };
  $("#df-a", m.root).oninput = $("#df-b", m.root).oninput = draw; draw();
}

function markdownPreview(md) {
  const m = modal({ title: "Markdown preview", wide: true, body: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><textarea class="field" id="mp-i" spellcheck="false" style="min-height:300px;font:12.5px/1.5 ui-monospace,Menlo,monospace"># Hello\n\nWrite **Markdown** here and see it on the right.\n\n- lists\n- [links](https://example.com)\n\n\`\`\`js\nconsole.log("code")\n\`\`\`</textarea><div id="mp-o" style="min-height:300px;max-height:60vh;overflow:auto;padding:10px;border:1px solid rgba(127,127,160,.3);border-radius:8px"></div></div>
    <div style="margin-top:8px;display:flex;gap:8px"><button class="btn" type="button" id="mp-copy">Copy HTML</button><button class="btn" type="button" id="mp-dl">Download .md</button></div>` });
  const draw = () => { $("#mp-o", m.root).innerHTML = md ? md($("#mp-i", m.root).value) : esc($("#mp-i", m.root).value); enhance($("#mp-o", m.root)); };
  $("#mp-i", m.root).oninput = draw; draw();
  $("#mp-copy", m.root).onclick = () => navigator.clipboard?.writeText($("#mp-o", m.root).innerHTML).then(() => toast("HTML copied."));
  $("#mp-dl", m.root).onclick = () => download("notes.md", $("#mp-i", m.root).value, "text/markdown");
}

export function inferSchema(value) {
  const jtype = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v === "number" ? (Number.isInteger(v) ? "integer" : "number") : typeof v);
  const merge = (vals) => {
    const vs = vals.filter((x) => x !== undefined); if (!vs.length) return {};
    const ts = new Set(vs.map(jtype));
    if (ts.size === 1) {
      const t = [...ts][0];
      if (t === "object") { const keys = [...new Set(vs.flatMap((o) => Object.keys(o)))], req = keys.filter((k) => vs.every((o) => k in o)); return { type: "object", properties: Object.fromEntries(keys.map((k) => [k, merge(vs.filter((o) => k in o).map((o) => o[k]))])), ...(req.length ? { required: req } : {}) }; }
      if (t === "array") { const items = vs.flatMap((a) => a); return { type: "array", ...(items.length ? { items: merge(items) } : {}) }; }
      const s = { type: t };
      if (t === "string" && vs.every((x) => /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}([\d:.]+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(x))) s.format = vs.some((x) => x.includes("T")) ? "date-time" : "date";
      const d = [...new Set(vs)];
      if (vs.length > 1 && d.length > 1 && d.length <= 6) s.enum = d;
      return s;
    }
    const nn = vs.filter((x) => x !== null); if (!nn.length) return { type: "null" };
    if (new Set(nn.map(jtype)).size === 1) { const s = merge(nn); s.type = [].concat(s.type, "null"); return s; }
    return {};
  };
  return merge([value]);
}
function schemaTool() {
  const m = modal({ title: "JSON → JSON Schema", wide: true, body: `<p class="muted" style="margin-top:0">Paste JSON; a best-effort schema comes back with types, enums where a small set of values repeats, and required keys.</p>
    <textarea class="field" id="js-i" spellcheck="false" style="width:100%;min-height:160px;font:12.5px/1.5 ui-monospace,Menlo,monospace">${esc('{"name":"Kitsune","role":"fox","lanterns":3,"lit":["red","blue"],"home":{"den":null,"path":"/den"}}')}</textarea>
    <div style="display:flex;gap:8px;margin:8px 0"><button class="btn btn-accent" type="button" id="js-c">Copy schema</button><button class="btn" type="button" id="js-d">Download .json</button></div>
    <p class="status" id="js-s"></p><pre id="js-o" style="max-height:300px;overflow:auto;padding:10px;border-radius:8px;background:rgba(127,127,160,.12);font:12.5px/1.5 ui-monospace,Menlo,monospace"></pre>` });
  let schema = "";
  const draw = () => {
    const raw = $("#js-i", m.root).value.trim(); schema = "";
    if (!raw) { $("#js-s", m.root).textContent = ""; $("#js-o", m.root).textContent = ""; return; }
    try { schema = JSON.stringify(inferSchema(JSON.parse(raw)), null, 2); $("#js-s", m.root).className = "status"; $("#js-s", m.root).textContent = "Schema inferred."; } catch (e) { $("#js-s", m.root).className = "status err"; $("#js-s", m.root).textContent = e.message; }
    $("#js-o", m.root).textContent = schema;
  };
  $("#js-i", m.root).oninput = draw; draw();
  $("#js-c", m.root).onclick = () => schema && navigator.clipboard?.writeText(schema).then(() => toast("Schema copied."));
  $("#js-d", m.root).onclick = () => schema && download("schema.json", schema, "application/json");
}

export function timeConvert(v, now = Date.now()) {
  const s = String(v ?? "").trim(); if (!s) return { err: "Give it a Unix timestamp or a date." };
  let ms;
  if (/^\d{9,}$/.test(s)) ms = s.length <= 11 ? +s * 1000 : s.length <= 14 ? +s : +s / 1000;
  else { ms = Date.parse(s); if (Number.isNaN(ms)) return { err: "Couldn't read that as a timestamp or a date." }; }
  if (Math.abs(ms) > 8.64e15) return { err: "That's out of range for a date." };
  const d = new Date(ms), a = Math.abs(ms - now) / 1000, [div, unit] = a < 60 ? [0, ""] : a < 3600 ? [60, "min"] : a < 86400 ? [3600, "hour"] : a < 2592000 ? [86400, "day"] : a < 31536000 ? [2592000, "month"] : [31536000, "year"], n = div ? Math.floor(a / div) : 0;
  return { unix: Math.floor(ms / 1000), ms: Math.round(ms), iso: d.toISOString(), local: d.toLocaleString(undefined, { dateStyle: "full", timeStyle: "medium" }), rel: !div ? "just now" : ms < now ? `${n} ${unit}${n === 1 ? "" : "s"} ago` : `in ${n} ${unit}${n === 1 ? "" : "s"}` };
}
function timeTool() {
  const m = modal({ title: "Timestamp toolkit", body: `<div style="display:flex;gap:8px"><input class="field" id="tm-i" value="${Math.floor(Date.now() / 1000)}" spellcheck="false" placeholder="Unix seconds / milliseconds, or any date string" style="flex:1;font-family:ui-monospace,Menlo,monospace"><button class="btn" type="button" id="tm-now">Now</button></div>
    <p class="status" id="tm-s" style="margin:8px 0 0"></p><div id="tm-o" style="margin-top:6px;font-size:13.5px"></div>
    <div style="margin-top:10px;display:flex;gap:8px"><button class="btn btn-sm" type="button" id="tm-cu">Copy Unix</button><button class="btn btn-sm" type="button" id="tm-ci">Copy ISO</button></div>` });
  let last = {};
  const draw = () => { const r = timeConvert($("#tm-i", m.root).value); last = r.err ? {} : r; $("#tm-s", m.root).textContent = r.err || r.rel; $("#tm-s", m.root).className = "status" + (r.err ? " err" : ""); $("#tm-o", m.root).innerHTML = r.err ? "" : [["Unix (seconds)", String(r.unix)], ["Milliseconds", String(r.ms)], ["ISO 8601 (UTC)", r.iso], ["Your timezone", r.local]].map(([k, v]) => `<div style="display:grid;grid-template-columns:130px 1fr;gap:8px;padding:5px 0;border-bottom:1px solid rgba(127,127,160,.15)"><span class="muted">${k}</span><span style="font-family:ui-monospace,Menlo,monospace;word-break:break-all">${esc(v)}</span></div>`).join(""); };
  $("#tm-i", m.root).oninput = draw; draw();
  $("#tm-now", m.root).onclick = () => { $("#tm-i", m.root).value = Math.floor(Date.now() / 1000); draw(); };
  $("#tm-cu", m.root).onclick = () => last.unix !== undefined && navigator.clipboard?.writeText(String(last.unix)).then(() => toast("Unix timestamp copied."));
  $("#tm-ci", m.root).onclick = () => last.iso && navigator.clipboard?.writeText(last.iso).then(() => toast("ISO date copied."));
}

function golfScorer(root) {
  const bs = blocks(root).slice(0, 40); if (!bs.length) return toast("There's no code on this page to score against.");
  const m = modal({ title: "Regex golf scorer", wide: true, body: `<p class="muted" style="margin-top:0">Times a pattern against every code block on the page. JavaScript's engine keeps its step count to itself, so this is a timing comparison against a plain linear scan — a block many times slower is where backtracking hurts. (A truly pathological pattern can still freeze the tab; keep test text short.)</p>
    <div style="display:grid;grid-template-columns:1fr 90px;gap:8px"><input class="field" id="rg-p" value="\\b(\\w+)\\s+\\1\\b" spellcheck="false" placeholder="Pattern" style="font-family:ui-monospace,Menlo,monospace"><input class="field" id="rg-f" value="i" placeholder="flags" style="font-family:ui-monospace,Menlo,monospace"></div>
    <div style="display:flex;gap:8px;margin:8px 0;align-items:center"><button class="btn btn-accent" type="button" id="rg-run">Score it</button><span class="muted" id="rg-s" style="font-size:13px"></span></div><div id="rg-o" style="max-height:320px;overflow:auto;font:12.5px/1.7 ui-monospace,Menlo,monospace"></div>` });
  $("#rg-run", m.root).onclick = () => {
    const p = $("#rg-p", m.root).value, f = $("#rg-f", m.root).value.replace(/[gy]/g, "");
    let re; try { re = new RegExp(p, f); } catch (e) { $("#rg-s", m.root).textContent = e.message; return; }
    const time = (r, t) => { const t0 = performance.now(); let n = 0, el = 0; while (el < 30 && n < 3000) { r.test(t); n++; el = performance.now() - t0; } return el / Math.max(n, 1); };
    const fmt = (x) => (x < 1 ? (x * 1000).toFixed(x < 0.1 ? 2 : 0) + " µs" : x.toFixed(2) + " ms");
    try {
      const rows = bs.map((b, i) => { const t = b.text.slice(0, 5000), ms = time(re, t), base = time(/xqzw7-never-match/, t); return { i, len: t.length, hit: re.test(t), ms, ratio: ms / Math.max(base, 1e-4) }; }).sort((x, y) => y.ms - x.ms);
      $("#rg-o", m.root).innerHTML = rows.map((r) => `<div style="padding:2px 0;${r.ratio >= 20 ? "color:#e5534b" : ""}"><b style="display:inline-block;min-width:38px">#${r.i + 1}</b> <span style="display:inline-block;min-width:88px">${r.len.toLocaleString()} chars</span> <span style="display:inline-block;min-width:92px">${r.hit ? "match ✓" : "no match"}</span> <span style="display:inline-block;min-width:96px">${fmt(r.ms)}/run</span> <span class="muted">${r.ratio < 1 ? "<1" : r.ratio.toFixed(1)}× a plain scan${r.ratio >= 20 ? " — heavy backtracking" : ""}</span></div>`).join("");
      $("#rg-s", m.root).textContent = `Scored ${rows.length} blocks · slowest #${rows[0].i + 1} at ${fmt(rows[0].ms)} per run.`;
    } catch (e) { $("#rg-s", m.root).textContent = "Scoring failed: " + e.message; }
  };
}

function tableAligner() {
  const m = modal({ title: "Text table aligner", wide: true, body: `<p class="muted" style="margin-top:0">Messy delimited text goes in; a padded, monospace-aligned table comes out. The delimiter is guessed; override it below.</p>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><select class="field" id="tb-d" style="width:auto"><option value="auto">auto</option><option value="s">2+ spaces</option><option value="t">tabs</option><option value=",">commas</option><option value="|">pipes</option><option value=";">semicolons</option></select><span class="muted" id="tb-n" style="font-size:12.5px"></span></div>
    <textarea class="field" id="tb-i" spellcheck="false" style="width:100%;min-height:150px;font:12.5px/1.5 ui-monospace,Menlo,monospace">name  role  lanterns\nKitsune  fox  3\nTanuki  shapeshifter  1\nTea  ceremony  47</textarea>
    <div style="display:flex;gap:8px;margin:8px 0"><button class="btn btn-accent" type="button" id="tb-c">Copy aligned</button><button class="btn" type="button" id="tb-m">Copy as Markdown table</button></div>
    <pre id="tb-o" style="max-height:280px;overflow:auto;padding:10px;border-radius:8px;background:rgba(127,127,160,.12);font:12.5px/1.7 ui-monospace,Menlo,monospace;white-space:pre"></pre>` });
  let aligned = "", md = "";
  const draw = () => {
    const d0 = $("#tb-d", m.root).value, lines = $("#tb-i", m.root).value.split("\n").filter((l) => l.trim());
    const pick = () => { let best = "s", n = 0; for (const [re, k] of [[/\t/g, "t"], [/\|/g, "|"], [/;/g, ";"], [/,/g, ","], [/ {2,}/g, "s"]]) { const cs = lines.map((l) => (l.match(re) || []).length).sort((a, b) => b - a), med = cs[Math.floor(cs.length / 2)] || 0; if (med > n) { best = k; n = med; } } return best; };
    const d = d0 === "auto" ? pick() : d0, cut = { t: /\t+/, s: / {2,}/, ",": /\s*,\s*/, "|": /\s*\|\s*/, ";": /\s*;\s*/ }[d], rows = lines.map((l) => l.split(cut).map((c) => c.trim())), w = Array.from({ length: Math.max(0, ...rows.map((r) => r.length)) }, (_, i) => Math.max(1, ...rows.map((r) => (r[i] || "").length)));
    aligned = rows.map((r) => r.map((c, i) => (r[i] || "").padEnd(w[i])).join({ t: "\t", s: "  ", ",": ", ", "|": " | ", ";": "; " }[d]).trimEnd()).join("\n");
    md = rows.length ? [rows[0].map((c, i) => (rows[0][i] || "").trim()).join(" | "), rows[0].map((c, i) => "-".repeat(Math.max(3, (rows[0][i] || "").trim().length))).join(" | "), ...rows.slice(1).map((r) => r.map((c, i) => (r[i] || "").trim()).join(" | "))].map((r) => `| ${r} |`).join("\n") : "";
    $("#tb-n", m.root).textContent = rows.length ? `${rows.length} rows · ${w.length} columns · delimiter: ${d === "t" ? "tabs" : d === "s" ? "2+ spaces" : { ",": "comma", "|": "pipe", ";": "semicolon" }[d]}` : "";
    $("#tb-o", m.root).textContent = aligned;
  };
  $("#tb-i", m.root).oninput = $("#tb-d", m.root).onchange = draw; draw();
  $("#tb-c", m.root).onclick = () => aligned && navigator.clipboard?.writeText(aligned).then(() => toast("Aligned table copied."));
  $("#tb-m", m.root).onclick = () => md && navigator.clipboard?.writeText(md).then(() => toast("Markdown table copied."));
}

function codeList(root, title) {
  const bs = blocks(root); if (!bs.length) return toast("There's no code on this page.");
  const m = modal({ title: `Code on this page (${bs.length})`, wide: true, body: `<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap"><button class="btn btn-sm" type="button" data-all="copy">Copy all</button><button class="btn btn-sm" type="button" data-all="dl">Download all as one file</button></div>${bs.map((b, i) => `<div style="margin-bottom:14px"><div style="display:flex;gap:6px;align-items:center;margin-bottom:4px"><b style="font-size:13px">#${i + 1}</b><span class="muted" style="font-size:12px">${esc(b.lang || "text")} · ${b.text.split("\n").length} lines</span><span style="flex:1"></span><button class="btn btn-sm" type="button" data-c="${i}">Copy</button><button class="btn btn-sm" type="button" data-d="${i}">Download</button>${/^(js|json)$/.test(b.lang) ? `<button class="btn btn-sm" type="button" data-r="${i}">Run</button>` : ""}</div><pre class="kbc-hl" style="max-height:200px;overflow:auto;padding:10px;border-radius:8px;background:rgba(127,127,160,.12);font:12px/1.5 ui-monospace,Menlo,monospace;margin:0">${highlight(b.text.slice(0, 20000), b.lang)}</pre></div>`).join("")}<style>${STYLE}</style>` });
  const slug = (title || "page").replace(/[^\w-]+/g, "-").slice(0, 40);
  m.root.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return; const d = t.dataset;
    if (d.c) navigator.clipboard?.writeText(bs[+d.c].text).then(() => toast("Copied."));
    if (d.d) download(`${slug}-${+d.d + 1}.${EXT[bs[+d.d].lang] || "txt"}`, bs[+d.d].text);
    if (d.r) { m.close(); playground(bs[+d.r].text); }
    if (d.all === "copy") navigator.clipboard?.writeText(bs.map((b) => b.text).join("\n\n")).then(() => toast("Copied every block."));
    if (d.all === "dl") download(`${slug}-code.txt`, bs.map((b, i) => `// ---- #${i + 1} (${b.lang || "text"}) ----\n${b.text}`).join("\n\n"));
  };
}

export function items({ T, root, markdown }) {
  return [
    { label: "Code on this page (copy, download, run)…", icon: "list", run: () => codeList(root(), T().title) },
    { label: coloursOn() ? "Code colours: on (turn off)" : "Code colours: off (turn on)", icon: "sliders", run: () => { localStorage.setItem("kitsune.codeColours", coloursOn() ? "0" : "1"); toast(coloursOn() ? "Code colours on. Reload to see them." : "Code colours off. Reload to see plain code."); } },
    { label: "JavaScript playground (sandboxed)…", icon: "play", run: () => playground() },
    { label: "Regular expression tester…", icon: "search", run: regexTester },
    { label: "Compare two texts (diff)…", icon: "pages", run: () => diffTool() },
    { label: "Markdown preview…", icon: "edit", run: () => markdownPreview(markdown) },
    { label: "Copy as curl command", icon: "link", run: () => { const u = T().url; if (!u) return; navigator.clipboard?.writeText(`curl -L '${u.replace(/'/g, "'\\''")}'`).then(() => toast("curl command copied.")); } },
    { label: "Copy as fetch() call", icon: "link", run: () => { const u = T().url; if (!u) return; navigator.clipboard?.writeText(`const res = await fetch(${JSON.stringify(u)});\nconst html = await res.text();`).then(() => toast("fetch() call copied.")); } },
    { label: "Infer a JSON Schema from JSON…", icon: "type", run: schemaTool },
    { label: "Timestamp toolkit (Unix ⇄ ISO)…", icon: "clock", run: timeTool },
    { label: "Regex golf scorer (time it on this page's code)…", icon: "spark", run: () => golfScorer(root()) },
    { label: "Align messy text into a table…", icon: "grid", run: tableAligner },
  ];
}
export const highlightCode = highlight;
