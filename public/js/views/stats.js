import { $, esc, icon, plural, fmtMinutes, today, coverHtml } from "../util.js";
export { wrappedImage };
import { lib, kvGet, streak, settings, getItem, coverSrc, finishedThisYear, expectedByNow } from "../store.js";
import { setCrumbs } from "../main.js";

// A 1080×1350 summary image for sharing.
async function wrappedImage(d) {
  await Promise.all(['400 80px "Dela Gothic One"', '700 32px "Zen Kaku Gothic New"', '500 24px "IBM Plex Mono"'].map((f) => document.fonts?.load?.(f).catch(() => {})));
  const W = 1080, H = 1350, P = 90;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent-d").trim() || "#f2a03f";
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#1b1d3a"); bg.addColorStop(1, "#0d0e1d");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.12; g.fillStyle = accent; g.beginPath(); g.arc(W - 120, 180, 320, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
  g.fillStyle = accent; g.font = '500 26px "IBM Plex Mono", monospace'; g.fillText("KITSUNE WRAPPED", P, P + 10);
  g.fillStyle = "#f4f3fb"; g.font = '400 150px "Dela Gothic One", Impact, sans-serif'; g.fillText(String(d.year), P - 6, P + 180);
  const stats = [[d.pages.toLocaleString(), "pages read"], [d.minutes >= 120 ? Math.round(d.minutes / 60) + " h" : d.minutes + " min", "reading & listening"],
    [`${d.finished}/${d.goal}`, "titles finished"], [String(d.streak), "day best streak"], [String(d.days), "days with reading"], [String(d.words), "words saved"]];
  stats.forEach(([v, l], i) => {
    const x = P + (i % 2) * 460, y = P + 330 + Math.floor(i / 2) * 170;
    g.fillStyle = "#f4f3fb"; g.font = '400 72px "Dela Gothic One", Impact, sans-serif'; g.fillText(v, x, y);
    g.fillStyle = "#a9abc7"; g.font = '400 28px "Zen Kaku Gothic New", system-ui, sans-serif'; g.fillText(l, x, y + 44);
  });
  let y = P + 860;
  if (d.top.length) {
    g.fillStyle = accent; g.font = '500 24px "IBM Plex Mono", monospace'; g.fillText("MOST OPENED", P, y);
    g.fillStyle = "#f4f3fb"; g.font = '700 34px "Zen Kaku Gothic New", system-ui, sans-serif';
    d.top.forEach((t, i) => g.fillText(`${i + 1}. ${t.length > 44 ? t.slice(0, 42) + "…" : t}`, P, y + 52 + i * 50));
    y += 52 + d.top.length * 50 + 20;
  }
  if (d.hour) { g.fillStyle = "#a9abc7"; g.font = '400 28px "Zen Kaku Gothic New", system-ui, sans-serif'; g.fillText(`Favourite time to read: ${d.hour}`, P, Math.min(y + 10, H - P - 60)); }
  g.save(); g.translate(W - P - 40, H - P - 30); g.scale(0.45, 0.45);
  g.beginPath(); [[-90, -40], [-60, -150], [-10, -70], [10, -70], [60, -150], [90, -40], [60, 50], [0, 90], [-60, 50]].forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath();
  g.fillStyle = accent; g.fill(); g.restore();
  return new Promise((res) => c.toBlob(res, "image/png"));
}

// The last two weeks you read, newest first.
function historyHtml(days) {
  const rows = Object.entries(days).filter(([, v]) => v.pages || v.secs > 60 || v.listen > 60).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
  if (!rows.length) return "";
  const label = (d) => { const t = today(), y = new Date(); y.setDate(y.getDate() - 1); return d === t ? "Today" : d === today(y) ? "Yesterday" : new Date(d + "T12:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); };
  return `<section class="section"><div class="section-head"><h2 class="h2">History</h2><span class="muted" style="font-size:13px">Your last ${rows.length} reading days</span></div>
    <div class="list">${rows.map(([d, v]) => {
      const items = (v.items || []).map(getItem).filter(Boolean);
      return `<div class="row hist-row">
        <strong class="mono" style="font-size:13px">${label(d)}</strong>
        <div class="row-main hist-items">${items.length ? items.slice(0, 6).map((i) => `<a class="pill" href="#item/${encodeURIComponent(i.id)}" style="text-decoration:none">${esc(i.title.length > 32 ? i.title.slice(0, 30) + "…" : i.title)}</a>`).join("") : `<span class="muted" style="font-size:13px">Reading</span>`}${items.length > 6 ? `<span class="muted" style="font-size:12px">+${items.length - 6}</span>` : ""}</div>
        <span class="mono muted tnum hist-amt">${v.pages ? plural(v.pages, "page") + " · " : ""}${fmtMinutes((v.secs || 0) + (v.listen || 0))}</span></div>`;
    }).join("")}</div></section>`;
}

const hourLabel = (h) => (h === 0 ? "midnight" : h === 12 ? "noon" : h < 12 ? `${h} am` : `${h - 12} pm`);
function hourChart(hours) {
  if (!hours || !hours.some((x) => x > 0)) return "";
  const W = 1120, H = 150, pad = { l: 8, r: 8, t: 10, b: 24 }, bw = (W - pad.l - pad.r) / 24, max = Math.max(...hours);
  const peak = hours.indexOf(max);
  const part = peak < 5 ? "a night owl" : peak < 12 ? "a morning reader" : peak < 17 ? "an afternoon reader" : peak < 21 ? "an evening reader" : "a night owl";
  return `<div class="panel section" style="margin-top:16px"><div class="section-head" style="margin-bottom:6px"><h3 class="h3" style="margin:0">When you read</h3><span class="muted" style="font-size:13px">You're ${part}. Busiest hour: ${hourLabel(peak)}.</span></div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Reading by hour of day, busiest at ${hourLabel(peak)}">
      ${hours.map((v, h) => { const bh = max ? (v / max) * (H - pad.t - pad.b) : 0; return `<rect class="bar-r ${v ? "" : "zero"} ${h === peak ? "today" : ""}" x="${pad.l + h * bw + 2}" y="${H - pad.b - Math.max(2, bh)}" width="${bw - 4}" height="${Math.max(2, bh)}" rx="2"><title>${hourLabel(h)}: ${Math.round(v / 60)} min</title></rect>`; }).join("")}
      ${[0, 6, 12, 18, 23].map((h) => `<text x="${pad.l + h * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${hourLabel(h)}</text>`).join("")}
    </svg></div>`;
}

// The day of week and hour of day your reading piles up in, from the same day and hour tallies the charts use.
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function dowTotals(days) { const t = Array(7).fill(0); for (const [k, v] of Object.entries(days || {})) { const dt = new Date(k + "T12:00"); if (isNaN(dt) || !(v.pages || v.secs > 60 || v.listen > 60)) continue; t[dt.getDay()] += (v.pages || 0) + Math.round(((v.secs || 0) + (v.listen || 0)) / 120); } return t; }
function bestDow(days) { const t = dowTotals(days); return t.some((x) => x > 0) ? t.indexOf(Math.max(...t)) : null; }
function bestHour(hours) { return Array.isArray(hours) && hours.some((x) => x > 0) ? hours.indexOf(Math.max(...hours)) : null; }
function calendarInsight(days, hours) {
  const bd = bestDow(days), bh = bestHour(hours);
  if (bd == null && bh == null) return "";
  const t = dowTotals(days), tot = t.reduce((a, b) => a + b, 0), mx = Math.max(...t);
  const bars = bd != null ? `<svg class="chart" viewBox="0 0 720 112" role="img" aria-label="Reading by day of week, busiest on ${DOW[bd]}">${t.map((v, i) => { const h = mx ? Math.max(2, (v / mx) * 62) : 2; return `<rect class="bar-r ${v ? "" : "zero"} ${i === bd ? "today" : ""}" x="${18 + i * 100}" y="${80 - h}" width="84" height="${h}" rx="2"><title>${DOW[i]}: about ${v} pages' worth</title></rect>`; }).join("")}${t.map((v, i) => `<text x="${60 + i * 100}" y="104" text-anchor="middle">${DOW[i].slice(0, 3)}</text>`).join("")}</svg>` : "";
  return `<div class="panel section" style="margin-top:16px"><div class="section-head" style="margin-bottom:6px"><h3 class="h3" style="margin:0">Reading calendar</h3><span class="muted" style="font-size:13px">${bd != null ? `Best day: ${DOW[bd]} · ${Math.round((t[bd] / Math.max(1, tot)) * 100)}% of your reading` : "No reading days yet"}${bh != null ? ` · Best hour: ${hourLabel(bh)}` : " · hour data not collected yet"}</span></div>${bars}</div>`;
}

export async function render(view) {
  setCrumbs([["Stats", "stats"]]);
  const st = await kvGet("stats", { days: {}, finished: [] });
  const days = st.days;
  const str = await streak();
  const freezes = await (await import("../store.js")).streakFreezes();
  const frozen = new Set((await kvGet("stats", {}))?.freeze?.used || []);
  let best = 0, run = 0;
  const keys = Object.keys(days).sort();
  const first = keys[0] ? new Date(keys[0]) : new Date();
  for (const d = new Date(first); today(d) <= today(); d.setDate(d.getDate() + 1)) {
    const x = days[today(d)];
    if (x && (x.pages || x.secs > 60 || x.listen > 60)) best = Math.max(best, ++run); else if (!frozen.has(today(d))) run = 0; // a day covered by a streak freeze keeps the run going
  }
  best = Math.max(best, str);
  const sum = (fn, from = 0) => Object.entries(days).filter(([d]) => new Date(d).getTime() >= from).reduce((a, [, v]) => a + fn(v), 0);
  const weekAgo = Date.now() - 7 * 86400_000, monthAgo = Date.now() - 30 * 86400_000;
  const totals = {
    pages: sum((v) => v.pages), secs: sum((v) => v.secs), listen: sum((v) => v.listen || 0),
    pagesWeek: sum((v) => v.pages, weekAgo), secsMonth: sum((v) => v.secs + (v.listen || 0), monthAgo),
  };
  const activeDays = keys.filter((k) => days[k].pages || days[k].secs > 60 || days[k].listen > 60).length;

  // last 30 days bar chart
  const last = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 29 + i); const k = today(d); return { k, d, v: days[k]?.pages || 0, m: Math.round(((days[k]?.secs || 0) + (days[k]?.listen || 0)) / 60) }; });
  const max = Math.max(settings.goal, ...last.map((x) => x.v));
  const W = 720, H = 200, pad = { l: 34, r: 8, t: 12, b: 26 };
  const bw = (W - pad.l - pad.r) / 30;
  const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const ticks = [0, Math.round(max / 2), max];
  const chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pages read per day, last 30 days">
    ${ticks.map((t) => `<line class="grid-l" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${pad.l - 6}" y="${y(t) + 3}" text-anchor="end">${t}</text>`).join("")}
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${y(settings.goal)}" y2="${y(settings.goal)}" stroke="var(--accent)" stroke-dasharray="4 4" stroke-width="1"/>
    <text x="${W - pad.r}" y="${y(settings.goal) - 4}" text-anchor="end" style="fill:var(--accent)">goal ${settings.goal}</text>
    ${last.map((x, i) => `<rect class="bar-r ${x.v ? "" : "zero"} ${i === 29 ? "today" : ""}" x="${pad.l + i * bw + 2}" y="${x.v ? y(x.v) : H - pad.b - 2}" width="${bw - 4}" height="${x.v ? H - pad.b - y(x.v) : 2}" rx="2"><title>${x.d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${x.v} pages, ${x.m} min</title></rect>`).join("")}
    ${last.filter((_, i) => i % 7 === 1 || i === 29).map((x) => { const i = last.indexOf(x); return `<text x="${pad.l + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${i === 29 ? "today" : x.d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</text>`; }).join("")}
  </svg>`;

  // a year of activity
  const start = new Date(); start.setDate(start.getDate() - 364 - start.getDay());
  const cells = [];
  for (const d = new Date(start); today(d) <= today(); d.setDate(d.getDate() + 1)) {
    const x = days[today(d)], p = x ? x.pages + Math.round(((x.secs || 0) + (x.listen || 0)) / 120) : 0;
    const l = p === 0 ? 0 : p < 5 ? 1 : p < 15 ? 2 : p < 40 ? 3 : 4;
    cells.push(`<span data-l="${l}" title="${d.toLocaleDateString()}: ${p ? `${x.pages} pages, ${fmtMinutes((x.secs || 0) + (x.listen || 0))}` : "no reading"}"></span>`);
  }

  // most-read titles
  const counts = {};
  for (const v of Object.values(days)) for (const id of v.items || []) counts[id] = (counts[id] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, n]) => [getItem(id), n]).filter(([i]) => i).slice(0, 6);
  const finished = st.finished.slice().reverse().map((f) => [getItem(f.id), f.at]).filter(([i]) => i).slice(0, 12);
  const bigDay = Object.entries(days).filter(([, v]) => (v.pages || 0) > 0).sort((a, b) => b[1].pages - a[1].pages)[0] || null;
  let fastest = null;
  for (const f of st.finished || []) { const it = getItem(f.id); if (!it?.added || !f.at || f.at <= it.added) continue; const dd = Math.max(1, Math.round((f.at - it.added) / 86400)); if (!fastest || dd < fastest.d) fastest = { it, d: dd }; }
  const records = [best > 0 ? `<div class="stat"><span class="k">${icon("fire")}Longest streak</span><span class="v">${best}</span><span class="s">your best run</span></div>` : "", bigDay ? `<div class="stat"><span class="k">${icon("pages")}Biggest day</span><span class="v">${bigDay[1].pages}</span><span class="s">${new Date(bigDay[0] + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></div>` : "", fastest ? `<div class="stat"><span class="k">${icon("star")}Fastest finish</span><span class="v">${plural(fastest.d, "day")}</span><span class="s">${esc(fastest.it.title.length > 36 ? fastest.it.title.slice(0, 34) + "…" : fastest.it.title)}</span></div>` : ""].filter(Boolean).join("");

  // achievements
  const hlCount = Object.values(await kvGet("highlights", {})).reduce((a, l) => a + l.length, 0);
  const types = new Set(lib.items.map((i) => i.type));
  const finishedItems = st.finished.map((f) => getItem(f.id)).filter(Boolean);
  const lateNight = Object.keys(days).length && (await kvGet("lateNight", false));
  const bestDay = Math.max(0, ...Object.values(days).map((v) => v.pages));
  const BADGES = [
    ["First page", "Read your first page.", totals.pages >= 1],
    ["Bookworm", "Read 1,000 pages.", totals.pages >= 1000, `${Math.min(totals.pages, 1000)}/1000`],
    ["Tsundoku", "Have 25 things in your library.", lib.items.length >= 25, `${Math.min(lib.items.length, 25)}/25`],
    ["Finisher", "Finish a volume or book.", st.finished.length >= 1],
    ["Completionist", "Finish 10 titles.", st.finished.length >= 10, `${Math.min(st.finished.length, 10)}/10`],
    ["Week of reading", "Keep a 7-day streak.", best >= 7, `${Math.min(best, 7)}/7`],
    ["Month of reading", "Keep a 30-day streak.", best >= 30, `${Math.min(best, 30)}/30`],
    ["Marathon", "Read 100 pages in one day.", bestDay >= 100, `${Math.min(bestDay, 100)}/100`],
    ["Goal getter", "Hit your daily goal.", bestDay >= settings.goal],
    ["Annotator", "Make 10 highlights.", hlCount >= 10, `${Math.min(hlCount, 10)}/10`],
    ["All ears", "Listen for 5 hours.", totals.listen >= 5 * 3600, `${Math.min(Math.round(totals.listen / 3600), 5)}/5 h`],
    ["Polymath", "Have manga, books and audiobooks.", types.size >= 3, `${types.size}/3`],
    ["Edo explorer", "Open a classic manga scan.", lib.items.some((i) => i.source?.ia)],
    ["Classicist", "Finish a public-domain book.", finishedItems.some((i) => i.source?.kind === "gutenberg")],
    ["Collector", "Link a volume to its AniList series.", lib.items.some((i) => i.link)],
    ["Night owl", "Read after midnight.", !!lateNight],
    ["Regular", "Read on 100 different days.", activeDays >= 100, `${Math.min(activeDays, 100)}/100 days`],
    ["Page mountain", "Read 10,000 pages.", totals.pages >= 10000, `${Math.min(totals.pages, 10000).toLocaleString()}/10,000`],
  ];
  const earned = BADGES.filter((b) => b[2]).length;
  const yearDone = (await finishedThisYear()).length;
  const expected = await expectedByNow(settings.yearGoal);

  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Your reading</p><h1 class="h1">Stats</h1><p class="lede">Counted on this device while a reader is open and you're active.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="#settings">${icon("sliders")}Daily goal: ${settings.goal} pages</a>
        <button class="btn btn-accent" type="button" id="st-wrapped">${icon("star")}Your ${new Date().getFullYear()} Wrapped</button></div></div>
    <div class="statline" style="margin-top:0">
      <div class="stat"><span class="k">${icon("fire")}Current streak</span><span class="v">${str}</span><span class="s">Best: ${plural(best, "day")} · ${freezes ? `❄ ${plural(freezes, "streak freeze")}` : "no streak freezes yet"}</span></div>
      <div class="stat"><span class="k">${icon("pages")}Pages read</span><span class="v">${totals.pages.toLocaleString()}</span><span class="s">${totals.pagesWeek} this week</span></div>
      <div class="stat"><span class="k">${icon("clock")}Time reading</span><span class="v">${fmtMinutes(totals.secs)}</span><span class="s">${fmtMinutes(totals.secsMonth)} in 30 days</span></div>
      <div class="stat"><span class="k">${icon("headphones")}Listening</span><span class="v">${fmtMinutes(totals.listen)}</span><span class="s">${plural(activeDays, "active day")}</span></div>
    </div>
    <div class="panel section" style="margin-top:28px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:24px;align-items:center">
      <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="${yearDone} of ${settings.yearGoal} finished">
        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--line)" stroke-width="12"/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(Math.min(1, yearDone / settings.yearGoal) * 314.16).toFixed(1)} 314.16" transform="rotate(-90 60 60)"/>
        <text x="60" y="60" text-anchor="middle" style="font:700 30px var(--f-body);fill:var(--ink)">${yearDone}</text><text x="60" y="80" text-anchor="middle" style="font:12px var(--f-mono);fill:var(--muted)">of ${settings.yearGoal}</text></svg>
      <div style="min-width:0"><p class="eyebrow">${new Date().getFullYear()} reading challenge</p><h3 class="h2" style="margin:6px 0">${yearDone >= settings.yearGoal ? "Goal reached. Nice reading." : `${settings.yearGoal - yearDone} to go`}</h3>
        <p class="muted" style="margin:0">${expected - yearDone < 1 ? "You're on pace" : `About ${Math.floor(expected - yearDone)} behind pace`} for ${plural(settings.yearGoal, "title")} this year. <a class="link-btn" href="#settings">Change the goal</a></p></div></div>
    ${records ? `<div class="statline">${records}</div>` : ""}
    <div class="two-col section" style="margin-top:16px">
      <div class="panel"><h3 class="h3">Pages per day</h3>${chart}</div>
      <div class="panel"><h3 class="h3">Most opened</h3>${top.length ? `<div class="list">${top.map(([i, n]) => `<a class="row" href="#item/${encodeURIComponent(i.id)}" style="grid-template-columns:40px minmax(0,1fr) auto">${coverHtml(coverSrc(i), i.title)}<div class="row-main"><strong>${esc(i.title)}</strong><span class="sub">${esc(i.series || i.author || "")}</span></div><span class="pill">${plural(n, "day")}</span></a>`).join("")}</div>` : `<p class="muted">Read something and it shows up here.</p>`}</div>
    </div>
    ${hourChart(st.hours)}
    ${calendarInsight(days, st.hours)}
    <div class="panel section" style="margin-top:16px"><h3 class="h3">The last year</h3><div class="heat" aria-label="Reading activity over the last year">${cells.join("")}</div>
      <p class="hint" style="display:flex;gap:6px;align-items:center">Less <span class="heat-legend">${[0, 1, 2, 3, 4].map((l) => `<span data-l="${l}"></span>`).join("")}</span> More</p></div>
    ${historyHtml(days)}
    <section class="section"><div class="section-head"><h2 class="h2">Achievements</h2><span class="muted tnum">${earned} of ${BADGES.length}</span></div>
      <div class="badges">${BADGES.map(([name, desc, ok, prog]) => `<div class="ach ${ok ? "on" : ""}"><span class="ach-ico">${icon(ok ? "star" : "clock")}</span><div><strong>${name}</strong><span>${desc}</span>${!ok && prog ? `<span class="mono">${prog}</span>` : ""}</div></div>`).join("")}</div></section>
    <section class="section"><div class="section-head"><h2 class="h2">Finished</h2><span class="muted">${plural(st.finished.length, "title")}</span></div>
      ${finished.length ? `<div class="rail">${finished.map(([i, at]) => `<a class="card" href="#item/${encodeURIComponent(i.id)}">${coverHtml(coverSrc(i), i.title)}<span class="card-t">${esc(i.title)}</span><span class="card-m">${new Date(at * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></a>`).join("")}</div>` : `<p class="muted">Finish a volume or book and it lands here.</p>`}</section>`;
  // Show the most recent weeks first on narrow screens (the year grid scrolls sideways).
  { const h = $(".heat", view); if (h) requestAnimationFrame(() => (h.scrollLeft = h.scrollWidth)); }
  $("#st-wrapped", view).onclick = async () => (await import("../wrapped.js")).openWrapped();
}
