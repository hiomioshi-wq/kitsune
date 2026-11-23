// Privacy: incognito reading (nothing you open is recorded) and an app lock with a PIN.
// The lock keeps casual eyes out of your library; it doesn't encrypt what's stored in the browser.
import { $, esc, icon, toast } from "./util.js";
import { settings, saveSettings } from "./store.js";

// ---------- incognito ----------
export const isIncognito = () => !!settings.incognito;
export function setIncognito(on) {
  settings.incognito = !!on;
  saveSettings();
  syncIncognitoUi();
  toast(on ? "Incognito on. Positions, stats, history and the Den won't record anything until you turn it off." : "Incognito off. Reading is recorded again.");
}
export function syncIncognitoUi() {
  document.documentElement.classList.toggle("incognito", isIncognito());
  let pill = $("#incog-pill");
  if (isIncognito() && !pill) {
    pill = document.createElement("button");
    pill.id = "incog-pill"; pill.type = "button"; pill.className = "incog-pill";
    pill.innerHTML = `${icon("moon")}<span>Incognito</span>`;
    pill.title = "Incognito is on: nothing is being recorded. Click to turn it off.";
    pill.onclick = () => setIncognito(false);
    $("#crumbs")?.after(pill);
  } else if (!isIncognito()) pill?.remove();
}

// ---------- app lock ----------
const KEY = "kitsune.lock"; // shared by every profile, so the lock comes up before anything loads
const readLock = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } };
const writeLock = (v) => { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch {} };
export const lockInfo = () => readLock();

async function hashPin(pin, salt) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pin));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function setLock(pin, after = 5) {
  const salt = crypto.getRandomValues(new Uint32Array(4)).join("-");
  writeLock({ salt, hash: await hashPin(pin, salt), after });
}
export function setLockAfter(after) { const l = readLock(); if (l) writeLock({ ...l, after }); }
export async function checkPin(pin) { const l = readLock(); return !!l && (await hashPin(pin, l.salt)) === l.hash; }
export async function removeLock(pin) { if (!(await checkPin(pin))) return false; writeLock(null); return true; }

let hiddenAt = 0;
export function startLock() {
  if (readLock()) showLock();
  document.addEventListener("visibilitychange", () => {
    const l = readLock();
    if (!l) return;
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt >= (l.after ?? 5) * 60_000) showLock();
  });
}
export function lockNow() { if (readLock()) showLock(); else toast("Set a PIN in Settings → Privacy first."); }

export function showLock() {
  if ($("#app-lock")) return;
  const el = document.createElement("div");
  el.id = "app-lock"; el.className = "app-lock";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "lock-h");
  el.innerHTML = `<form class="lock-card" autocomplete="off">
      <svg class="lock-fox" aria-hidden="true"><use href="#fox"/></svg>
      <h2 id="lock-h">Kitsune is locked</h2>
      <p class="lock-sub">Enter your PIN to open your library.</p>
      <div class="lock-dots" aria-hidden="true"></div>
      <input class="lock-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12" aria-label="PIN" autocomplete="off">
      <div class="lock-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k) => k === "" ? `<span></span>` : `<button type="button" data-k="${k}" aria-label="${k === "⌫" ? "Delete" : k}">${k}</button>`).join("")}</div>
      <button class="btn btn-accent lock-go" type="submit">Unlock</button>
      <p class="lock-err" role="alert"></p>
      <p class="lock-hint">Forgot it? Clearing this site's data in your browser removes the lock, along with your library on this device.</p>
    </form>`;
  document.body.appendChild(el);
  document.documentElement.classList.add("locked");
  const input = $(".lock-input", el), dots = $(".lock-dots", el), err = $(".lock-err", el);
  const paint = () => { dots.innerHTML = Array.from({ length: Math.max(4, input.value.length) }, (_, i) => `<i class="${i < input.value.length ? "on" : ""}"></i>`).join(""); };
  let tries = 0, waitUntil = 0;
  const attempt = async () => {
    if (Date.now() < waitUntil) { err.textContent = `Too many tries. Wait ${Math.ceil((waitUntil - Date.now()) / 1000)} seconds.`; return; }
    if (!input.value) return;
    if (await checkPin(input.value)) {
      el.classList.add("opening");
      document.documentElement.classList.remove("locked");
      setTimeout(() => el.remove(), 380);
      return;
    }
    tries++;
    if (tries >= 5) { waitUntil = Date.now() + 30_000; tries = 0; }
    err.textContent = "That PIN isn't right.";
    el.querySelector(".lock-card").classList.remove("shake"); void el.offsetWidth; el.querySelector(".lock-card").classList.add("shake");
    input.value = ""; paint(); input.focus();
  };
  $(".lock-pad", el).onclick = (e) => {
    const b = e.target.closest("[data-k]"); if (!b) return;
    if (b.dataset.k === "⌫") input.value = input.value.slice(0, -1); else if (input.value.length < 12) input.value += b.dataset.k;
    paint(); err.textContent = "";
    input.focus({ preventScroll: true });
  };
  input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, ""); paint(); err.textContent = ""; });
  el.querySelector("form").onsubmit = (e) => { e.preventDefault(); attempt(); };
  // Keep keyboard shortcuts from reaching the app (or an open reader) behind the lock. Digits typed while
  // focus has wandered off still go to the PIN.
  const guard = (e) => {
    if (!el.isConnected) return removeEventListener("keydown", guard, true);
    if (el.contains(e.target)) { if (e.key !== "Tab" && e.key !== "Enter") e.stopPropagation(); return; }
    e.stopImmediatePropagation(); e.preventDefault();
    if (/^\d$/.test(e.key) && input.value.length < 12) { input.value += e.key; paint(); }
    input.focus({ preventScroll: true });
  };
  addEventListener("keydown", guard, true);
  paint();
  setTimeout(() => input.focus(), 50);
}

// Settings panel markup and wiring.
export function privacyPanelHtml() {
  const l = readLock();
  return `<div class="panel" id="privacy"><h3 class="h3">Privacy</h3>
    <div class="setting"><div><strong>Incognito reading</strong><p>While it's on, nothing you open or read is recorded: no reading positions, stats, history, streaks or Den XP. A badge at the top shows it's on.</p></div>
      <input type="checkbox" id="pv-incog" ${isIncognito() ? "checked" : ""} style="accent-color:var(--accent);width:20px;height:20px"></div>
    <div class="setting"><div><strong>App lock</strong><p>${l ? `On. Kitsune asks for your PIN when it opens${l.after ? ` and after ${l.after} minutes away` : " and whenever you come back to it"}.` : "Ask for a PIN when Kitsune opens. It keeps casual eyes out; it doesn't encrypt your library."}</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${l ? `<button class="btn" type="button" id="pv-locknow">Lock now</button><button class="btn" type="button" id="pv-unlock">Turn off</button>` : `<button class="btn btn-accent" type="button" id="pv-setlock">Set a PIN</button>`}</div></div>
    ${l ? `<div class="setting"><div><strong>Lock again after</strong><p>Time away from Kitsune before it asks again.</p></div>
      <div class="seg" id="pv-after">${[[0, "Right away"], [1, "1 min"], [5, "5 min"], [15, "15 min"], [60, "1 hour"]].map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${(l.after ?? 5) === v}">${t}</button>`).join("")}</div></div>` : ""}
  </div>`;
}
export function wirePrivacyPanel(view, rerender) {
  $("#pv-incog", view)?.addEventListener("change", (e) => setIncognito(e.target.checked));
  $("#pv-locknow", view)?.addEventListener("click", showLock);
  $("#pv-after", view)?.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) return; setLockAfter(Number(b.dataset.v)); rerender(); });
  $("#pv-setlock", view)?.addEventListener("click", () => pinDialog("Set a PIN", "4 to 12 digits. You'll need it every time Kitsune opens.", true, async (pin) => { await setLock(pin, 5); toast("App lock is on."); rerender(); return true; }));
  $("#pv-unlock", view)?.addEventListener("click", () => pinDialog("Turn off the app lock", "Enter your current PIN.", false, async (pin) => { if (await removeLock(pin)) { toast("App lock is off."); rerender(); return true; } return "That PIN isn't right."; }));
}
async function pinDialog(title, text, confirmTwice, onPin) {
  const { modal } = await import("./util.js");
  const m = modal({ title, body: `<form class="form" id="pin-set"><p class="muted" style="margin:0">${esc(text)}</p>
      <input class="field" id="pin-a" type="password" inputmode="numeric" maxlength="12" autocomplete="new-password" aria-label="PIN" style="font:600 22px var(--f-mono);letter-spacing:.3em;text-align:center" required>
      ${confirmTwice ? `<input class="field" id="pin-b" type="password" inputmode="numeric" maxlength="12" autocomplete="new-password" aria-label="Repeat the PIN" placeholder="Repeat it" style="font:600 22px var(--f-mono);letter-spacing:.3em;text-align:center" required>` : ""}
      <p class="status" id="pin-s"></p></form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="pin-set">${confirmTwice ? "Turn on" : "Turn off"}</button>` });
  $("#pin-set", m.root).onsubmit = async (e) => {
    e.preventDefault();
    const a = $("#pin-a", m.root).value, s = $("#pin-s", m.root);
    const fail = (t) => { s.className = "status err"; s.textContent = t; };
    if (!/^\d{4,12}$/.test(a)) return fail("Use 4 to 12 digits.");
    if (confirmTwice && a !== $("#pin-b", m.root).value) return fail("The two PINs don't match.");
    const r = await onPin(a);
    if (r === true) m.close(); else fail(r || "That didn't work.");
  };
}
