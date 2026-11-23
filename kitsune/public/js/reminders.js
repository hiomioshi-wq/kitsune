// Reading reminders. A web app can't wake itself up when it's closed, so there are two parts:
// a calendar event (works on every device, even with Kitsune closed) and a gentle nudge while Kitsune is open.
import { $, $$, esc, icon, toast, today } from "./util.js";
import { settings, saveSettings, kvGet } from "./store.js";

const DAYS = [["MO", "Mon"], ["TU", "Tue"], ["WE", "Wed"], ["TH", "Thu"], ["FR", "Fri"], ["SA", "Sat"], ["SU", "Sun"]];
const cfg = () => ({ on: false, time: "21:00", days: DAYS.map((d) => d[0]), ...(settings.reminder || {}) });

export function reminderPanelHtml() {
  const r = cfg();
  return `<div class="panel" id="reminder"><h3 class="h3">Reading reminder</h3>
    <div class="setting"><div><strong>Remind me to read</strong><p>Kitsune nudges you at this time if you haven't read yet that day, whenever it's open. To be reminded with Kitsune closed, add the reminder to your calendar too.</p></div>
      <input type="checkbox" id="rm-on" ${r.on ? "checked" : ""} style="accent-color:var(--accent);width:20px;height:20px"></div>
    <div class="setting"><div><strong>Time</strong></div><input class="field" type="time" id="rm-time" value="${esc(r.time)}" style="width:auto"></div>
    <div class="setting"><div><strong>Days</strong></div><div class="seg" id="rm-days">${DAYS.map(([k, l]) => `<button type="button" data-d="${k}" aria-pressed="${r.days.includes(k)}">${l}</button>`).join("")}</div></div>
    <div class="setting"><div><strong>Add to your calendar</strong><p>A repeating event with an alert, for Apple Calendar, Google Calendar, Outlook and others. It works even when Kitsune is closed.</p></div>
      <button class="btn" type="button" id="rm-ics">${icon("download")}Download calendar event</button></div>
  </div>`;
}

export function wireReminderPanel(view, rerender) {
  const save = (patch) => { settings.reminder = { ...cfg(), ...patch }; saveSettings(); };
  $("#rm-on", view)?.addEventListener("change", async (e) => {
    save({ on: e.target.checked });
    if (e.target.checked && "Notification" in window && Notification.permission === "default") { try { await Notification.requestPermission(); } catch {} }
    toast(e.target.checked ? `Reminder on for ${cfg().time}.` : "Reminder off.");
  });
  $("#rm-time", view)?.addEventListener("change", (e) => save({ time: e.target.value || "21:00" }));
  $("#rm-days", view)?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]"); if (!b) return;
    const days = new Set(cfg().days);
    days.has(b.dataset.d) ? days.delete(b.dataset.d) : days.add(b.dataset.d);
    if (!days.size) return toast("Pick at least one day.");
    save({ days: DAYS.map((d) => d[0]).filter((d) => days.has(d)) });
    $$("#rm-days button", view).forEach((x) => x.setAttribute("aria-pressed", String(days.has(x.dataset.d))));
  });
  $("#rm-ics", view)?.addEventListener("click", downloadIcs);
  void rerender;
}

export function downloadIcs() {
  const r = cfg(), [hh, mm] = r.time.split(":").map(Number);
  const start = new Date(); start.setHours(hh, mm, 0, 0);
  if (start < new Date()) start.setDate(start.getDate() + 1);
  const p = (n) => String(n).padStart(2, "0");
  const local = (d) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
  const end = new Date(start.getTime() + 20 * 60_000);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kitsune//Reading reminder//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:kitsune-reading-${Date.now()}@kitsune`, `DTSTAMP:${stamp}`,
    `DTSTART:${local(start)}`, `DTEND:${local(end)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${r.days.join(",")}`,
    "SUMMARY:Read for a bit 🦊", "DESCRIPTION:Your reading time. Open Kitsune and pick up where you left off.",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Time to read", "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "kitsune-reading-reminder.ics";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
  toast("Open the downloaded file to add the reminder to your calendar.");
}

// While Kitsune is open: once a day, at or after the reminder time, if nothing has been read yet today.
let timer = 0;
export function startReminders() {
  clearInterval(timer);
  const check = async () => {
    const r = cfg();
    if (!r.on || document.hidden) return;
    const now = new Date(), day = DAYS[(now.getDay() + 6) % 7][0];
    if (!r.days.includes(day)) return;
    const [hh, mm] = r.time.split(":").map(Number);
    if (now.getHours() * 60 + now.getMinutes() < hh * 60 + mm) return;
    if (localStorage.getItem("kitsune.reminded") === today()) return;
    const d = (await kvGet("stats", { days: {} })).days?.[today()];
    if (d && (d.pages || d.secs > 60 || d.listen > 60)) return;
    try { localStorage.setItem("kitsune.reminded", today()); } catch {}
    const msg = "Time to read. Even ten minutes keeps your streak and your fox happy.";
    if ("Notification" in window && Notification.permission === "granted" && !document.hasFocus()) {
      try { const n = new Notification("Kitsune", { body: msg, icon: "/icon.svg", tag: "kitsune-reminder" }); n.onclick = () => { focus(); n.close(); }; return; } catch {}
    }
    toast(msg, { action: "Read now", ms: 12000, onAction: async () => {
      const st = await import("./store.js"), p = await st.allProgress();
      const it = st.lib.items.filter((i) => p[i.id] && st.progressPct(p[i.id]) < 100).sort((a, b) => (p[b.id].updated || 0) - (p[a.id].updated || 0))[0];
      if (it) (await import("./views/common.js")).openItem(it); else location.hash = "books/free";
    } });
  };
  check();
  timer = setInterval(check, 60_000);
}
