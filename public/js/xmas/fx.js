// Winterfest around the app: snowfall, lights, the Snowbell chip, surprise gifts, your pet, and a small card on each page.
// Nothing here blocks clicks. It all switches off from Settings and pauses while you read.
import { esc, toast } from "../util.js";
import { lib, getItem, allProgress, progressPct, kvGet } from "../store.js";
import { isKids } from "../profiles.js";
import { loadXmas, xs, isSeason, daysToXmas, onXmas, save, earn, startEarning, activePet, petLevel, petStage, petBonus, pat, todaysQuests, giftReady, adventReady } from "./core.js";
import { petUrl, bellIcon, giftSvg } from "./art.js";

const calm = () => document.documentElement.dataset.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches;
const reading = () => !document.getElementById("reader")?.hidden || !document.getElementById("book")?.hidden;
const route = () => location.hash.slice(1).split("/")[0] || "home";
const active = () => isSeason() && xs()?.opts.on;

let snow = null;
function startSnow() {
  if (snow || calm()) return; const c = document.createElement("canvas"); c.id = "xm-snow"; c.setAttribute("aria-hidden", "true"); document.body.append(c); const g = c.getContext("2d"); let W = 0, H = 0, raf = 0, last = 0;
  const size = () => { W = c.width = innerWidth; H = c.height = innerHeight; }; size(); addEventListener("resize", size);
  const flakes = Array.from({ length: Math.min(80, Math.round(innerWidth / 16)) }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: .8 + Math.random() * 2.4, v: 18 + Math.random() * 34, p: Math.random() * 6.28 }));
  const tick = (t) => { raf = requestAnimationFrame(tick); if (t - last < 33) return; const dt = Math.min(.1, (t - last) / 1000); last = t; const hide = document.hidden || reading() || ["world", "vn"].includes(route()); c.style.display = hide ? "none" : ""; if (hide) return; g.clearRect(0, 0, W, H); g.fillStyle = document.documentElement.getAttribute("data-theme") === "light" ? "rgba(150,185,225,.7)" : "rgba(255,255,255,.72)"; for (const f of flakes) { f.y += f.v * dt; f.x += Math.sin(t / 1400 + f.p) * .35; if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; } g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); } };
  raf = requestAnimationFrame(tick); snow = () => { cancelAnimationFrame(raf); removeEventListener("resize", size); c.remove(); snow = null; };
}

function chip() {
  const s = xs(); let a = document.getElementById("xm-chip"); if (!active()) return a?.remove(); const add = document.getElementById("add-btn");
  if (!a && add) { a = document.createElement("a"); a.id = "xm-chip"; a.href = "#xmas"; add.before(a); }
  if (a) { const dot = giftReady() || adventReady() || todaysQuests().some((q) => !q.claimed && q.have >= q.need); a.innerHTML = `${bellIcon(17)}<strong>${s.bells.toLocaleString()}</strong>${dot ? "<i></i>" : ""}`; a.setAttribute("aria-label", `Winterfest: ${s.bells} Snowbells${dot ? ", something to claim" : ""}`); }
}

// ---------- the pet, who wanders along the bottom of the screen ----------
let petEl = null, petRaf = 0, petKey = "", P = { x: 90, to: 200, dir: 1, wait: 0 };
function petSync() {
  const p = activePet(), s = xs(), on = p && s.opts.pet; if (!on) { petEl?.remove(); petEl = null; cancelAnimationFrame(petRaf); petRaf = 0; return; }
  if (!petEl) { petEl = document.createElement("div"); petEl.id = "xm-pet"; petEl.setAttribute("aria-hidden", "true"); petEl.innerHTML = `<img alt=""><span></span>`; document.body.append(petEl); petKey = ""; }
  const stage = petStage(petLevel(p).level), mood = p.hunger < 28 ? "sad" : p.joy > 88 ? "love" : "happy", k = p.sp + stage + mood; if (k !== petKey) { petKey = k; petEl.querySelector("img").src = petUrl(p.sp, stage, mood); }
  if (!petRaf) { let last = performance.now(); const walk = (t) => { petRaf = requestAnimationFrame(walk); const dt = Math.min(.1, (t - last) / 1000); last = t; const hide = (reading() && !xs().opts.readers) || route() === "world" || route() === "vn"; petEl.style.display = hide ? "none" : ""; if (hide) return; const max = innerWidth - 90; if (!calm()) { if (P.wait > 0) P.wait -= dt; else { const d = P.to - P.x; if (Math.abs(d) < 3) { P.wait = 2 + Math.random() * 7; P.to = 24 + Math.random() * (max - 24); } else { P.dir = Math.sign(d); P.x += P.dir * 34 * dt; } } } P.x = Math.max(10, Math.min(max, P.x)); const bob = !calm() && P.wait <= 0 ? Math.abs(Math.sin(t / 130)) * 4 : 0; petEl.style.transform = `translate(${Math.round(P.x)}px,${-bob}px) scaleX(${P.dir < 0 ? -1 : 1})`; }; petRaf = requestAnimationFrame(walk); }
}
// The pet never sits on top of a button: a click only counts as a pat when nothing else was clicked.
function onDocClick(e) { if (!petEl || petEl.style.display === "none" || e.target.closest?.("a,button,input,select,textarea,label,[role=button],.card")) return; const r = petEl.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return; const p = activePet(); if (p && pat(p.sp)) { const h = petEl.querySelector("span"); h.textContent = "♥"; h.className = ""; void h.offsetWidth; h.className = "pop"; } }

// ---------- surprise gifts ----------
let dropT = 0;
function planDrop() { clearTimeout(dropT); if (!active() || !xs().opts.drops) return; dropT = setTimeout(spawnDrop, (150 + Math.random() * 270) * 1000); }
function spawnDrop() { const s = xs(); if (!active() || !s.opts.drops) return; const d = new Date().toISOString().slice(0, 10); if (s.day !== d) { s.day = d; s.drops = 0; } if (s.drops >= 6) return; if (document.hidden || reading() || ["world", "vn"].includes(route()) || document.querySelector(".modal")) return planDrop(); const b = document.createElement("button"); b.type = "button"; b.id = "xm-drop"; b.setAttribute("aria-label", "A surprise present. Open it for Snowbells"); b.innerHTML = giftSvg(); b.style.left = 12 + Math.random() * Math.max(10, innerWidth - 90) + "px"; document.body.append(b); const gone = setTimeout(() => { b.remove(); planDrop(); }, 14000); b.onclick = () => { clearTimeout(gone); s.drops++; const got = earn(10 + Math.floor(Math.random() * 21)); b.remove(); toast(`A present! +${got} Snowbells`); document.dispatchEvent(new Event("kitsune:done")); planDrop(); }; }

// ---------- a card for each part of the app ----------
const READS = [["orig-the-snow-postman", "The Snow Postman"], ["orig-winter-post", "Winter Post"], ["orig-the-last-sleigh", "The Last Sleigh to Hollow Pine"], ["gb-46", "A Christmas Carol"], ["gb-1597", "Andersen's Fairy Tales"]];
async function stripFor(name) {
  const s = xs(), d = daysToXmas(), q = todaysQuests().find((x) => !x.claimed), left = d > 0 ? `${d} ${d === 1 ? "day" : "days"} to Christmas` : d === 0 ? "Merry Christmas!" : "Winterfest";
  const pet = activePet(), goal = q ? `Today: ${q.label} (${q.have}/${q.need})` : "All of today's quests are done";
  if (name === "home") return [`<strong>Winterfest</strong> ${esc(left)}`, giftReady() ? "Your daily gift is waiting" : goal, ["Open Winterfest", "#xmas"]];
  if (name === "library") { const P = await allProgress(), pool = lib.items.filter((i) => ["book", "manga"].includes(i.type) && !(isKids() && i.mature) && progressPct(P[i.id]) === 0); return [`<strong>Secret Santa</strong>`, pool.length ? "One unread title from your shelf, wrapped. No peeking." : "Add something unread and it'll get wrapped.", pool.length ? ["Unwrap it", "santa"] : ["Find a book", "#books"]]; }
  if (name === "books") return [`<strong>Winter reads</strong>`, READS.map((r) => esc(r[1])).slice(0, 4).join(" · "), ["See the list", "reads"]];
  if (name === "den") return [`<strong>${pet ? esc(pet.name) + " came to visit" : "Your den feels empty"}</strong>`, pet ? `Level ${petLevel(pet).level}. It's earning you +${petBonus()}% Snowbells.` : "Hatch a Winterfest pet to keep your fox company.", ["See pets", "#xmas/pets"]];
  if (name === "stats") return [`<strong>This Winterfest</strong>`, `${Math.floor(s.tot.pages || 0).toLocaleString()} pages · ${Math.floor(s.tot.mins || 0).toLocaleString()} minutes · ${s.earned.toLocaleString()} Snowbells earned`, ["Season goals", "#xmas/quests"]];
  if (name === "story") return [`<strong>New for Winterfest</strong>`, "The Midwinter Parcel, a story game with five endings.", ["Play it", "#story/the-midwinter-parcel"]];
  if (name === "vn") return [`<strong>New for Winterfest</strong>`, "The Last Sleigh to Hollow Pine, playable as a visual novel.", ["Play it", "#vn/orig-the-last-sleigh"]];
  if (["discover", "comics", "tools", "shrine", "atlas", "notebook", "feeds", "wiki", "lore", "find", "create", "link"].includes(name)) return [`<strong>Winterfest</strong> ${esc(left)}`, goal, ["Quests", "#xmas/quests"]];
  return null;
}
async function santa() { const { modal } = await import("../util.js"), P = await allProgress(), pool = lib.items.filter((i) => ["book", "manga"].includes(i.type) && !(isKids() && i.mature) && progressPct(P[i.id]) === 0); if (!pool.length) return; const it = pool[Math.floor(Math.random() * pool.length)], m = modal({ title: "Your Secret Santa", body: `<div class="xm-santa"><button type="button" id="xm-unw" aria-label="Unwrap">${giftSvg()}</button><p class="muted">Click to unwrap.</p></div>` }); m.root.querySelector("#xm-unw").onclick = async () => { const box = m.root.querySelector(".xm-santa"), { coverHtml } = await import("../util.js"), { coverSrc } = await import("../store.js"); box.innerHTML = `<div style="width:150px">${coverHtml(coverSrc(it), it.title)}</div><strong>${esc(it.title)}</strong><button class="btn btn-accent" type="button" id="xm-rd">Read it</button>`; box.querySelector("#xm-rd").onclick = async () => { m.close(); (await import("../views/common.js")).openItem(getItem(it.id)); }; }; }
async function reads() { const { modal } = await import("../util.js"), O = await import("../originals.js"); const m = modal({ title: "Winter reads", body: `<div class="xm-reads">${READS.map((r) => `<button class="btn" type="button" data-r="${r[0]}">${esc(r[1])}</button>`).join("")}</div>` }); m.root.querySelectorAll("[data-r]").forEach((b) => (b.onclick = async () => { b.disabled = true; const id = b.dataset.r; let it = getItem(id); try { if (!it && id.startsWith("gb-")) it = await O.addClassic(+id.slice(3), b.textContent); else if (!it) it = await O.addOriginal(O.ORIGINALS.find((o) => o.id === id)); m.close(); (await import("../views/common.js")).openItem(it); } catch { b.disabled = false; toast("That book couldn't be opened. Check your connection."); } })); }

let stripSeq = 0, stripObs = null;
export async function decorate(name) {
  const view = document.getElementById("view"), seq = ++stripSeq; stripObs?.disconnect(); stripObs = null; view?.querySelector(":scope > .xm-strip")?.remove(); const s = xs();
  if (!s || !active() || !s.opts.strips || s.hideStrip === s.day) return;
  const data = await stripFor(name); if (!data || seq !== stripSeq) return; const [a, b, [label, to]] = data, el = document.createElement("aside"); el.className = "xm-strip"; el.setAttribute("aria-label", "Winterfest"); el.innerHTML = `${bellIcon(22)}<div>${a}<span>${b}</span></div>${to.startsWith("#") ? `<a class="btn btn-sm" href="${to}">${esc(label)}</a>` : `<button class="btn btn-sm" type="button" data-a="${to}">${esc(label)}</button>`}<button class="xm-x" type="button" aria-label="Hide Winterfest cards for today">×</button>`;
  el.querySelector("[data-a]")?.addEventListener("click", () => (to === "santa" ? santa() : reads()));
  el.querySelector(".xm-x").onclick = () => { s.hideStrip = s.day; save(); stripObs?.disconnect(); el.remove(); };
  const put = () => { if (!view.contains(el)) view.prepend(el); }; put(); stripObs = new MutationObserver(put); stripObs.observe(view, { childList: true });
}

export function applyXmas() {
  const s = xs(); if (!s) return; const on = active();
  document.documentElement.classList.toggle("xm-on", !!on); document.documentElement.classList.toggle("xm-lights", !!(on && s.opts.lights));
  if (on && s.opts.snow) startSnow(); else snow?.();
  chip(); petSync(); clearTimeout(dropT); planDrop(); decorate(route());
}
export async function startXmas() {
  await loadXmas(); startEarning(); applyXmas();
  let t = 0; onXmas(() => { clearTimeout(t); t = setTimeout(() => { chip(); petSync(); }, 60); });
  document.addEventListener("click", onDocClick);
  document.addEventListener("xmas:bell", (e) => { if (reading()) toast(`+${e.detail} Snowbells for reading`, { ms: 1800 }); });
}
