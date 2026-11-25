// Any MediaWiki wiki: Wikipedia and its sister projects, Fandom, Miraheze, or a wiki you name.
// Requests go straight from the browser (origin=*); if a wiki blocks that, Kitsune's server fetches the JSON.
import { api } from "./util.js";

async function getJSON(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } catch {
    const v = await api("feed?as=json&url=" + encodeURIComponent(url));
    return typeof v === "string" ? JSON.parse(v) : v;
  }
}
const q = (w, params) => `${w.api}?${new URLSearchParams({ format: "json", origin: "*", formatversion: "2", ...params })}`;

// Work out a wiki's API address from a name or any link to it.
export function apiFromInput(input) {
  let s = String(input || "").trim();
  if (!s) throw new Error("Type a wiki's address, like onepiece.fandom.com or mentalblock.miraheze.org.");
  if (/^[a-z]{2,3}(-[a-z]+)?$/i.test(s)) return `https://${s.toLowerCase()}.wikipedia.org/w/api.php`; // a language code → that Wikipedia
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  const u = new URL(s);
  if (/\/api\.php$/.test(u.pathname)) return u.origin + u.pathname;
  if (u.hostname.endsWith(".fandom.com")) {
    const lang = u.pathname.match(/^\/([a-z]{2,3}(-[a-z]+)?)\/(wiki|$)/i)?.[1];
    return `${u.origin}${lang ? "/" + lang : ""}/api.php`;
  }
  if (/\.(wikipedia|wikibooks|wikivoyage|wikiquote|wiktionary|wikinews|wikiversity|wikisource|miraheze|wikimedia)\.org$/.test(u.hostname) || u.hostname.endsWith(".wikiquote.org")) return `${u.origin}/w/api.php`;
  return `${u.origin}/w/api.php`; // the usual place; we try /api.php next if this fails
}

export async function discover(input) {
  const tries = [apiFromInput(input)];
  if (tries[0].endsWith("/w/api.php")) tries.push(tries[0].replace("/w/api.php", "/api.php"));
  for (const apiUrl of tries) {
    try {
      const d = await getJSON(`${apiUrl}?${new URLSearchParams({ action: "query", meta: "siteinfo", siprop: "general|rightsinfo", format: "json", origin: "*", formatversion: "2" })}`);
      const g = d.query?.general;
      if (!g) continue;
      return {
        id: new URL(apiUrl).hostname.replace(/\./g, "-") + (new URL(apiUrl).pathname.match(/^\/([a-z]{2,3}(?:-[a-z]+)?)\/api\.php/)?.[1] ? "-" + RegExp.$1 : ""),
        name: g.sitename, api: apiUrl, base: g.server.replace(/^\/\//, "https://") + g.articlepath.replace("$1", ""),
        main: g.mainpage, logo: (g.logo || "").replace(/^\/\//, "https://") || null, lang: g.lang,
        license: d.query.rightsinfo?.text || "", licenseUrl: d.query.rightsinfo?.url || "",
      };
    } catch {}
  }
  throw new Error("Couldn't find a MediaWiki wiki at that address. Try the wiki's main page link.");
}

export async function search(w, text, offset = 0) {
  const d = await getJSON(q(w, { action: "query", list: "search", srsearch: text, srlimit: "20", sroffset: String(offset), srprop: "snippet|wordcount|timestamp" }));
  const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#0?39;/g, "'");
  return { total: d.query?.searchinfo?.totalhits ?? null, next: d.continue?.sroffset ?? null, results: (d.query?.search || []).map((r) => ({ title: r.title, snippet: strip(r.snippet), words: r.wordcount })) };
}

export async function random(w) {
  const d = await getJSON(q(w, { action: "query", list: "random", rnnamespace: "0", rnlimit: "1" }));
  return d.query?.random?.[0]?.title;
}

const DROP = "script, style, link, meta, .mw-editsection, .noprint, .navbox, .vertical-navbox, .sistersitebox, .mbox-small, .ambox, .metadata, .reference-cadre, .mw-empty-elt, .portal-bar, .toc, #toc, .hatnote ~ .hatnote, .article-tabs, .wds-tabs, .reviews, .mw-references-wrap .mw-cite-backlink, .catlinks, .printfooter, .shortdescription, .mw-jump-link, .gallerytext .gallerybox ~ br, figure[typeof~='mw:File/Thumb'] figcaption:empty";

// One article, cleaned up for reading. Links to other articles stay inside Kitsune.
export async function page(w, title) {
  const d = await getJSON(q(w, { action: "parse", page: title, prop: "text|displaytitle|sections|langlinks|categories", redirects: "1", disableeditsection: "1", disabletoc: "1" }));
  if (d.error) throw new Error(d.error.code === "missingtitle" ? `“${title}” isn't on ${w.name}.` : d.error.info);
  const doc = new DOMParser().parseFromString(`<div>${d.parse.text}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  root.querySelectorAll(DROP).forEach((n) => n.remove());
  const host = new URL(w.base).origin;
  // Keep only the wiki classes our own styles know, so a wiki's class names can't clash with the app's.
  const KEEP = new Set(["infobox", "portable-infobox", "reference", "references", "reflist", "thumb", "thumbcaption"]);
  for (const el of root.querySelectorAll("*")) {
    for (const a of [...el.attributes]) if (/^on|^style$/i.test(a.name) || (a.name === "id" && document.getElementById(a.value))) el.removeAttribute(a.name);
    if (el.hasAttribute("class")) { const keep = [...el.classList].filter((c) => KEEP.has(c)); keep.length ? el.setAttribute("class", keep.join(" ")) : el.removeAttribute("class"); }
  }
  for (const img of root.querySelectorAll("img")) {
    const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) { img.remove(); continue; }
    img.setAttribute("src", src.startsWith("//") ? "https:" + src : src.startsWith("/") ? host + src : src);
    img.removeAttribute("srcset"); img.removeAttribute("data-src"); img.setAttribute("loading", "lazy");
  }
  const articlePath = new URL(w.base).pathname;
  for (const a of root.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (href.startsWith("#")) continue;
    let target = null;
    try {
      const u = new URL(href, host);
      if (u.origin === host && u.pathname.startsWith(articlePath) && !u.search) {
        const rawName = u.pathname.slice(articlePath.length);
        const name = (() => { try { return decodeURIComponent(rawName); } catch { return rawName; } })().replace(/_/g, " ");
        // Skip namespaced pages like "File:…" or "Category:…" (no space before the colon).
        // Categories are kept: Kitsune lists their pages.
        if (name && (!/^[^ :]+:\S/.test(name) || /^Category:/i.test(name))) target = name;
      }
    } catch {}
    if (target) { a.setAttribute("data-wiki", target); a.setAttribute("href", "#"); }
    else { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); if (href.startsWith("/")) a.setAttribute("href", host + href); }
  }
  return {
    title: d.parse.displaytitle ? d.parse.displaytitle.replace(/<[^>]+>/g, "") : d.parse.title, resolved: d.parse.title,
    html: root.innerHTML, sections: (d.parse.sections || []).filter((s) => s.toclevel <= 2).map((s) => ({ title: s.line.replace(/<[^>]+>/g, ""), anchor: s.anchor })),
    url: w.base + encodeURIComponent(d.parse.title.replace(/ /g, "_")),
    langs: (d.parse.langlinks || []).filter((l) => l.url).map((l) => ({ lang: l.lang, name: l.autonym || l.langname || l.lang, title: l.title, url: l.url })),
    categories: (d.parse.categories || []).filter((c) => !c.hidden).map((c) => c.category.replace(/_/g, " ")),
    text: root.textContent,
  };
}

// Pages in a category, and the category's own subcategories.
export async function category(w, name, cont = null) {
  const d = await getJSON(q(w, { action: "query", list: "categorymembers", cmtitle: /^Category:/i.test(name) ? name : "Category:" + name, cmlimit: "60", cmtype: "page|subcat", cmprop: "title|type", ...(cont ? { cmcontinue: cont } : {}) }));
  const m = d.query?.categorymembers || [];
  return { pages: m.filter((x) => x.type !== "subcat").map((x) => x.title), subcats: m.filter((x) => x.type === "subcat").map((x) => x.title.replace(/^[^:]+:/, "")), next: d.continue?.cmcontinue || null };
}

// Find a series' Fandom wiki from its title: "Jujutsu Kaisen" → jujutsu-kaisen.fandom.com or jujutsukaisen.fandom.com.
export async function fandomFor(title) {
  const known = PRESET_WIKIS.find((p) => p.series && p.series.some((t) => t.toLowerCase() === String(title).toLowerCase()));
  if (known) return discover(known.input);
  const base = String(title).toLowerCase().replace(/\(.*?\)|vol(ume)?\.? ?\d+.*$|[:–—-].*$/g, "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
  const words = base.replace(/[^a-z0-9 ]+/g, "").split(/\s+/).filter(Boolean);
  if (!words.length) throw new Error("No title to look up.");
  const slugs = [...new Set([words.join("-"), words.join(""), words.filter((x) => !/^(the|a|an|no|of)$/.test(x)).join(""), words[0]])];
  for (const slug of slugs) { try { return await discover(slug + ".fandom.com"); } catch {} }
  throw new Error(`No Fandom wiki found for “${title}”. Add one by address in Wikis.`);
}

// Wikipedia's daily feed: featured article, in the news, on this day, most read.
export async function featuredFeed(lang = "en", d = new Date()) {
  const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/feed/featured/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`, { signal: AbortSignal.timeout(12_000) });
  if (!r.ok) throw new Error("Wikipedia's daily feed didn't load.");
  return r.json();
}

// Built-in directory. Fandom and Miraheze host thousands more; add any by address.
const G = { wm: "Wikimedia", ma: "Manga & anime", ga: "Games", tv: "Movies, TV & books", mh: "Miraheze", ind: "Independent" };
export const WIKI_GROUPS = G;
const P = (group, input, note, series) => ({ group, input, note, ...(series ? { series } : {}) });
export const PRESET_WIKIS = [
  P(G.wm, "en.wikipedia.org", "The free encyclopedia"),
  P(G.wm, "simple.wikipedia.org", "Wikipedia in simpler English"),
  P(G.wm, "ja.wikipedia.org", "日本語版ウィキペディア"),
  P(G.wm, "en.wiktionary.org", "Dictionary for every language"),
  P(G.wm, "en.wikibooks.org", "Free textbooks and manuals"),
  P(G.wm, "en.wikisource.org", "Free source texts"),
  P(G.wm, "en.wikiquote.org", "Quotations"),
  P(G.wm, "en.wikivoyage.org", "Free travel guides"),
  P(G.wm, "en.wikiversity.org", "Free learning resources"),
  P(G.wm, "en.wikinews.org", "Free news"),
  P(G.wm, "species.wikimedia.org", "Directory of species"),
  P(G.ma, "onepiece.fandom.com", "One Piece", ["One Piece"]),
  P(G.ma, "naruto.fandom.com", "Narutopedia", ["Naruto", "Boruto"]),
  P(G.ma, "dragonball.fandom.com", "Dragon Ball", ["Dragon Ball", "Dragon Ball Z", "Dragon Ball Super"]),
  P(G.ma, "bleach.fandom.com", "Bleach", ["Bleach"]),
  P(G.ma, "jujutsu-kaisen.fandom.com", "Jujutsu Kaisen", ["Jujutsu Kaisen"]),
  P(G.ma, "chainsaw-man.fandom.com", "Chainsaw Man", ["Chainsaw Man"]),
  P(G.ma, "kimetsu-no-yaiba.fandom.com", "Demon Slayer", ["Demon Slayer", "Kimetsu no Yaiba", "Demon Slayer: Kimetsu no Yaiba"]),
  P(G.ma, "attackontitan.fandom.com", "Attack on Titan", ["Attack on Titan", "Shingeki no Kyojin"]),
  P(G.ma, "myheroacademia.fandom.com", "My Hero Academia", ["My Hero Academia", "Boku no Hero Academia"]),
  P(G.ma, "hunterxhunter.fandom.com", "Hunterpedia", ["Hunter x Hunter"]),
  P(G.ma, "fma.fandom.com", "Fullmetal Alchemist", ["Fullmetal Alchemist"]),
  P(G.ma, "deathnote.fandom.com", "Death Note", ["Death Note"]),
  P(G.ma, "berserk.fandom.com", "Berserk", ["Berserk"]),
  P(G.ma, "jojo.fandom.com", "JoJo's Bizarre Adventure", ["JoJo's Bizarre Adventure"]),
  P(G.ma, "spy-x-family.fandom.com", "Spy x Family", ["Spy x Family", "Spy×Family"]),
  P(G.ma, "onepunchman.fandom.com", "One-Punch Man", ["One-Punch Man", "One Punch Man"]),
  P(G.ma, "sailormoon.fandom.com", "Sailor Moon", ["Sailor Moon", "Pretty Guardian Sailor Moon"]),
  P(G.ma, "tokyoghoul.fandom.com", "Tokyo Ghoul", ["Tokyo Ghoul"]),
  P(G.ma, "haikyuu.fandom.com", "Haikyu!!", ["Haikyu!!", "Haikyuu!!"]),
  P(G.ma, "blackclover.fandom.com", "Black Clover", ["Black Clover"]),
  P(G.ma, "dandadan.fandom.com", "Dandadan", ["Dandadan", "Dan Da Dan"]),
  P(G.ma, "bluelock.fandom.com", "Blue Lock", ["Blue Lock"]),
  P(G.ma, "frieren.fandom.com", "Frieren", ["Frieren", "Frieren: Beyond Journey's End", "Sousou no Frieren"]),
  P(G.ma, "mushokutensei.fandom.com", "Mushoku Tensei", ["Mushoku Tensei"]),
  P(G.ma, "rezero.fandom.com", "Re:Zero", ["Re:Zero"]),
  P(G.ma, "sololeveling.fandom.com", "Solo Leveling", ["Solo Leveling"]),
  P(G.ma, "vinlandsaga.fandom.com", "Vinland Saga", ["Vinland Saga"]),
  P(G.ma, "fairytail.fandom.com", "Fairy Tail", ["Fairy Tail"]),
  P(G.ma, "gintama.fandom.com", "Gintama", ["Gintama"]),
  P(G.ma, "doraemon.fandom.com", "Doraemon", ["Doraemon"]),
  P(G.ma, "yugioh.fandom.com", "Yu-Gi-Oh!", ["Yu-Gi-Oh!"]),
  P(G.ga, "pokemon.fandom.com", "Pokémon", ["Pokémon", "Pokemon", "Pokémon Adventures"]),
  P(G.ga, "bulbapedia.bulbagarden.net", "Bulbapedia, the community Pokémon encyclopedia"),
  P(G.ga, "zelda.fandom.com", "The Legend of Zelda", ["The Legend of Zelda"]),
  P(G.ga, "minecraft.wiki", "The official Minecraft Wiki"),
  P(G.ga, "genshin-impact.fandom.com", "Genshin Impact"),
  P(G.ga, "elderscrolls.fandom.com", "The Elder Scrolls"),
  P(G.ga, "witcher.fandom.com", "The Witcher", ["The Witcher"]),
  P(G.tv, "harrypotter.fandom.com", "Harry Potter", ["Harry Potter"]),
  P(G.tv, "lotr.fandom.com", "The Lord of the Rings", ["The Lord of the Rings", "The Hobbit"]),
  P(G.tv, "starwars.fandom.com", "Wookieepedia: Star Wars", ["Star Wars"]),
  P(G.tv, "marvel.fandom.com", "Marvel Database: comics and films"),
  P(G.tv, "dc.fandom.com", "DC Database: comics and films"),
  P(G.mh, "mentalblock.miraheze.org", "Mental Block"),
  P(G.mh, "meta.miraheze.org", "Miraheze's hub: find more Miraheze wikis"),
  P(G.mh, "allthetropes.miraheze.org", "All The Tropes: storytelling tropes"),
  P(G.mh, "bluearchive.miraheze.org", "Blue Archive"),
  P(G.mh, "lgbta.miraheze.org", "LGBTQIA+ Wiki"),
  P(G.ind, "community.fandom.com", "Fandom's hub: find any Fandom wiki"),
  P(G.ind, "wiki.archlinux.org", "ArchWiki: Linux how-tos"),
  P(G.ind, "www.mediawiki.org", "MediaWiki, the software behind wikis"),
];
