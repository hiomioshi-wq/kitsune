// Kitsune Browser, v143: Hacker News threads and profiles via the Algolia API, BoardGameGeek games and users via XMLAPI2,
// TVMaze shows with season-by-season episode guides.
import { esc } from "./util.js";
import { json, text, when, num, tags, out, host } from "./webadapters4.js";

export const adapters = [
  // ---- Hacker News item threads and user profiles ----
  async (u) => {
    if (host(u) !== "news.ycombinator.com") return null; const it = u.pathname === "/item" ? u.searchParams.get("id") : "", us = u.pathname === "/user" ? u.searchParams.get("id") : "";
    if (!/^\d+$/.test(it || "") && !(us && /^[\w.-]+$/.test(us))) return null;
    if (it) {
      const x = await json(`https://hn.algolia.com/api/v1/items/${it}`); if (!x || x.id == null) return null;
      const cnt = (c) => (c.children || []).reduce((n, k) => n + 1 + cnt(k), 0), c = cnt(x), dom = (s) => (s || "").match(/^https?:\/\/([^\/?#]+)/)?.[1] || "", t = x.title || `Hacker News item ${it}`;
      const tree = (k, d = 0) => `<div style="margin-left:${Math.min(d, 8) * 14}px;border-left:2px solid #8884;padding:2px 0 2px 10px;margin-top:10px"><div class="meta"><a href="https://news.ycombinator.com/user?id=${esc(k.author || "")}">${esc(k.author || "[deleted]")}</a> · ${esc(when(k.created_at))}</div>${k.text || "<i>[deleted]</i>"}${(k.children || []).map((y) => tree(y, d + 1)).join("")}</div>`;
      const body = `<h1>${x.url ? `<a href="${esc(x.url)}">${esc(x.title || "")}</a>` : esc(t)}</h1><div class="meta">${x.points != null ? num(x.points) + " points · " : ""}by <a href="https://news.ycombinator.com/user?id=${esc(x.author || "")}">${esc(x.author || "[deleted]")}</a> · ${esc(when(x.created_at))}${x.url ? " · " + esc(dom(x.url)) : ""}${c ? " · " + num(c) + " comments" : ""}</div>${x.text || ""}<h2>Discussion</h2>${(x.children || []).map((k) => tree(k)).join("") || "<p>No comments yet.</p>"}`;
      return out(u, t, body, "Shown from Hacker News' search API (Algolia).");
    }
    const x = await json(`https://hn.algolia.com/api/v1/users/${encodeURIComponent(us)}`); if (!x || x.username == null) return null;
    const body = `<h1>${esc(x.username || us)}</h1><div class="meta">${x.karma != null ? num(x.karma) + " karma · " : ""}joined ${esc(when(x.created_at))}</div>${x.about || ""}<p><a href="https://news.ycombinator.com/submitted?id=${esc(us)}">Submissions</a> · <a href="https://news.ycombinator.com/threads?id=${esc(us)}">Comments</a></p>`;
    return out(u, x.username || us, body, "Shown from Hacker News' search API (Algolia).");
  },
  // ---- BoardGameGeek things (board games, expansions, accessories, video games, RPG items) and users ----
  async (u) => {
    if (host(u) !== "boardgamegeek.com") return null; const t = u.pathname.match(/^\/(?:boardgame(?:expansion|accessory)?|videogame|rpgitem|rpgissue|rpgseries)\/(\d+)(?:\/[^\/]+)?\/?$/), f = u.pathname.match(/^\/user\/([\w.-]+)\/?$/);
    if (!t && !f) return null;
    if (t) {
      const d = new DOMParser().parseFromString(await text(`https://boardgamegeek.com/xmlapi2/thing?id=${t[1]}&stats=1`), "text/xml"), it = d.querySelector("item"); if (!it) return null;
      const v = (s) => it.querySelector(s)?.getAttribute("value") || "", name = it.querySelector("name[type=primary]")?.getAttribute("value") || v("name") || "BoardGameGeek " + t[1], img = it.querySelector("image")?.textContent || "";
      const meta = [it.getAttribute("type"), v("yearpublished") !== "0" ? v("yearpublished") : "", v("minplayers") ? `${v("minplayers")}${v("maxplayers") !== v("minplayers") ? "–" + v("maxplayers") : ""} players` : "", v("playingtime") ? `${v("playingtime")} min` : "", v("age") ? `age ${v("age")}+` : ""].filter(Boolean).map(esc).join(" · ");
      const stats = [v("average") ? `★ ${(+(v("average"))).toFixed(2)} average` : "", v("usersrated") ? `${num(v("usersrated"))} ratings` : "", v("bayesaverage") ? `geek rating ${(+(v("bayesaverage"))).toFixed(2)}` : "", v("owned") ? `${num(v("owned"))} own it` : ""].filter(Boolean).join(" · ");
      const rk = [...it.querySelectorAll("rank")].map((k) => [k.getAttribute("friendlyname") || k.getAttribute("name"), k.getAttribute("value")]).filter((p) => p[1] && p[1] !== "Not Ranked"), dsg = [...it.querySelectorAll("link[type=boardgamedesigner]")].map((l) => esc(l.getAttribute("value"))).join(", ");
      const body = `<h1>${esc(name)}</h1><div class="meta">${meta}</div>${img ? `<p><img src="${esc(img)}" alt="" style="max-height:340px"></p>` : ""}${stats ? `<div class="meta">${esc(stats)}</div>` : ""}${rk.length ? `<div class="meta">${rk.slice(0, 4).map((p) => `${esc(p[0])} #${esc(p[1])}`).join(" · ")}</div>` : ""}<p>${tags([...it.querySelectorAll("link[type=boardgamecategory]")].map((l) => l.getAttribute("value")))}</p>${dsg ? `<p class="meta">Designed by ${dsg}</p>` : ""}<p>${tags([...it.querySelectorAll("link[type=boardgamemechanic]")].map((l) => l.getAttribute("value")))}</p><div>${esc(it.querySelector("description")?.textContent || "")}</div>`;
      return out(u, name, body, "Shown from BoardGameGeek's open XMLAPI2.");
    }
    const d = new DOMParser().parseFromString(await text(`https://boardgamegeek.com/xmlapi2/user?name=${encodeURIComponent(f[1])}&top=1`), "text/xml"), usr = d.querySelector("user"); if (!usr || !usr.getAttribute("id")) return null;
    const w = (s) => usr.querySelector(s)?.getAttribute("value") || "", nm = usr.getAttribute("name") || f[1], top = [...usr.querySelectorAll("top item")].map((k) => `<a href="https://boardgamegeek.com/boardgame/${esc(k.getAttribute("id"))}">${esc(k.getAttribute("name"))}</a>`);
    const body = `<h1>${esc(nm)}</h1><div class="meta">BoardGameGeek member since ${esc(w("yearregistered"))}${w("lastlogin") ? " · last seen " + esc(w("lastlogin")) : ""}${w("country") ? " · " + esc(w("country")) : ""}</div>${w("avatarlink") ? `<p><img src="${esc(w("avatarlink"))}" alt="" style="width:120px;border-radius:12px"></p>` : ""}${w("about") ? `<div>${w("about")}</div>` : ""}${top.length ? `<h2>Top games</h2><div class="grid">${top.map((s) => `<div>${s}</div>`).join("")}</div>` : ""}`;
    return out(u, nm, body, "Shown from BoardGameGeek's open XMLAPI2.");
  },
  // ---- TVMaze shows, with a season-by-season episode guide ----
  async (u) => {
    if (host(u) !== "tvmaze.com") return null; const m = u.pathname.match(/^\/shows\/(\d+)(?:\/episodes)?\/?$/); if (!m) return null;
    const [x, eps] = await Promise.all([json(`https://api.tvmaze.com/shows/${m[1]}`), json(`https://api.tvmaze.com/shows/${m[1]}/episodes`).catch(() => [])]);
    if (!x?.name) return null;
    const by = {}; for (const e of eps) (by[e.season] ||= []).push(e);
    const sn = Object.keys(by).sort((a, b) => a - b);
    const meta = [x.type, (x.genres || []).join(", "), x.premiered ? `premiered ${when(x.premiered)}` : "", x.status, x.rating?.average ? `★ ${x.rating.average}` : "", x.averageRuntime ? `${x.averageRuntime} min` : "", x.network?.name ? `on ${x.network.name}` : x.webChannel?.name ? `on ${x.webChannel.name}` : "", eps.length ? `${num(eps.length)} episodes` : ""].filter(Boolean).map(esc).join(" · ");
    const body = `<h1>${esc(x.name)}</h1><div class="meta">${meta}</div>${x.image?.original ? `<p><img src="${esc(x.image.original.replace(/^http:/, "https:"))}" alt="" style="max-height:340px"></p>` : ""}${x.summary || ""}${x.officialSite ? `<p><a href="${esc(x.officialSite)}">Official site</a></p>` : ""}${sn.length ? sn.map((s) => `<h2>${s === "0" ? "Specials" : "Season " + esc(s)}</h2><table>${by[s].map((e) => `<tr><td>${e.number ?? "?"}</td><td>${esc(e.name)}</td><td>${esc(e.airdate || "")}</td><td>${e.runtime ? esc(e.runtime) + " min" : ""}</td></tr>`).join("")}</table>`).join("") : "<p>No episodes listed.</p>"}`;
    return out(u, x.name, body, "Shown from TVMaze's open API.");
  },
];
