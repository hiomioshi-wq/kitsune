// Vercel serverless entry. vercel.json rewrites /api/<path> here as ?p=<path>.
import { handleApi, errorResult } from "../lib/core.js";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const path = url.searchParams.get("p") || url.pathname.replace(/^\/api\/?/, "");
  url.searchParams.delete("p");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const q = Object.fromEntries(url.searchParams);
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  let out;
  try { out = await handleApi(req.method, parts, q, { features: { libraryFolder: false, proxy: false, host: "vercel" } }); }
  catch (e) { out = errorResult(e); if (!e.status) console.error(e); }
  res.statusCode = out.status;
  res.setHeader("Content-Type", out.type);
  res.setHeader("Cache-Control", out.cache);
  res.end(out.body);
}
