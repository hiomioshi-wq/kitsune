// "Now reading": a small floating pill with your latest unfinished book, so it's one tap away from any page.
// Hidden on Home (the hero already shows it), while a reader or the audio player is open, and for the rest
// of the session once you dismiss it for that book.
import { lib, allProgress, progressPct, coverSrc, getItem } from "./store.js";
import { esc, icon } from "./util.js";

const HIDDEN = "kitsune.nowPill.hidden";
let pill = null, shownId = "";

function hide() {
  if (!pill || pill.hidden) return;
  pill.classList.remove("in");
  setTimeout(() => { if (!pill.classList.contains("in")) pill.hidden = true; }, 260);
  shownId = "";
}

async function onClick(e) {
  if (e.target.closest(".now-x")) {
    try { sessionStorage.setItem(HIDDEN, shownId); } catch {}
    hide();
    return;
  }
  const open = e.target.closest(".now-open");
  if (open) {
    const item = getItem(open.dataset.id);
    if (!item) return hide();
    const { openItem } = await import("./views/common.js");
    hide();
    openItem(item);
  }
}

export async function updateNowPill() {
  if (!pill) {
    pill = document.createElement("div");
    pill.className = "now-pill";
    pill.hidden = true;
    pill.setAttribute("role", "region");
    pill.setAttribute("aria-label", "Now reading");
    pill.addEventListener("click", onClick);
    document.body.append(pill);
  }
  const page = (location.hash.slice(1) || "home").split("/")[0];
  const readerOpen = ["book", "reader"].some((id) => { const el = document.getElementById(id); return el && !el.hidden; });
  const playerOn = !!document.querySelector(".player:not([hidden])");
  if (page === "home" || readerOpen || playerOn) return hide();

  const prog = await allProgress();
  const item = lib.items
    .filter((i) => { const p = prog[i.id]; return p && p.pos > 0 && progressPct(p) < 100 && i.status !== "completed"; })
    .sort((a, b) => (prog[b.id].updated || 0) - (prog[a.id].updated || 0))[0];
  let dismissed = "";
  try { dismissed = sessionStorage.getItem(HIDDEN) || ""; } catch {}
  if (!item || dismissed === item.id) return hide();
  if (shownId === item.id && !pill.hidden) return;

  const pct = progressPct(prog[item.id]);
  const src = coverSrc(item);
  pill.innerHTML = `<button class="now-open" type="button" data-id="${esc(item.id)}" aria-label="Continue reading ${esc(item.title)}">
      <span class="now-cov">${src ? `<img src="${esc(src)}" alt="" onerror="this.remove()">` : ""}</span>
      <span class="now-t"><small>${pct < 1 ? "Just started" : `Continue · ${pct}%`}</small><strong>${esc(item.title)}</strong></span>
      <span class="now-ring" style="--p:${pct}" aria-hidden="true">${icon("play")}</span>
    </button>
    <button class="now-x" type="button" aria-label="Hide for now">${icon("x")}</button>`;
  shownId = item.id;
  pill.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.add("in")));
}
