// The Den page: your fox, its tails, today's quests and the coats you've unlocked.
import { $, $$, esc, icon, toast } from "../util.js";
import { setCrumbs } from "../main.js";
import { denState, foxSvg, FURS, LEVELS, RANKS, setFur, celebrate } from "../den.js";

const fmt = (n) => Number(n).toLocaleString();

export async function render(view) {
  setCrumbs([["Den", "den"]]);
  const draw = async () => {
    const s = await denState();
    const doneToday = s.quests.filter((q) => q.done).length;
    view.innerHTML = `
    <div class="den">
      <section class="den-hero" style="--fur:${s.fur[2].startsWith("url") ? "#7b5cff" : s.fur[2]}">
        <div class="den-sky" aria-hidden="true">${Array.from({ length: 40 }, (_, i) => `<i style="left:${(i * 47) % 100}%;top:${(i * 29) % 70}%;--d:${(i % 9) * 0.4}s"></i>`).join("")}</div>
        <div class="den-stage">${foxSvg(s.level, s.fur, { size: 360 })}</div>
        <div class="den-info">
          <p class="eyebrow">Your den · level ${s.level} of 9</p>
          <h1 class="den-rank">${esc(s.rank[0])}</h1>
          <p class="den-flavour">${esc(s.rank[1])}</p>
          <div class="den-xp" role="progressbar" aria-valuemin="${s.lo}" aria-valuemax="${s.hi ?? s.xp}" aria-valuenow="${s.xp}" aria-label="Experience">
            <div class="den-xp-bar"><i style="width:${(s.pct * 100).toFixed(1)}%"></i></div>
            <div class="den-xp-l"><strong>${fmt(s.xp)} XP</strong><span>${s.hi ? `${fmt(s.hi - s.xp)} to the ${["", "", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"][s.level + 1]} tail` : "Every tail grown"}</span></div>
          </div>
          <div class="den-tailrow" aria-label="${s.level} of 9 tails">${Array.from({ length: 9 }, (_, i) => `<span class="${i < s.level ? "on" : ""}" title="${RANKS[i][0]}"></span>`).join("")}</div>
        </div>
      </section>

      <div class="den-grid">
        <section class="panel den-quests">
          <div class="section-head" style="margin-bottom:12px"><h2 class="h3" style="margin:0">Today's quests</h2><span class="pill">${doneToday} / ${s.quests.length}</span></div>
          <ul>${s.quests.map((q) => `<li class="${q.done ? "done" : ""}">
            <span class="den-q-check">${q.done ? icon("check") : ""}</span>
            <span class="den-q-main"><strong>${esc(q.label)}</strong><span class="den-q-bar"><i style="width:${Math.round((q.have / q.need) * 100)}%"></i></span></span>
            <span class="den-q-n mono">${q.done ? "+20 XP" : `${q.have}/${q.need}`}</span></li>`).join("")}</ul>
          <p class="hint" style="margin:12px 0 0">Quests reset at midnight. Each one you finish is worth 20 XP.</p>
          <button class="btn btn-accent" type="button" id="den-read" style="margin-top:14px">${icon("book")} Read now</button>
        </section>

        <section class="panel den-earn">
          <h2 class="h3">Where your XP came from</h2>
          <div class="den-parts">${s.parts.map(([label, n, per]) => `<div><span>${esc(label)}</span><span class="mono muted">${fmt(n)} × ${per}</span><strong class="mono">${fmt(n * per)}</strong></div>`).join("")}</div>
        </section>
      </div>

      <section class="section">
        <div class="section-head"><div><h2 class="h2">Coats</h2><p class="lede" style="margin-top:4px">Each new tail unlocks a new coat for your fox.</p></div></div>
        <div class="den-furs">${FURS.map((f, i) => { const open = i < s.level, on = s.fur[0] === f[0];
          return `<button class="den-fur ${on ? "on" : ""}" type="button" data-fur="${f[0]}" ${open ? "" : "disabled"} aria-pressed="${on}">
            <span class="den-fur-fox">${foxSvg(open ? Math.min(s.level, 3) : 1, f, { size: 96, wisps: false, cls: open ? "" : "locked" })}</span>
            <strong>${esc(f[1])}</strong><small>${open ? (on ? "Wearing" : "Wear this") : `Level ${i + 1}`}</small></button>`; }).join("")}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2 class="h2">The nine tails</h2></div>
        <ol class="den-ladder">${RANKS.map(([name, line], i) => `<li class="${i < s.level ? "on" : ""} ${i === s.level - 1 ? "now" : ""}">
          <span class="den-l-n">${i + 1}</span><span><strong>${esc(name)}</strong><small>${esc(line)}</small></span><span class="mono muted">${fmt(LEVELS[i])} XP</span></li>`).join("")}</ol>
        <p class="hint">XP comes from the reading this device has counted: pages, minutes, reading days, finished titles, highlights and quests. <button class="link-btn" type="button" id="den-replay">Replay the level-up</button></p>
      </section>
    </div>`;
    $$("[data-fur]", view).forEach((b) => b.addEventListener("click", () => { setFur(b.dataset.fur); toast(`Your fox is wearing ${FURS.find((f) => f[0] === b.dataset.fur)[1]}.`); draw(); }));
    $("#den-read", view).onclick = async () => {
      const st = await import("../store.js"); const p = await st.allProgress();
      const it = st.lib.items.filter((i) => p[i.id] && st.progressPct(p[i.id]) < 100).sort((a, b) => (p[b.id].updated || 0) - (p[a.id].updated || 0))[0];
      if (it) (await import("./common.js")).openItem(it); else location.hash = "books/free";
    };
    $("#den-replay", view).onclick = () => celebrate(s);
  };
  await draw();
}
