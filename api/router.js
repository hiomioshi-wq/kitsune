// Vercel serverless entry. vercel.json rewrites /api/<path> here as ?p=<path>.
import { handleApi, errorResult } from "../lib/core.js";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const path = url.searchParams.get("p") || url.pathname.replace(/^\/api\/?/, "");
  url.searchParams.delete("p");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const q = Object.fromEntries(url.searchParams);
  // The browser proxy is only for Kitsune itself, so other websites can't borrow it.
  if (!/^browse/.test(path)) res.setHeader("Access-Control-Allow-Origin", "*"); // (the asset relay sets its own)
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  let out;
  let body = null;
  if (req.method === "POST") { const chunks = []; let n = 0; for await (const c of req) { n += c.length; if (n > 2_097_152) break; chunks.push(c); } body = Buffer.concat(chunks); }
  try { out = await handleApi(req.method, parts, q, { ua: String(req.headers["x-kb-ua"] || ""), lang: String(req.headers["accept-language"] || "").slice(0, 200), kbMethod: String(req.headers["x-kb-method"] || ""), kbHeaders: String(req.headers["x-kb-req-headers"] || "").slice(0, 16000), kbReferer: String(req.headers["x-kb-referer"] || "").slice(0, 2000), cookie: String(req.headers["x-kb-cookie"] || "").slice(0, 8000), origin: (req.headers["x-forwarded-proto"] || "http").split(",")[0] + "://" + (req.headers["x-forwarded-host"] || req.headers.host || "localhost"), body, contentType: req.headers["content-type"] || "", features: { libraryFolder: false, proxy: false, host: "vercel" } }); }
  catch (e) { out = errorResult(e); if (!e.status) console.error(e); }
  res.statusCode = out.status;
  res.setHeader("Content-Type", out.type);
  res.setHeader("Cache-Control", out.cache);
  for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v);
  res.end(out.body);
}
