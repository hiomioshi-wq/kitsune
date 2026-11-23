import { $, esc, icon, coverHtml, api, plural, fmtMinutes, today } from "../util.js";
import { kvSet, lib, coverSrc, allProgress, progressPct, kvGet, streak, settings, onLibraryChange, getQueue, getItem, finishedThisYear, expectedByNow } from "../store.js";
import { itemCard, wireItems, openItem, TYPE_LABEL } from "./common.js";
import { setCrumbs } from "../main.js";
import { isKids } from "../profiles.js";
import { coverflowHtml, wireCoverflow } from "./coverflow.js";

// One book on the shelf: a spine coloured from its title, height from its length, a progress strip at the foot.
export function shelfSpines(items, prog) {
  return items.map((i) => {
    let h = 7;
    for (const c of String(i.title || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const hue = h % 360;
    const pct = progressPct(prog[i.id]);
    const tall = 150 + ((h >>> 3) % 44);
    const done = pct >= 100 || i.status === "completed";
    return `<button class="spine${done ? " is-done" : ""}" type="button" role="listitem" data-id="${esc(i.id)}" title="${esc(i.title)}" style="--h:${hue};--t:${tall}px"><span class="spine-t">${esc(i.title)}</span>${pct && !done ? `<span class="spine-p" style="height:${pct}%"></span>` : ""}</button>`;
  }).join("");
}

export async function render(view) {
  setCrumbs([["Home", "home"]]);
  const draw = async () => {
    const prog = await allProgress();
    const inProgress = lib.items
      .filter((i) => { const p = prog[i.id]; return p && p.pos > 0 && progressPct(p) < 100; })
      .sort((a, b) => (prog[b.id].updated || 0) - (prog[a.id].updated || 0));
    const hero = inProgress[0];
    const recent = [...lib.items].sort((a, b) => (b.added || 0) - (a.added || 0)).slice(0, 12);
    // The cover flow: books in progress (after the one in the hero), then recent additions, without repeats.
    const stack = [...new Map([...inProgress.slice(1), ...recent].filter((i) => i.id !== hero?.id).map((i) => [i.id, i])).values()].slice(0, 12);
    const queue = await getQueue();
    const kids = isKids();
    const yearDone = (await finishedThisYear()).length;
    const expected = await expectedByNow(settings.yearGoal);
    const onPace = expected - yearDone < 1 ? "On pace" : `${Math.floor(expected - yearDone)} behind pace`;
    const st = await kvGet("stats", { days: {}, finished: [] });
    const t = st.days[today()] || { pages: 0, secs: 0, listen: 0 };
    const week = Object.entries(st.days).filter(([d]) => Date.now() - new Date(d).getTime() < 7 * 86400_000)
      .reduce((a, [, v]) => ({ pages: a.pages + v.pages, secs: a.secs + v.secs + (v.listen || 0) }), { pages: 0, secs: 0 });
    const str = await streak();
    const hour = new Date().getHours();
    const greet = hour < 5 ? "Up late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    view.innerHTML = `
      ${hero ? `<header class="home-greet"><p class="eyebrow">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p><h1 class="h1">${greet}.</h1></header>` : ""}
      <div class="bento">
      ${hero ? heroCard(hero, prog[hero.id]) : `
        <section class="hero hero-empty hero-spot">
          <div>
            <p class="eyebrow">${greet}</p>
            <h2>Your shelf, your rules.</h2>
            <p>Read the manga and books you own, thousands of free classics, and stories made only for Kitsune.</p>
            <div class="hero-actions" style="margin-top:20px">
              <a class="btn btn-accent btn-lg" href="#books/free">${icon("star")}Explore Kitsune Originals</a>
              <button class="btn btn-lg" type="button" data-action="import">${icon("upload")}Add your own</button>
            </div>
          </div>
          <div class="hero-stack" aria-hidden="true">
            <img src="/originals/kitsu-delivers-1/000.svg" alt="" style="--r:-8deg;--x:-40px">
            <img src="/originals/covers/the-color-thief-of-oz.svg" alt="" style="--r:5deg;--x:40px">
            <img src="/originals/incarnate/spinoff-ember.svg" alt="" style="--r:-1deg;--x:0px">
          </div>
        </section>`}

      <div class="statline bento-stats">
        <div class="stat stat-streak"><span class="k">${icon("fire")}Streak</span><span class="v">${str}</span><span class="s">${str === 1 ? "day" : "days"} in a row</span></div>
        <div class="stat"><span class="k">${icon("pages")}Today</span><span class="v">${t.pages}</span>
          <span class="s">of ${settings.goal} pages</span><div class="goal"><i style="width:${Math.min(100, (t.pages / settings.goal) * 100)}%"></i></div></div>
        <div class="stat"><span class="k">${icon("clock")}This week</span><span class="v">${fmtMinutes(week.secs)}</span><span class="s">${plural(week.pages, "page")} read</span></div>
        <a class="stat" href="#stats" style="text-decoration:none"><span class="k">${icon("star")}${new Date().getFullYear()} challenge</span><span class="v">${yearDone} <span style="font-size:15px;color:var(--muted)">/ ${settings.yearGoal}</span></span>
          <span class="s">${yearDone >= settings.yearGoal ? "Goal reached!" : onPace}</span><div class="goal"><i style="width:${Math.min(100, (yearDone / settings.yearGoal) * 100)}%"></i></div></a>
      </div>
      </div>

      ${(() => { const m = new Date().getMonth(); if (m < 10 && m > 0) return ""; const y = m === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
        return `<button class="wr-banner" type="button" id="home-wrapped" data-year="${y}"><span class="wr-banner-glow" aria-hidden="true"></span><span class="wr-banner-k">Kitsune Wrapped</span><strong>Your ${y} in reading is ready</strong><span class="wr-banner-s">Pages, hours, your book of the year and the reader you turned out to be.</span><span class="wr-banner-go">${icon("play")} Play</span></button>`; })()}

      ${stack.length >= 3 ? `<section class="section flow-sec"><div class="section-head"><div><h2 class="h2">Your stack</h2><p class="lede" style="margin-top:4px">What you're reading and what you added lately. Tap a book to bring it forward.</p></div><a href="#library">Library ${icon("next")}</a></div>
        <div id="r-flow">${coverflowHtml(stack, prog, { label: "Your stack" })}</div></section>` : ""}

      <div class="home-portals">
        <a class="portal portal-den" href="#den"><span class="portal-art" id="home-fox" aria-hidden="true"></span><span><small>Your den</small><strong id="home-fox-rank">Your fox</strong><em id="home-fox-sub">Grows a tail as you read</em></span></a>
        <a class="portal portal-atlas" href="#atlas"><span class="portal-art portal-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span><small>Atlas</small><strong>Your library as a night sky</strong><em>${lib.items.length} ${lib.items.length === 1 ? "star" : "stars"}</em></span></a>
      </div>

      <section class="section recall-sec" id="recall" hidden></section>

      <section class="section"><div class="section-head"><div><h2 class="h2">Kitsune Originals</h2><p class="lede" style="margin-top:4px">Series, stories and manga you can only read here.</p></div><a href="#books/free">All originals ${icon("next")}</a></div>
        <div class="orig-rail" id="r-orig">${loadingRail()}</div></section>


      ${queue.length ? `<section class="section"><div class="section-head"><h2 class="h2">Up next</h2><a href="#library/queue">Edit queue ${icon("next")}</a></div>
        <div class="rail" id="r-queue">${queue.map((id) => itemCard(getItem(id), prog[id])).join("")}</div></section>` : ""}

      <section class="section shelf-sec"><div class="section-head"><div><h2 class="h2">On your shelf</h2><p class="lede" style="margin-top:4px">Every book you own, spine out. Tap one to open it.</p></div><a href="#library/all">Browse all ${icon("next")}</a></div>
        ${lib.items.length ? `<div class="shelf" id="r-shelf" role="list">${shelfSpines(lib.items.slice(0, 40), prog)}</div>` : `<p class="muted">Your shelf is empty. <button class="link-btn" data-action="import">Add a book</button></p>`}
      </section>

      <section class="section"><div class="section-head"><h2 class="h2">Recently added</h2><a href="#library">See all ${icon("next")}</a></div>
        ${recent.length ? `<div class="rail" id="r-recent">${recent.map((i) => itemCard(i, prog[i.id])).join("")}</div>` :
        `<p class="muted">Nothing yet. <button class="link-btn" data-action="import">Add something</button></p>`}</section>

      <section class="section" id="today" hidden><div class="section-head"><h2 class="h2">Today</h2><span class="muted" style="font-size:13px">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span></div>
        <div class="today-grid" id="today-grid"></div></section>

      <div id="because"></div>

      <section class="section"><div class="section-head"><div><h2 class="h2">Classic manga</h2><p class="lede" style="margin-top:4px">Hokusai's sketchbooks and Edo-period picture books, scanned by libraries. Public domain.</p></div><a href="#discover/classic">More ${icon("next")}</a></div>
        <div class="rail" id="r-classic">${loadingRail()}</div></section>

      ${kids ? "" : `<section class="section"><div class="section-head"><h2 class="h2">Trending on AniList</h2><a href="#discover">Discover ${icon("next")}</a></div>
        <div class="rail" id="r-trending">${loadingRail()}</div></section>`}

      <section class="section"><div class="section-head"><h2 class="h2">Free to read tonight</h2><a href="#books">Books ${icon("next")}</a></div>
        <div class="rail" id="r-books">${loadingRail()}</div></section>

      <section class="section"><div class="section-head"><h2 class="h2">Listen</h2><a href="#books/audio">Audiobooks ${icon("next")}</a></div>
        <div class="rail" id="r-audio">${loadingRail()}</div></section>`;

    view.querySelectorAll("[data-action=import]").forEach((b) => b.addEventListener("click", async () => (await import("./link.js")).openImport()));
    $("#hero-resume", view)?.addEventListener("click", () => openItem(hero));
    ["#r-continue", "#r-recent", "#r-queue"].forEach((s) => { const el = $(s, view); if (el) wireItems(el, draw); });
    $("#r-shelf", view)?.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) openItem(getItem(b.dataset.id)); });
    $("#home-wrapped", view)?.addEventListener("click", async (e) => (await import("../wrapped.js")).openWrapped(Number(e.currentTarget.dataset.year)));
    import("../den.js").then(async (D) => { const st = await D.denState(); const art = $("#home-fox", view); if (!art) return; art.innerHTML = D.foxSvg(st.level, st.fur, { size: 92, wisps: false }); $("#home-fox-rank", view).textContent = st.rank[0]; $("#home-fox-sub", view).textContent = `Level ${st.level} · ${st.quests.filter((q) => q.done).length} of ${st.quests.length} quests today`; }).catch(() => {});
    import("../recall.js").then((R) => { const h = $("#recall", view); if (h) R.homeCard(h); }).catch(() => {});
    wireCoverflow($("#r-flow", view), (id) => { const it = getItem(id); if (it) openItem(it); });
    fill(view);
    originalsRail(view, kids);
    todayPicks(view);
    because(view, prog);
  };
  await draw();
  return onLibraryChange(() => {});
}

// Originals rail: every series, then the standalone Oz stories and the Kitsu manga.
async function originalsRail(view, kids) {
  const { SERIES, ORIGINALS } = await import("../originals.js");
  const el = $("#r-orig", view); if (!el) return;
  const series = SERIES.filter((x) => !(kids && x.mature)).map((x) => ({
    href: "#books/free/" + x.id, cover: (x.items.find((i) => /^(Episode 1|Book One)/.test(i.label)) || x.items[0]).cover, title: x.title.split(" · ")[0], meta: `${x.items.length} ${x.items.length === 1 ? "entry" : "entries"}${x.mature ? " · Mature" : ""}`, tag: "Series" }));
  const singles = ORIGINALS.map((o) => ({ href: "#books/free", cover: o.cover, title: o.title.replace(/ · Ch\. 1:.*$/, ""), meta: o.type === "manga" ? "Manga" : `Story · ${o.minutes} min`, tag: o.type === "manga" ? "Manga" : "Story" }));
  el.innerHTML = [...series, ...singles].map((c) => `<a class="orig-tile" href="${esc(c.href)}"><span class="orig-tile-img"><img src="${esc(c.cover)}" alt="" loading="lazy"></span>
    <span class="orig-tile-tag">${esc(c.tag)}</span><strong>${esc(c.title)}</strong><span class="muted">${esc(c.meta)}</span></a>`).join("");
}

function heroCard(item, p) {
  const pct = progressPct(p);
  const label = item.type === "manga" ? `Page ${p.pos + 1} of ${p.total}` : item.type === "audio" ? `Chapter ${p.pos + 1} of ${p.total}` : `${pct}% through`;
  const src = coverSrc(item);
  return `<section class="hero" data-tint="${esc(src || "")}">
    <div class="hero-bg" style="${src ? `background-image:url('${esc(src)}')` : ""}"></div>
    ${coverHtml(src, item.title)}
    <div style="min-width:0">
      <p class="eyebrow">Continue ${item.type === "audio" ? "listening" : "reading"} · ${esc(TYPE_LABEL[item.type])}</p>
      <h2>${esc(item.title)}</h2>
      <p>${esc(item.series || item.author || item.origin || "")}</p>
      <div class="hero-prog"><div><i style="width:${pct}%"></i></div><span class="tnum">${esc(label)}</span></div>
      <div class="hero-actions">
        <button class="btn btn-accent btn-lg" type="button" id="hero-resume">${icon(item.type === "audio" ? "play" : "book")}${item.type === "audio" ? "Resume" : "Resume reading"}</button>
        <a class="btn btn-lg" href="#item/${encodeURIComponent(item.id)}">Details</a>
      </div>
    </div>
  </section>`;
}

// Today: Wikipedia's featured article, a classic manga and a free book, chosen by the date.
async function todayPicks(view) {
  const d = new Date(), seed = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
  const cards = [];
  const tile = (kind, href, img, title, text, cta) => `<a class="today-card" href="${esc(href)}">
    <span class="today-img">${img ? `<img src="${esc(img)}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="today-ico">${icon("type")}</span>`}</span>
    <span class="today-txt"><span class="eyebrow">${esc(kind)}</span><strong>${esc(title)}</strong><span class="muted">${esc(text)}</span><span class="link-btn">${esc(cta)} ${icon("next")}</span></span></a>`;
  const jobs = [
    fetch(`https://en.wikipedia.org/api/rest_v1/feed/featured/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`, { signal: AbortSignal.timeout(10_000) })
      .then((r) => r.json()).then((f) => { const t = f.tfa; if (t) cards[0] = tile("Wikipedia's featured article", `#wiki/en-wikipedia-org/${encodeURIComponent(t.titles.canonical)}`, t.thumbnail?.source, t.titles.normalized, (t.extract || "").slice(0, 150) + "…", "Read it here"); }),
    isKids() ? null : api("scans?kind=manga").then((r) => { const s = r.results[seed % r.results.length]; if (s) cards[1] = tile("Classic manga of the day", `#scan/${encodeURIComponent(s.id)}`, s.cover, s.title, [s.creator.split(",")[0], s.year, s.pages + " pages"].filter(Boolean).join(" · "), "Open the scan"); }),
    import("../gutendex.js").then((g) => g.searchBooks({ sort: "popular", page: 1 + (seed % 5) })).then((r) => { const b = r.results[seed % r.results.length]; if (b) cards[2] = tile("Free book of the day", `#gutenberg/${b.id}`, b.cover, b.title, (b.summary || b.authors.join(", ")).slice(0, 150), "Start reading"); }),
    // A poem for the day: picked once, kept until tomorrow.
    (async () => {
      const key = "poemOfDay", stamp = d.toDateString();
      let p = await kvGet(key, null);
      if (p?.day !== stamp) {
        const raw = await api("feed?as=json&url=" + encodeURIComponent("https://poetrydb.org/random/20"));
        // Prefer a short poem; otherwise take the shortest of the batch.
        const list = (typeof raw === "string" ? JSON.parse(raw) : raw).filter((x) => x.lines?.length >= 4).sort((x, y) => x.lines.length - y.lines.length);
        const pick = list.find((x) => x.lines.length <= 60) || list[0];
        if (!pick) return;
        p = { day: stamp, title: pick.title, author: pick.author, lines: pick.lines.filter((l) => l.trim()).slice(0, 2) };
        kvSet(key, p);
      }
      cards[3] = tile("Poem of the day", `#books/poems/${encodeURIComponent(p.author)}`, null, p.title, `${p.author} · ${p.lines.join(" / ")}`, "Read the poem");
    })(),
  ].filter(Boolean);
  await Promise.allSettled(jobs);
  const el = $("#today-grid", view); if (!el) return;
  const html = cards.filter(Boolean).join("");
  if (html) { el.innerHTML = html; $("#today", view).hidden = false; }
}

// "Because you read …": AniList recommendations for your recent linked manga,
// and Gutenberg books that share a subject with your recent book.
async function because(view, prog) {
  const box = $("#because", view); if (!box) return;
  const recent = [...lib.items].sort((a, b) => (prog[b.id]?.updated || b.lastRead || 0) - (prog[a.id]?.updated || a.lastRead || 0));
  const owned = new Set(lib.items.map((i) => i.link?.anilistId).filter(Boolean));
  const manga = isKids() ? null : recent.find((i) => i.link?.anilistId && prog[i.id]);
  const book = recent.find((i) => i.source?.kind === "gutenberg" && prog[i.id]);
  const sections = [];
  if (manga) {
    try {
      const m = await api("manga/" + manga.link.anilistId);
      const recs = (m.recommendations || []).filter((r) => !owned.has(r.id));
      if (recs.length) sections.push(`<section class="section"><div class="section-head"><h2 class="h2">Because you read ${esc(m.title)}</h2><a href="#manga/${m.id}">Series ${icon("next")}</a></div>
        <div class="rail">${recs.map((r) => webCard("manga/" + r.id, r.cover, r.title, [r.year, r.score ? r.score + "%" : ""].filter(Boolean).join(" · "), r.color)).join("")}</div></section>`);
    } catch {}
  }
  if (book) {
    try {
      const { getBook, searchBooks } = await import("../gutendex.js");
      const b = await getBook(book.source.gid);
      const subject = (b.shelves[0] || b.subjects[0] || "").split(" -- ")[0].replace(/^(Category: )?/, "").trim();
      if (subject) {
        const d = await searchBooks({ topic: subject.toLowerCase(), languages: b.languages[0] || "en" });
        const recs = d.results.filter((x) => x.id !== b.id && !lib.items.some((i) => i.source?.gid === x.id)).slice(0, 14);
        if (recs.length) sections.push(`<section class="section"><div class="section-head"><h2 class="h2">More like ${esc(book.title.split(/[;:]/)[0])}</h2><a href="#books">Books ${icon("next")}</a></div>
          <p class="lede" style="margin:-8px 0 14px">Free books about ${esc(subject.toLowerCase())}.</p>
          <div class="rail">${recs.map((x) => webCard("gutenberg/" + x.id, x.cover, x.title, (x.authors[0] || "").split(",")[0])).join("")}</div></section>`);
      }
    } catch {}
  }
  if ($("#because", view)) $("#because", view).innerHTML = sections.join("");
}

const loadingRail = () => Array.from({ length: 7 }, () => `<div class="sk-card"><div class="skeleton"></div><div class="skeleton"></div></div>`).join("");
const railErr = (e) => `<p class="status err">${esc(e.message)}</p>`;
const webCard = (href, cover, title, meta, color) => `<a class="card" href="#${href}">${coverHtml(cover, title, { color })}<span class="card-t">${esc(title)}</span><span class="card-m">${esc(meta)}</span></a>`;

function fill(view) {
  api("scans?kind=manga").then((d) => { const el = $("#r-classic", view); if (el) el.innerHTML = d.results.slice(0, 14).map((s) => webCard("scan/" + encodeURIComponent(s.id), s.cover, s.title, [s.year, s.pages + "p"].filter(Boolean).join(" · "))).join(""); })
    .catch((e) => { const el = $("#r-classic", view); if (el) el.innerHTML = railErr(e); });
  if (!isKids()) api("manga?sort=trending").then((d) => { const el = $("#r-trending", view); if (el) el.innerHTML = d.results.slice(0, 16).map((m) => webCard("manga/" + m.id, m.cover, m.title, [m.year, m.score ? m.score + "%" : ""].filter(Boolean).join(" · "), m.color)).join(""); })
    .catch((e) => { const el = $("#r-trending", view); if (el) el.innerHTML = railErr(e); });
  import("../gutendex.js").then((g) => g.searchBooks({ sort: "popular" })).then((d) => { const el = $("#r-books", view); if (el) el.innerHTML = d.results.slice(0, 16).map((b) => webCard("gutenberg/" + b.id, b.cover, b.title, (b.authors[0] || "").split(",")[0])).join(""); })
    .catch((e) => { const el = $("#r-books", view); if (el) el.innerHTML = railErr(e); });
  api("audio").then((d) => { const el = $("#r-audio", view); if (el) el.innerHTML = d.results.map((b) => webCard("audiobook/" + b.id, b.cover, b.title, [b.authors[0], b.totalTime].filter(Boolean).join(" · "))).join(""); })
    .catch((e) => { const el = $("#r-audio", view); if (el) el.innerHTML = railErr(e); });
}
