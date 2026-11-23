// Kitsune Browser, v134: manga and anime pages meet the rest of Kitsune.
// On a page about a manga, manhwa, webtoon or anime (a news story, a review, a publisher's page, a wiki), find the series
// on AniList, then open it in Kitsune's own series page or put it on your wishlist.
import { $, esc, toast, modal } from "./util.js";
import { kvGet, kvSet } from "./store.js";

async function gql(query, variables) {
  const h = btoa(JSON.stringify({ "content-type": "application/json", accept: "application/json" }));
  const r = await fetch("/api/browse/raw?url=" + encodeURIComponent("https://graphql.anilist.co"), { method: "POST", headers: { "content-type": "application/json", "x-kb-req-headers": h }, body: JSON.stringify({ query, variables }) });
  if (!r.ok) throw new Error("AniList didn't answer."); const j = await r.json(); return j.data ?? JSON.parse(j.text || "{}").data;
}
const Q = `query($s:String){Page(perPage:8){media(search:$s,sort:SEARCH_MATCH,isAdult:false){id type format status title{romaji english} coverImage{large color} startDate{year} averageScore volumes chapters episodes siteUrl}}}`;
function guess(t) {
  const d = t.doc, og = d?.querySelector?.('meta[property="og:title"]')?.getAttribute("content") || "", h1 = d?.querySelector?.("h1")?.textContent || "";
  let s = (og || h1 || t.title || "").replace(/\s[-|·–—:]\s.*$/, "").replace(/\b(manga|manhwa|manhua|webtoon|anime|volume|vol\.?|chapter|ch\.?|episode|ep\.?|review|trailer|season|official|read|online|free)\b.*$/i, "").replace(/["“”]/g, "").trim();
  return s.slice(0, 80);
}
export const looksLikeManga = (t) => {
  if (/anilist\.co|kitsu\.(io|app)|myanimelist\.net/.test(t.url || "")) return false;
  const RE = /\b(manga|manhwa|manhua|webtoon|light novel|anime)\b/gi, d = t.doc;
  const head = `${t.title || ""} ${d?.querySelector?.('meta[name="keywords"]')?.getAttribute("content") || ""} ${d?.querySelector?.('meta[name="description"], meta[property="og:description"]')?.getAttribute("content") || ""}`;
  if ((head.match(RE) || []).length) return true;
  const body = (d?.body?.textContent || "").slice(0, 6000); return (body.match(RE) || []).length >= 4;
};

async function finder(t, go) {
  const m = modal({ title: "Find on AniList", wide: true, body: `<form id="al-f" style="display:flex;gap:8px"><input class="field" id="al-q" value="${esc(guess(t))}" style="flex:1" placeholder="Series title"><button class="btn btn-accent">Search</button></form><p class="status" id="al-s"></p><div id="al-r" style="display:grid;gap:8px"></div>` });
  const run = async () => {
    const q = $("#al-q", m.root).value.trim(); if (!q) return; $("#al-s", m.root).textContent = "Searching AniList…";
    try {
      const d = await gql(Q, { s: q }), list = d?.Page?.media || [], wl = (await kvGet("wishlist", [])) || [];
      $("#al-s", m.root).textContent = list.length ? "" : "No series found. Try a shorter or different title.";
      $("#al-r", m.root).innerHTML = list.map((x) => `<div style="display:flex;gap:10px;align-items:center;border:1px solid rgba(127,127,160,.3);border-radius:10px;padding:8px"><img src="${esc(x.coverImage?.large || "")}" alt="" referrerpolicy="no-referrer" style="width:54px;height:76px;object-fit:cover;border-radius:6px;background:${esc(x.coverImage?.color || "#888")}"><div style="flex:1;min-width:0"><b>${esc(x.title.english || x.title.romaji)}</b>${x.title.english && x.title.romaji !== x.title.english ? `<br><small class="muted">${esc(x.title.romaji)}</small>` : ""}<br><small class="muted">${esc([x.type, x.format, x.startDate?.year, x.averageScore ? x.averageScore + "%" : "", x.chapters ? x.chapters + " ch" : x.volumes ? x.volumes + " vol" : x.episodes ? x.episodes + " eps" : ""].filter(Boolean).join(" · ").replace(/_/g, " ").toLowerCase())}</small></div><div style="display:grid;gap:4px">${x.type === "MANGA" ? `<button class="btn btn-sm btn-accent" type="button" data-open="${x.id}">Open in Kitsune</button><button class="btn btn-sm" type="button" data-wish="${x.id}">${wl.some((w) => w.id === x.id) ? "On wishlist ✓" : "Add to wishlist"}</button>` : `<button class="btn btn-sm" type="button" data-al="${esc(x.siteUrl)}">Open on AniList</button>`}</div></div>`).join("");
      m.root.__list = list;
    } catch (e) { $("#al-s", m.root).textContent = e.message; }
  };
  $("#al-f", m.root).onsubmit = (e) => { e.preventDefault(); run(); };
  m.root.addEventListener("click", async (e) => {
    const o = e.target.closest("[data-open]"); if (o) { m.close(); location.hash = "manga/" + o.dataset.open; return; }
    const a = e.target.closest("[data-al]"); if (a) { m.close(); go(a.dataset.al, { newTab: true }); return; }
    const w = e.target.closest("[data-wish]"); if (w) {
      const x = (m.root.__list || []).find((y) => String(y.id) === w.dataset.wish); if (!x) return;
      const list = (await kvGet("wishlist", [])) || []; const i = list.findIndex((y) => y.id === x.id);
      if (i >= 0) { list.splice(i, 1); w.textContent = "Add to wishlist"; toast("Removed from your wishlist."); }
      else { list.unshift({ id: x.id, title: x.title.english || x.title.romaji, cover: x.coverImage?.large, color: x.coverImage?.color, volumes: x.volumes, status: x.status, links: [], added: Math.floor(Date.now() / 1000) }); w.textContent = "On wishlist ✓"; toast(`Added ${x.title.english || x.title.romaji} to your wishlist.`); }
      kvSet("wishlist", list);
    }
  });
  run();
}

export function afterRender({ t, B, go }) {
  $("#kb-anilist", B.view)?.remove(); if (localStorage.getItem("kitsune.webNoAniChip") === "1" || !t?.url || !looksLikeManga(t)) return;
  const el = document.createElement("button"); el.id = "kb-anilist"; el.type = "button"; el.textContent = "🦊 Find this series";
  const below = ["#kb-schema", "#kb-schema2", "#kb-comic", "#kb-ebook"].filter((s) => $(s, B.view)).length;
  el.style.cssText = `position:absolute;right:14px;top:${44 + below * 40}px;z-index:19;font:600 12px system-ui,sans-serif;padding:6px 12px;border-radius:99px;border:1px solid var(--line,#3a3e66);background:var(--surface,#1c1d33);color:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)`;
  el.onclick = () => finder(t, go);
  ($("#kb-body", B.view) || B.view).append(el);
}

export function items({ T, go }) {
  return [
    { label: "Find this manga or anime on AniList…", icon: "search", run: () => finder(T(), go) },
    { label: localStorage.getItem("kitsune.webNoAniChip") === "1" ? "“Find this series” button: off (turn on)" : "“Find this series” button: on (turn off)", icon: "sliders", run: () => { const off = localStorage.getItem("kitsune.webNoAniChip") !== "1"; try { off ? localStorage.setItem("kitsune.webNoAniChip", "1") : localStorage.removeItem("kitsune.webNoAniChip"); } catch {} toast(off ? "That button won't appear on manga pages." : "Manga and anime pages get a “Find this series” button."); } },
  ];
}
