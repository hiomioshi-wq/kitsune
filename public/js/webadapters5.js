// Kitsune Browser, v141: Mastodon posts with their replies, Open Library authors and ISBN lookups, Modrinth mods.
import { esc } from "./util.js";
import { json, post, when, num, dur, para, tags, out, host } from "./webadapters4.js";

export const adapters = [
  // ---- Mastodon (and compatible) posts, any server: /@user/<id>, with the conversation ----
  async (u) => {
    const m = u.pathname.match(/^\/@[\w.]+(?:@[\w.-]+)?\/(\d{6,})\/?$/); if (!m || /(^|\.)(medium\.com|youtube\.com|tiktok\.com|threads\.net)$/.test(u.hostname)) return null;
    const s = await json(`${u.origin}/api/v1/statuses/${m[1]}`); if (!s?.id || !s.account) return null;
    const ctx = await json(`${u.origin}/api/v1/statuses/${m[1]}/context`).catch(() => ({ ancestors: [], descendants: [] }));
    const one = (x) => `<div class="meta"><b>${esc(x.account.display_name || x.account.username)}</b> @${esc(x.account.acct)} · ${esc(when(x.created_at))} · ♥ ${num(x.favourites_count)} · ↻ ${num(x.reblogs_count)}</div>${x.spoiler_text ? `<p><i>${esc(x.spoiler_text)}</i></p>` : ""}${x.content || ""}${(x.media_attachments || []).filter((y) => y.type === "image" && !x.sensitive).map((y) => `<p><img src="${esc(y.url)}" alt="${esc(y.description || "")}"></p>`).join("")}${x.card?.url ? `<p><a href="${esc(x.card.url)}">${esc(x.card.title || x.card.url)}</a></p>` : ""}`;
    const body = `${(ctx.ancestors || []).map((a) => `<div class="cmt" style="opacity:.8">${one(a)}</div>`).join("")}<h1 style="font-size:1.1em">Post by ${esc(s.account.display_name || s.account.username)}</h1>${one(s)}${ctx.descendants?.length ? `<h2>Replies (${ctx.descendants.length})</h2>${ctx.descendants.map((d) => `<div class="cmt">${one(d)}</div>`).join("")}` : ""}`;
    return out(u, `Post by @${s.account.acct}`, body, "Shown from this server's open Mastodon API.");
  },
  // ---- Open Library authors and ISBN / edition pages ----
  async (u) => {
    if (host(u) !== "openlibrary.org") return null; const a = u.pathname.match(/^\/authors\/(OL\d+A)/), b = u.pathname.match(/^\/(?:isbn\/([\dX-]{10,17})|books\/(OL\d+M))/i); if (!a && !b) return null;
    if (a) {
      const x = await json(`https://openlibrary.org/authors/${a[1]}.json`), w = await json(`https://openlibrary.org/authors/${a[1]}/works.json?limit=60`).catch(() => ({ entries: [] }));
      const bio = typeof x.bio === "string" ? x.bio : x.bio?.value || "";
      const body = `<h1>${esc(x.name)}</h1><div class="meta">${esc([x.birth_date, x.death_date].filter(Boolean).join(" – "))}</div>${x.photos?.[0] > 0 ? `<p><img src="https://covers.openlibrary.org/b/id/${x.photos[0]}-L.jpg" alt="" style="max-height:280px"></p>` : ""}${para(bio)}<h2>Works</h2>${(w.entries || []).map((e) => `<p><a href="https://openlibrary.org${esc(e.key)}">${esc(e.title)}</a></p>`).join("")}`;
      return out(u, x.name, body, "Shown from Open Library's open API.");
    }
    const x = await json(b[1] ? `https://openlibrary.org/isbn/${b[1].replace(/-/g, "")}.json` : `https://openlibrary.org/books/${b[2]}.json`); if (!x?.title) return null;
    const body = `<h1>${esc(x.title)}</h1><div class="meta">${esc((x.publishers || []).join(", "))} · ${esc(x.publish_date || "")}${x.number_of_pages ? " · " + x.number_of_pages + " pages" : ""}${x.isbn_13 ? " · ISBN " + esc(x.isbn_13[0]) : ""}</div>${x.covers?.[0] > 0 ? `<p><img src="https://covers.openlibrary.org/b/id/${x.covers[0]}-L.jpg" alt="" style="max-height:360px"></p>` : ""}<p>${tags(x.subjects)}</p>${x.works?.[0] ? `<p><a href="https://openlibrary.org${esc(x.works[0].key)}">About this book (all editions)</a></p>` : ""}${x.ocaid ? `<p><a href="https://archive.org/details/${esc(x.ocaid)}">Borrow or read on the Internet Archive</a></p>` : ""}`;
    return out(u, x.title, body, "Shown from Open Library's open API.");
  },
  // ---- Modrinth mods, modpacks, resource packs and shaders ----
  async (u) => {
    if (host(u) !== "modrinth.com") return null; const m = u.pathname.match(/^\/(mod|modpack|resourcepack|shader|plugin|datapack|project)\/([\w-]+)\/?$/); if (!m) return null;
    const x = await json(`https://api.modrinth.com/v2/project/${m[2]}`); if (!x?.title) return null;
    const v = await json(`https://api.modrinth.com/v2/project/${m[2]}/version`).catch(() => []);
    const body = `<h1>${esc(x.title)}</h1><div class="meta">${esc(x.description)}<br>${num(x.downloads)} downloads · ${num(x.followers)} followers · updated ${esc(when(x.updated))} · ${esc(x.license?.id || "")}</div>${x.icon_url ? `<p><img src="${esc(x.icon_url)}" alt="" style="width:96px;border-radius:12px"></p>` : ""}<p>${tags([...(x.categories || []), ...(x.loaders || [])])}</p><p><b>Minecraft:</b> ${esc((x.game_versions || []).slice(-8).join(", "))}</p>${(x.gallery || []).slice(0, 4).map((g) => `<p><img src="${esc(g.url)}" alt="${esc(g.title || "")}" loading="lazy"></p>`).join("")}${para(x.body?.slice(0, 20000))}${v.length ? `<h2>Latest versions</h2><table>${v.slice(0, 10).map((r) => `<tr><td>${esc(r.name)}</td><td>${esc((r.game_versions || []).slice(-3).join(", "))}</td><td>${(r.files || [])[0] ? `<a href="${esc(r.files[0].url)}">download</a>` : ""}</td></tr>`).join("")}</table>` : ""}`;
    return out(u, x.title, body, "Shown from Modrinth's open API.");
  },
  // ---- iNaturalist observations and species ----
  async (u) => {
    if (host(u) !== "inaturalist.org") return null; const o = u.pathname.match(/^\/observations\/(\d+)/), t = u.pathname.match(/^\/taxa\/(\d+)/); if (!o && !t) return null;
    if (o) {
      const x = (await json(`https://api.inaturalist.org/v1/observations/${o[1]}`)).results?.[0]; if (!x) return null; const name = x.taxon?.preferred_common_name || x.taxon?.name || x.species_guess || "Observation";
      const body = `<h1>${esc(name)}</h1><div class="meta">${x.taxon?.name ? `<i>${esc(x.taxon.name)}</i> · ` : ""}seen by ${esc(x.user?.login || "")} · ${esc(when(x.observed_on))} · ${esc(x.place_guess || "")} · ${esc((x.quality_grade || "").replace("_", " "))}</div>${(x.photos || []).map((p) => `<p><img src="${esc((p.url || "").replace("square", "large"))}" alt="${esc(name)}" loading="lazy"></p>`).join("")}${para(x.description)}${x.identifications?.length ? `<h2>Identifications</h2>${x.identifications.slice(0, 12).map((i) => `<p><b>${esc(i.taxon?.preferred_common_name || i.taxon?.name || "")}</b> <span class="meta">${esc(i.user?.login || "")} · ${esc(when(i.created_at))}</span></p>`).join("")}` : ""}`;
      return out(u, name, body, "Shown from iNaturalist's open API.");
    }
    const x = (await json(`https://api.inaturalist.org/v1/taxa/${t[1]}`)).results?.[0]; if (!x) return null; const name = x.preferred_common_name || x.name;
    const body = `<h1>${esc(name)}</h1><div class="meta"><i>${esc(x.name)}</i> · ${esc(x.rank || "")} · ${num(x.observations_count)} observations${x.conservation_status?.status_name ? " · " + esc(x.conservation_status.status_name) : ""}</div>${x.default_photo?.medium_url ? `<p><img src="${esc(x.default_photo.medium_url.replace("medium", "large"))}" alt="${esc(name)}"></p>` : ""}<div>${x.wikipedia_summary || ""}</div><p class="meta">${(x.ancestors || []).map((a) => `<a href="https://www.inaturalist.org/taxa/${a.id}">${esc(a.preferred_common_name || a.name)}</a>`).join(" › ")}</p>${x.children?.length ? `<h2>Includes</h2><div class="grid">${x.children.slice(0, 24).map((c) => `<a href="https://www.inaturalist.org/taxa/${c.id}">${c.default_photo?.square_url ? `<img src="${esc(c.default_photo.square_url.replace("square", "small"))}" alt="" loading="lazy"><br>` : ""}${esc(c.preferred_common_name || c.name)}</a>`).join("")}</div>` : ""}`;
    return out(u, name, body, "Shown from iNaturalist's open API.");
  },
  // ---- GBIF species ----
  async (u) => {
    if (host(u) !== "gbif.org") return null; const m = u.pathname.match(/^(?:\/[a-z]{2})?\/species\/(\d+)/); if (!m) return null;
    const x = await json(`https://api.gbif.org/v1/species/${m[1]}`); if (!x?.key) return null;
    const [v, c] = await Promise.all([json(`https://api.gbif.org/v1/species/${m[1]}/vernacularNames?limit=60`).catch(() => ({ results: [] })), json(`https://api.gbif.org/v1/occurrence/count?taxonKey=${m[1]}`).catch(() => null)]);
    const en = v.results?.find((n) => n.language === "eng")?.vernacularName, t = en || x.canonicalName || x.scientificName;
    const body = `<h1>${esc(t)}</h1><div class="meta"><i>${esc(x.scientificName)}</i> · ${esc((x.rank || "").toLowerCase())} · ${esc((x.taxonomicStatus || "").toLowerCase())}${c != null ? ` · ${num(c)} recorded sightings` : ""}</div><table>${["kingdom", "phylum", "class", "order", "family", "genus", "species"].filter((k) => x[k]).map((k) => `<tr><th>${k}</th><td>${esc(x[k])}</td></tr>`).join("")}</table>`;
    return out(u, t, body, "Shown from GBIF's open API.");
  },
  // ---- Roblox experiences ----
  async (u) => {
    if (host(u) !== "roblox.com") return null; const m = u.pathname.match(/^(?:\/[a-z]{2})?\/games\/(\d+)/); if (!m) return null;
    const { universeId: id } = await json(`https://apis.roblox.com/universes/v1/places/${m[1]}/universe`); if (!id) return null;
    const x = (await json(`https://games.roblox.com/v1/games?universeIds=${id}`)).data?.[0]; if (!x) return null;
    const th = await json(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${id}&countPerUniverse=4&size=768x432&format=Png`).catch(() => null);
    const body = `<h1>${esc(x.name)}</h1><div class="meta">by ${esc(x.creator?.name || "")} · ${esc(x.genre || "")} · ${num(x.playing)} playing now · ${num(x.visits)} visits · ${num(x.favoritedCount)} favourites · updated ${esc(when(x.updated))}</div>${(th?.data?.[0]?.thumbnails || []).map((p) => p.imageUrl ? `<p><img src="${esc(p.imageUrl)}" alt="" loading="lazy"></p>` : "").join("")}${para(x.description)}`;
    return out(u, x.name, body, "Shown from Roblox's public game data. Open Roblox itself to play.");
  },
  // ---- Speedrun.com games, with the top of the first leaderboard ----
  async (u) => {
    if (host(u) !== "speedrun.com") return null; const m = u.pathname.match(/^\/(?:games\/)?([\w-]+)\/?$/); if (!m || /^(games|news|series|users|about|settings|support|api|login|signup|notifications|guides)$/.test(m[1])) return null;
    const g = (await json(`https://www.speedrun.com/api/v1/games/${m[1]}?embed=categories,platforms`)).data; if (!g?.id) return null;
    const cats = (g.categories?.data || []).filter((c) => c.type === "per-game"), cat = cats[0];
    const lb = cat ? (await json(`https://www.speedrun.com/api/v1/leaderboards/${g.id}/category/${cat.id}?top=10&embed=players`).catch(() => null))?.data : null;
    const who = (r) => (r.run.players || []).map((p) => { if (p.rel === "guest") return p.name; return lb.players?.data?.find((d) => d.id === p.id)?.names?.international || "?"; }).join(", ");
    const time = (s) => { const h = Math.floor(s / 3600), mn = Math.floor((s % 3600) / 60), x = (s % 60).toFixed(s % 1 ? 3 : 0); return `${h ? h + "h " : ""}${mn}m ${x}s`; };
    const body = `<h1>${esc(g.names?.international)}</h1><div class="meta">${esc(g.released || "")} · ${esc((g.platforms?.data || []).map((p) => p.name).join(", "))}</div>${g.assets?.["cover-large"]?.uri ? `<p><img src="${esc(g.assets["cover-large"].uri)}" alt="" style="max-height:260px"></p>` : ""}<p>${tags(cats.map((c) => c.name))}</p>${lb?.runs?.length ? `<h2>World records: ${esc(cat.name)}</h2><table><tr><th>#</th><th>Runner</th><th>Time</th><th>Date</th><th></th></tr>${lb.runs.map((r) => `<tr><td>${r.place}</td><td>${esc(who(r))}</td><td>${time(r.run.times.primary_t)}</td><td>${esc(r.run.date || "")}</td><td>${r.run.videos?.links?.[0]?.uri ? `<a href="${esc(r.run.videos.links[0].uri)}">video</a>` : ""}</td></tr>`).join("")}</table>` : ""}`;
    return out(u, g.names?.international, body, "Shown from Speedrun.com's open API.");
  },
  // ---- Open Food Facts products ----
  async (u) => {
    if (!/(^|\.)openfoodfacts\.org$/.test(u.hostname)) return null; const m = u.pathname.match(/^\/(?:product|produit)\/(\d{6,14})/); if (!m) return null;
    const j = await json(`https://world.openfoodfacts.org/api/v2/product/${m[1]}.json`), x = j.product; if (!x) return null; const t = x.product_name || m[1], n = x.nutriments || {};
    const rows = [["Energy", n["energy-kcal_100g"], "kcal"], ["Fat", n.fat_100g, "g"], ["Saturated fat", n["saturated-fat_100g"], "g"], ["Carbohydrates", n.carbohydrates_100g, "g"], ["Sugars", n.sugars_100g, "g"], ["Fibre", n.fiber_100g, "g"], ["Protein", n.proteins_100g, "g"], ["Salt", n.salt_100g, "g"]].filter((r) => r[1] != null);
    const body = `<h1>${esc(t)}</h1><div class="meta">${esc(x.brands || "")} · ${esc(x.quantity || "")} · barcode ${esc(m[1])}${x.nutriscore_grade ? " · Nutri-Score " + esc(x.nutriscore_grade.toUpperCase()) : ""}${x.nova_group ? " · NOVA " + esc(x.nova_group) : ""}</div>${x.image_url ? `<p><img src="${esc(x.image_url)}" alt="" style="max-height:320px"></p>` : ""}${rows.length ? `<h2>Per 100 g</h2><table>${rows.map((r) => `<tr><th>${r[0]}</th><td>${esc(r[1])} ${r[2]}</td></tr>`).join("")}</table>` : ""}${x.ingredients_text ? `<h2>Ingredients</h2>${para(x.ingredients_text)}` : ""}${x.allergens_tags?.length ? `<p><b>Allergens listed:</b> ${x.allergens_tags.map((a) => esc(a.replace(/^\w+:/, ""))).join(", ")}</p>` : ""}`;
    return out(u, t, body, "Shown from Open Food Facts, a volunteer database. Always check the real label for allergens.");
  },
  // ---- OpenAlex works and authors ----
  async (u) => {
    if (host(u) !== "openalex.org") return null; const m = u.pathname.match(/^\/(?:works\/|authors\/)?([WA]\d+)\/?$/i); if (!m) return null; const id = m[1].toUpperCase();
    if (id[0] === "A") {
      const x = await json(`https://api.openalex.org/authors/${id}`), w = await json(`https://api.openalex.org/works?filter=author.id:${id}&sort=cited_by_count:desc&per-page=25`).catch(() => ({ results: [] }));
      const body = `<h1>${esc(x.display_name)}</h1><div class="meta">${num(x.works_count)} works · ${num(x.cited_by_count)} citations · h-index ${esc(x.summary_stats?.h_index ?? "")}</div><h2>Most cited</h2>${w.results.map((r) => `<p><a href="https://openalex.org/${esc(r.id.split("/").pop())}">${esc(r.display_name)}</a> <span class="meta">${esc(r.publication_year)} · ${num(r.cited_by_count)} citations</span></p>`).join("")}`;
      return out(u, x.display_name, body, "Shown from OpenAlex's open API.");
    }
    const x = await json(`https://api.openalex.org/works/${id}`); if (!x?.display_name) return null; const idx = x.abstract_inverted_index, words = [];
    if (idx) for (const [w, ps] of Object.entries(idx)) for (const p of ps) words[p] = w;
    const body = `<h1>${esc(x.display_name)}</h1><div class="meta">${(x.authorships || []).slice(0, 12).map((a) => esc(a.author?.display_name)).join(", ")}<br>${esc(x.primary_location?.source?.display_name || "")} · ${esc(x.publication_year)} · ${num(x.cited_by_count)} citations${x.open_access?.is_oa ? " · open access" : ""}</div>${words.length ? `<h2>Abstract</h2><p>${esc(words.filter(Boolean).join(" "))}</p>` : ""}<p>${x.open_access?.oa_url ? `<a href="${esc(x.open_access.oa_url)}">Read the full text</a> · ` : ""}${x.doi ? `<a href="${esc(x.doi)}">${esc(x.doi.replace("https://doi.org/", "doi:"))}</a>` : ""}</p><p>${tags((x.topics || []).slice(0, 6).map((c) => c.display_name))}</p>`;
    return out(u, x.display_name, body, "Shown from OpenAlex's open API.");
  },
  // ---- Europe PMC articles ----
  async (u) => {
    if (host(u) !== "europepmc.org") return null; const m = u.pathname.match(/^\/(?:article|abstract)\/([A-Z]+)\/([\w.]+)/i); if (!m) return null;
    const x = (await json(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:${encodeURIComponent(m[2])}%20AND%20SRC:${encodeURIComponent(m[1].toUpperCase())}&resultType=core&format=json`)).resultList?.result?.[0]; if (!x) return null;
    const body = `<h1>${esc(x.title)}</h1><div class="meta">${esc(x.authorString || "")}<br>${esc(x.journalInfo?.journal?.title || x.bookOrReportDetails?.publisher || "")} · ${esc(x.firstPublicationDate || x.pubYear || "")} · cited ${num(x.citedByCount)} times${x.isOpenAccess === "Y" ? " · open access" : ""}</div><h2>Abstract</h2><div>${x.abstractText || "<p>No abstract.</p>"}</div><p>${tags(x.keywordList?.keyword)}</p><p>${x.pmcid ? `<a href="https://europepmc.org/article/PMC/${esc(x.pmcid)}">Full text</a> · ` : ""}${x.doi ? `<a href="https://doi.org/${esc(x.doi)}">doi:${esc(x.doi)}</a>` : ""}</p>`;
    return out(u, x.title, body, "Shown from Europe PMC's open API.");
  },
  // ---- Audius artists and tracks ----
  async (u) => {
    if (host(u) !== "audius.co" || u.pathname.split("/").filter(Boolean).length < 1 || /^\/(trending|explore|feed|search|signin|signup|settings)/.test(u.pathname)) return null;
    const API = "https://api.audius.co/v1", APP = "app_name=kitsune", x = (await json(`${API}/resolve?url=${encodeURIComponent(u.origin + u.pathname)}&${APP}`)).data; if (!x?.id) return null;
    const row = (t) => `<div class="card"><div style="flex:1"><b>${esc(t.title)}</b> <span class="meta">${esc(t.user?.name || "")} · ${dur(t.duration)} · ${num(t.play_count)} plays</span><br><audio controls preload="none" src="${API}/tracks/${esc(t.id)}/stream?${APP}"></audio></div></div>`;
    if (x.handle) {
      const tr = await json(`${API}/users/${x.id}/tracks?limit=25&${APP}`).catch(() => ({ data: [] }));
      const body = `<h1>${esc(x.name)}</h1><div class="meta">@${esc(x.handle)} · ${num(x.follower_count)} followers · ${num(x.track_count)} tracks${x.location ? " · " + esc(x.location) : ""}</div>${x.profile_picture?.["480x480"] ? `<p><img src="${esc(x.profile_picture["480x480"])}" alt="" style="width:130px;border-radius:50%"></p>` : ""}${para(x.bio)}<h2>Tracks</h2>${(tr.data || []).map(row).join("")}`;
      return out(u, x.name, body, "Shown from Audius's open API.");
    }
    if (!x.title) return null;
    const body = `<h1>${esc(x.title)}</h1><div class="meta">${esc(x.user?.name || "")} · ${esc(x.genre || "")} · ${dur(x.duration)} · ${num(x.play_count)} plays</div>${x.artwork?.["480x480"] ? `<p><img src="${esc(x.artwork["480x480"])}" alt="" style="max-height:320px"></p>` : ""}<p><audio controls src="${API}/tracks/${esc(x.id)}/stream?${APP}"></audio></p>${para(x.description)}`;
    return out(u, x.title, body, "Shown from Audius's open API.");
  },
  // ---- Sketchfab 3D models ----
  async (u) => {
    if (host(u) !== "sketchfab.com") return null; const m = u.pathname.match(/^\/(?:3d-models\/[^/]*-|models\/)([0-9a-f]{32})/i); if (!m) return null;
    const x = await json(`https://api.sketchfab.com/v3/models/${m[1]}`); if (!x?.uid) return null;
    const body = `<h1>${esc(x.name)}</h1><div class="meta">by ${esc(x.user?.displayName || "")} · ${num(x.viewCount)} views · ${num(x.likeCount)} likes · ${num(x.faceCount)} faces${x.license?.label ? " · " + esc(x.license.label) : ""}</div><iframe src="https://sketchfab.com/models/${esc(x.uid)}/embed" title="${esc(x.name)}" width="100%" height="460" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe><p>${tags((x.tags || []).map((t) => t.name))}</p>${para(x.description)}`;
    return out(u, x.name, body, "Shown from Sketchfab's open API.");
  },
  // ---- Observable notebooks: the writing and the code, cell by cell ----
  async (u) => {
    if (host(u) !== "observablehq.com") return null; const m = u.pathname.match(/^\/(@[\w-]+\/[\w-]+)\/?$/); if (!m) return null;
    const x = await json(`https://api.observablehq.com/document/${m[1]}`); if (!x?.nodes) return null; const t = x.title || m[1];
    const body = `<h1>${esc(t)}</h1><div class="meta">${esc(x.owner?.name || x.owner?.login || "")} · updated ${esc(when(x.update_time))}${x.license ? " · " + esc(x.license) : ""}</div>${x.nodes.map((n) => { const v = n.value || ""; const md = v.match(/^\s*md`([\s\S]*)`\s*$/); return md ? para(md[1].replace(/^#+\s*/gm, "")) : n.mode === "md" ? para(v.replace(/^#+\s*/gm, "")) : `<pre>${esc(v)}</pre>`; }).join("")}`;
    return out(u, t, body, "Shown from Observable's public notebook data. Charts run only on Observable itself; this shows the text and code.");
  },
  // ---- Odysee videos ----
  async (u) => {
    if (host(u) !== "odysee.com") return null; const p = decodeURIComponent(u.pathname).split("/").filter(Boolean); if (!p.length || p[0] === "$" || p.length > 2) return null;
    const uri = "lbry://" + p.map((s) => s.replace(":", "#")).join("/"), j = await post("https://api.na-backend.odysee.com/api/v1/proxy?m=resolve", { jsonrpc: "2.0", method: "resolve", params: { urls: [uri] } }), x = j.result?.[uri]; if (!x?.claim_id) return null; const v = x.value || {}, t = v.title || x.name;
    if (x.value_type === "channel") { const l = await post("https://api.na-backend.odysee.com/api/v1/proxy?m=claim_search", { jsonrpc: "2.0", method: "claim_search", params: { channel_ids: [x.claim_id], page_size: 24, order_by: ["release_time"], claim_type: ["stream"], no_totals: true } }).catch(() => null); const items = l?.result?.items || []; const body = `<h1>${esc(t)}</h1><div class="meta">${esc(x.name)}</div>${v.thumbnail?.url ? `<p><img src="${esc(v.thumbnail.url)}" alt="" style="width:120px;border-radius:50%"></p>` : ""}${para(v.description)}<h2>Latest</h2><div class="grid">${items.map((c) => `<a href="https://odysee.com/${esc(x.name)}:${esc(x.claim_id)}/${esc(c.name)}:${esc(c.claim_id)}">${c.value?.thumbnail?.url ? `<img src="${esc(c.value.thumbnail.url)}" alt="" loading="lazy"><br>` : ""}${esc(c.value?.title || c.name)}</a>`).join("")}</div>`; return out(u, t, body, "Shown from Odysee's open API."); }
    const body = `<h1>${esc(t)}</h1><div class="meta">${esc(x.signing_channel?.value?.title || x.signing_channel?.name || "")} · ${esc(when(v.release_time ? +v.release_time : ""))}${v.video?.duration ? " · " + dur(v.video.duration) : ""}</div><iframe src="https://odysee.com/$/embed/${esc(encodeURIComponent(x.name))}/${esc(x.claim_id)}" title="${esc(t)}" width="560" height="315" allowfullscreen></iframe><p>${tags(v.tags)}</p>${para(v.description)}`;
    return out(u, t, body, "Shown from Odysee's open API.");
  },
];
