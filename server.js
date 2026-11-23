#!/usr/bin/env node
// Kitsune local server. Same API as the Vercel deploy, plus two local-only extras:
//   - reads manga from a folder on this computer (/api/library…)
//   - a private proxy (/api/proxy?url=) so OPDS servers without CORS still work
//
// Run:  node server.js                     then open http://localhost:8787
//       node server.js --port 9000 --library ~/Manga

import http from "node:http";
import fsp from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { handleApi, errorResult, HttpError } from "./lib/core.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "public");
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith("--") ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []));
const PORT = Number(args.port || process.env.PORT || 8787);
const HOST = args.host || "127.0.0.1";
const expand = (p) => (p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p);
const LIBRARY_DIR = path.resolve(expand(args.library || process.env.KITSUNE_LIBRARY || path.join(ROOT, "library")));

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json",
  ".md": "text/markdown; charset=utf-8", ".markdown": "text/markdown; charset=utf-8",
  ".vcf": "text/vcard; charset=utf-8", ".srt": "application/x-subrip; charset=utf-8", ".vtt": "text/vtt; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8", ".ics": "text/calendar; charset=utf-8",
};
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"]);
const naturalCompare = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

// ---------- minimal ZIP reader for CBZ ----------
function zipEntries(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("Not a zip file");
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let n = 0; n < count && buf.readUInt32LE(off) === 0x02014b50; n++) {
    const nameLen = buf.readUInt16LE(off + 28), extraLen = buf.readUInt16LE(off + 30), cLen = buf.readUInt16LE(off + 32);
    out.push({ name: buf.toString("utf8", off + 46, off + 46 + nameLen), method: buf.readUInt16LE(off + 10), csize: buf.readUInt32LE(off + 20), local: buf.readUInt32LE(off + 42) });
    off += 46 + nameLen + extraLen + cLen;
  }
  return out;
}
function zipRead(buf, e) {
  const start = e.local + 30 + buf.readUInt16LE(e.local + 26) + buf.readUInt16LE(e.local + 28);
  const data = buf.subarray(start, start + e.csize);
  if (e.method === 0) return Buffer.from(data);
  if (e.method === 8) return zlib.inflateRawSync(data);
  throw new Error("Unsupported zip compression");
}

// ---------- library folder ----------
let library = new Map();
const isPage = (n) => IMAGE_EXT.has(path.extname(n).toLowerCase()) && !path.basename(n).startsWith(".") && !n.startsWith("__MACOSX");
async function walk(dir) {
  const out = [];
  let items = [];
  try { items = await fsp.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const d of items) {
    if (d.name.startsWith(".")) continue;
    const p = path.join(dir, d.name);
    out.push({ p, dir: d.isDirectory() });
    if (d.isDirectory()) out.push(...(await walk(p)));
  }
  return out;
}
async function scanLibrary() {
  await fsp.mkdir(LIBRARY_DIR, { recursive: true });
  const next = new Map();
  for (const { p, dir } of await walk(LIBRARY_DIR)) {
    let pages = [], kind;
    try {
      if (!dir && /\.(cbz|zip)$/i.test(p)) { pages = zipEntries(await fsp.readFile(p)).map((e) => e.name).filter(isPage).sort(naturalCompare); kind = "archive"; }
      else if (dir) { pages = (await fsp.readdir(p, { withFileTypes: true })).filter((d) => d.isFile() && isPage(d.name)).map((d) => d.name).sort(naturalCompare); kind = "folder"; }
      else continue;
    } catch { continue; }
    if (!pages.length) continue;
    const rel = path.relative(LIBRARY_DIR, p);
    const parts = rel.split(path.sep);
    const stem = kind === "archive" ? path.basename(p, path.extname(p)) : path.basename(p);
    const series = parts.length > 1 ? parts[0] : stem.replace(/[\s_\-]*(v|vol|volume|ch|chapter)?\.?\s*\d+$/i, "") || stem;
    const id = crypto.createHash("sha1").update(rel).digest("hex").slice(0, 12);
    next.set(id, { id, title: stem, series, kind, path: rel, pages: pages.length, added: Math.floor((await fsp.stat(p)).mtimeMs / 1000), _pages: pages, _abs: p });
  }
  library = next;
}
const zipCache = new Map();
async function libraryPage(id, n) {
  const e = library.get(id);
  if (!e) throw new HttpError(404, "That volume isn't in your library folder any more. Try Rescan.");
  n = Number(n);
  if (!(n >= 0 && n < e._pages.length)) throw new HttpError(404, "No such page.");
  const name = e._pages[n];
  const type = TYPES[path.extname(name).toLowerCase()] || "application/octet-stream";
  if (e.kind === "folder") return { body: await fsp.readFile(path.join(e._abs, name)), type };
  const st = await fsp.stat(e._abs);
  let z = zipCache.get(e._abs);
  if (!z || z.mtime !== st.mtimeMs) {
    const buf = await fsp.readFile(e._abs);
    z = { mtime: st.mtimeMs, buf, entries: new Map(zipEntries(buf).map((x) => [x.name, x])) };
    zipCache.set(e._abs, z);
    if (zipCache.size > 4) zipCache.delete(zipCache.keys().next().value);
  }
  return { body: zipRead(z.buf, z.entries.get(name)), type };
}
const libraryList = () => ({ folder: LIBRARY_DIR, results: [...library.values()].map(({ _pages, _abs, ...e }) => e) });

// ---------- private proxy (local only) ----------
async function proxy(req, res, target) {
  let u;
  try { u = new URL(target); } catch { throw new HttpError(400, "Give a full http(s) link."); }
  if (!/^https?:$/.test(u.protocol)) throw new HttpError(400, "Only http and https links can be fetched.");
  const headers = { "User-Agent": "Kitsune/2.0" };
  if (req.headers["x-kitsune-auth"]) headers.Authorization = req.headers["x-kitsune-auth"];
  const r = await fetch(u, { headers, signal: AbortSignal.timeout(30_000) }).catch(() => { throw new HttpError(502, `Couldn't reach ${u.hostname}.`); });
  const body = Buffer.from(await r.arrayBuffer());
  res.writeHead(r.status, { "Content-Type": r.headers.get("content-type") || "application/octet-stream", "Content-Length": body.length, "Cache-Control": "private, max-age=300" });
  res.end(body);
}

// ---------- HTTP ----------
function sendResult(res, out) {
  res.writeHead(out.status, { "Content-Type": out.type, "Cache-Control": out.cache, "Content-Length": Buffer.byteLength(out.body), ...(out.headers || {}) });
  res.end(out.body);
}
async function staticFile(res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end("Forbidden"); }
  try {
    const body = await fsp.readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Content-Length": body.length, "Cache-Control": "no-cache" });
    res.end(body);
  } catch { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Not found"); }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (!url.pathname.startsWith("/api/")) return staticFile(res, url);
  const parts = url.pathname.split("/").filter(Boolean).slice(1).map(decodeURIComponent);
  const q = Object.fromEntries(url.searchParams);
  const is = (...p) => p.length === parts.length && p.every((x, i) => x === "*" || x === parts[i]);
  try {
    if (req.method === "GET" && is("library")) return sendResult(res, { status: 200, type: "application/json", cache: "no-store", body: JSON.stringify(libraryList()) });
    if (req.method === "POST" && is("library", "rescan")) { await scanLibrary(); return sendResult(res, { status: 200, type: "application/json", cache: "no-store", body: JSON.stringify(libraryList()) }); }
    if (req.method === "GET" && is("library", "*", "pages", "*")) {
      const { body, type } = await libraryPage(parts[1], parts[3]);
      res.writeHead(200, { "Content-Type": type, "Content-Length": body.length, "Cache-Control": "private, max-age=3600" });
      return res.end(body);
    }
    if (req.method === "GET" && is("proxy")) return await proxy(req, res, q.url);
  let body = null;
  if (req.method === "POST") { const chunks = []; let n = 0; for await (const c of req) { n += c.length; if (n > 2_097_152) break; chunks.push(c); } body = Buffer.concat(chunks); }
    sendResult(res, await handleApi(req.method, parts, q, { ua: String(req.headers["x-kb-ua"] || ""), lang: String(req.headers["accept-language"] || "").slice(0, 200), kbMethod: String(req.headers["x-kb-method"] || ""), kbHeaders: String(req.headers["x-kb-req-headers"] || "").slice(0, 16000), kbReferer: String(req.headers["x-kb-referer"] || "").slice(0, 2000), cookie: String(req.headers["x-kb-cookie"] || "").slice(0, 8000), origin: (req.headers["x-forwarded-proto"] || "http").split(",")[0] + "://" + (req.headers["x-forwarded-host"] || req.headers.host || "localhost"), body, contentType: req.headers["content-type"] || "", features: { libraryFolder: true, proxy: true, host: "local", folder: LIBRARY_DIR } }));
  } catch (e) {
    if (!e.status) console.error(e);
    if (!res.headersSent) sendResult(res, errorResult(e));
  }
});

await scanLibrary();
server.listen(PORT, HOST, () => console.log(`Kitsune running at http://localhost:${PORT}  ·  library: ${LIBRARY_DIR} (${library.size} volumes)`));
