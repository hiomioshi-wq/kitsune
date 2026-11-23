// Remembers what you deleted, so syncing with another device doesn't bring it back.
import { kvGet, kvSet } from "./store.js";

export async function gone(kind, key) {
  const g = (await kvGet("syncGone", {})) || {};
  (g[kind] ||= {})[key] = Date.now();
  kvSet("syncGone", g);
}
export async function ungone(kind, key) {
  const g = (await kvGet("syncGone", {})) || {};
  if (g[kind]?.[key]) { delete g[kind][key]; kvSet("syncGone", g); }
}
