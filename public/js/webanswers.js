// Kitsune Browser, v144: more instant answers in the address bar, from open services that allow direct requests:
// weather and local time for any place (Open-Meteo), currency conversion (Frankfurter, European Central Bank rates),
// plus small utilities that need no network (dice, coin, random number, UUID, today's date, days until a date,
// Morse code, Roman numerals, SHA-256, ROT13, HTTP status reasons, cron schedules and colour notations).
const jget = async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error(r.status); return r.json(); };
const CUR = /^(usd|eur|gbp|jpy|cad|aud|chf|cny|inr|krw|mxn|brl|sek|nok|dkk|pln|czk|huf|try|nzd|sgd|hkd|zar|ils|thb|idr|myr|php|ron|bgn|isk)$/i;
const WMO = { 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Freezing fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Violent showers", 95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail" };
const place = async (name) => { const j = await jget(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`); const p = j.results?.[0]; if (!p) throw new Error("no place"); return p; };
const where = (p) => [p.name, p.admin1 && p.admin1 !== p.name ? p.admin1 : "", p.country].filter(Boolean).join(", ");
const MORSE = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----." };
const UNMORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
const ROMAN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
const HTTP = { 100: ["Continue", "The server got the first byte and wants the rest."], 101: ["Switching Protocols", "The connection is about to become something else."], 200: ["OK", "Everything went through."], 201: ["Created", "The server made something new."], 204: ["No Content", "Fine, but nothing to show for it."], 206: ["Partial Content", "Half the file, as asked."], 301: ["Moved Permanently", "The page lives somewhere else now."], 302: ["Found", "A temporary detour."], 304: ["Not Modified", "Nothing new since your last visit."], 307: ["Temporary Redirect", "Come back later; it may move again."], 308: ["Permanent Redirect", "The old address is retired."], 400: ["Bad Request", "The server couldn't read what you sent."], 401: ["Unauthorized", "You'd need to sign in for this."], 403: ["Forbidden", "The answer is no."], 404: ["Not Found", "Nobody lives here."], 405: ["Method Not Allowed", "You can't do that to this page."], 406: ["Not Acceptable", "You asked for a shape it can't take."], 408: ["Request Timeout", "It took too long to answer the door."], 409: ["Conflict", "Two things wanted the same spot."], 410: ["Gone", "It was here. It isn't anymore."], 418: ["I'm a teapot", "Short and stout. This is the handle, this is the spout."], 422: ["Unprocessable Content", "Well formed, but it makes no sense."], 429: ["Too Many Requests", "Slow down."], 451: ["Unavailable For Legal Reasons", "Someone with a briefcase said no."], 500: ["Internal Server Error", "Something broke on their side."], 501: ["Not Implemented", "It says no, and means it."], 502: ["Bad Gateway", "Two servers failed to pass the parcel."], 503: ["Service Unavailable", "Come back later."], 504: ["Gateway Timeout", "The parcel never arrived."], 511: ["Network Authentication Required", "Sign into the network first."] };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], DOWS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const cronField = (v, unit, name) => v === "*" ? "" : v.startsWith("*/") ? `every ${+v.slice(2)} ${unit}s` : v.includes("-") ? `${unit}s ${v.replace(/(\d+)-(\d+)/, (_, a, b) => name ? `${name(+a)} through ${name(+b)}` : `${a} through ${b}`)}` : `${unit} ${name ? name(+v) : v}`;
const cronLine = (v, unit) => v.split(",").map((x) => cronField(x.trim(), unit, unit === "month" ? (n) => MONTHS[n - 1] : unit === "day" || unit === "weekday" ? (n) => DOWS[n % 7] : null)).filter(Boolean).join(" and ");
const hex2hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = Math.round(h * 60); const l = (mx + mn) / 2; const s = d ? Math.round(d / (1 - Math.abs(2 * l - 1)) * 100) : 0; return [h, s, Math.round(l * 100)]; };

export async function answer(q) {
  const t = q.trim(), low = t.toLowerCase();
  let m;
  // weather
  if ((m = low.match(/^(?:weather|forecast|temperature)\s+(?:in\s+|for\s+)?(.{2,40})$/) || low.match(/^(.{2,40})\s+(?:weather|forecast)$/))) {
    const p = await place(m[1]), w = (await jget(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`)), c = w.current;
    const f = (x) => Math.round((x * 9) / 5 + 32);
    return { kind: "Weather · " + where(p), value: `${Math.round(c.temperature_2m)}°C / ${f(c.temperature_2m)}°F · ${WMO[c.weather_code] || ""}`, detail: `Feels like ${Math.round(c.apparent_temperature)}°C · wind ${Math.round(c.wind_speed_10m)} km/h · humidity ${c.relative_humidity_2m}% · today ${Math.round(w.daily.temperature_2m_min[0])}° to ${Math.round(w.daily.temperature_2m_max[0])}°C` };
  }
  // local time
  if ((m = low.match(/^(?:time|what time is it|current time)\s+(?:in\s+)?(.{2,40})$/) || low.match(/^(.{2,40})\s+(?:time|local time)$/))) {
    const p = await place(m[1]); if (!p.timezone) return null;
    const now = new Date(), fmt = (o) => new Intl.DateTimeFormat(undefined, { timeZone: p.timezone, ...o }).format(now);
    return { kind: "Time · " + where(p), value: fmt({ hour: "numeric", minute: "2-digit", hour12: undefined }), detail: `${fmt({ weekday: "long", month: "long", day: "numeric" })} · ${p.timezone}` };
  }
  // currency: "100 usd to eur", "usd eur", "50 yen in dollars"
  if ((m = low.match(/^([\d.,]+)?\s*([a-z]{3})\s+(?:to|in|into|->)\s+([a-z]{3})$/)) && CUR.test(m[2]) && CUR.test(m[3])) {
    const n = m[1] ? parseFloat(m[1].replace(/,/g, "")) : 1, a = m[2].toUpperCase(), b = m[3].toUpperCase();
    if (a === b) return null;
    const j = await jget(`https://api.frankfurter.dev/v1/latest?base=${a}&symbols=${b}`), r = j.rates?.[b]; if (!r) return null;
    return { kind: "Currency", value: `${(n * r).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${b}`, detail: `${n.toLocaleString()} ${a} · rate ${r} · European Central Bank, ${j.date}` };
  }
  // dice, coin, random
  if ((m = low.match(/^(?:roll\s+)?(\d{1,2})?d(\d{1,3})(?:\s*\+\s*(\d+))?$/)) && (+m[2] >= 2)) { const n = +(m[1] || 1), rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * +m[2])), sum = rolls.reduce((a, b) => a + b, 0) + +(m[3] || 0); return { kind: "Dice", value: String(sum), detail: `${rolls.join(" + ")}${m[3] ? " + " + m[3] : ""}` }; }
  if (/^(flip (a )?coin|coin flip|heads or tails)$/.test(low)) return { kind: "Coin", value: Math.random() < 0.5 ? "Heads" : "Tails", detail: "Search again to flip again" };
  if ((m = low.match(/^random(?: number)?(?: between)?\s+(-?\d+)\s*(?:and|to|-)\s*(-?\d+)$/))) { const a = Math.min(+m[1], +m[2]), b = Math.max(+m[1], +m[2]); return { kind: "Random number", value: String(a + Math.floor(Math.random() * (b - a + 1))), detail: `Between ${a} and ${b}` }; }
  if (/^(uuid|guid|random uuid)$/.test(low)) return { kind: "UUID", value: crypto.randomUUID(), detail: "Version 4, made on this device" };
  // dates
  if (/^(today|today'?s date|what'?s the date|date)$/.test(low)) return { kind: "Date", value: new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }), detail: `Week ${Math.ceil(((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 864e5 + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)} of the year` };
  if ((m = low.match(/^(?:days? (?:until|to|till)|countdown to)\s+(.{4,30})$/))) { const iso = m[1].match(/^(\d{4})-(\d{2})-(\d{2})$/), d = iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : new Date(m[1]); if (isNaN(d)) return null; const n = Math.ceil((d - new Date()) / 864e5); return { kind: "Countdown", value: n >= 0 ? `${n} day${n === 1 ? "" : "s"} to go` : `${-n} day${n === -1 ? "" : "s"} ago`, detail: d.toLocaleDateString(undefined, { dateStyle: "full" }) }; }
  // timezone conversion: "3pm london to tokyo"
  if ((m = low.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+(.{2,25}?)\s+(?:to|in)\s+(.{2,25})$/)) && !/^\d/.test(m[4])) {
    const [a, b] = await Promise.all([place(m[4]), place(m[5])]); if (!a.timezone || !b.timezone) return null;
    let h = +m[1] % 12 + (m[3] === "pm" ? 12 : 0); if (!m[3]) h = +m[1]; const mi = +(m[2] || 0), today = new Date().toISOString().slice(0, 10);
    // find the instant whose wall-clock time in zone A is h:mi today
    const wall = (tz, ts) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ts);
    let ts = Date.parse(`${today}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00Z`); for (let k = 0; k < 3; k++) { const [wh, wm] = wall(a.timezone, ts).split(":").map(Number); ts -= ((wh - h) * 60 + (wm - mi)) * 60000; }
    return { kind: "Time zones", value: `${wall(b.timezone, ts)} in ${b.name}`, detail: `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")} in ${a.name} (${a.timezone} → ${b.timezone})` };
  }
  // morse: "morse fox" encodes, "unmorse .. --- -.." decodes
  if ((m = low.match(/^morse\s+([a-z0-9 ]+)$/))) { const enc = m[1].replace(/\s+/g, " / ").split("").map((c) => c === " " ? "/" : MORSE[c]).join(" "); return enc ? { kind: "Morse", value: enc, detail: `${m[1].trim().length} letters · "/" separates words` } : null; }
  if ((m = low.match(/^(?:unmorse|morse decode|morse\s+)\s*((?:[.\-\/]+\s*)+)$/)) && /[.\-]/.test(m[1])) { const dec = m[1].trim().split(/\s*\/\s*/).map((w) => w.split(/\s+/).filter(Boolean).map((c) => UNMORSE[c] || "").join("")).join(" ").trim(); return dec ? { kind: "Morse", value: dec, detail: "Decoded on this device" } : null; }
  // roman numerals both ways
  if ((m = low.match(/^roman\s+(\d{1,4})$/)) && +m[1] > 0 && +m[1] < 4000) { let n = +m[1], r = ""; for (const [v, s] of ROMAN) while (n >= v) { r += s; n -= v; } return { kind: "Roman numerals", value: r, detail: `${m[1]} in numerals` }; }
  if ((m = low.match(/^roman\s+([mdclxvi]+)$/i)) && /^m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/i.test(m[1])) { const V = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 }; let n = 0; const s = m[1].toLowerCase(); for (let i = 0; i < s.length; i++) n += V[s[i]] < V[s[i + 1]] ? -V[s[i]] : V[s[i]]; return { kind: "Roman numerals", value: String(n), detail: `${m[1].toUpperCase()} in numbers` }; }
  // sha-256
  if ((m = low.match(/^sha-?256\s+(.{1,200})$/))) { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(m[1])); return { kind: "SHA-256", value: [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join(""), detail: `Hashed on this device · input was ${m[1].length} characters` }; }
  // rot13
  if ((m = low.match(/^rot-?13\s+(.{1,200})$/))) return { kind: "ROT13", value: m[1].replace(/[a-z]/gi, (c) => String.fromCharCode((c.charCodeAt(0) <= 90 ? 65 : 97) + ((c.toLowerCase().charCodeAt(0) - 84) % 26))), detail: "A becomes N, and back again" };
  // http status
  if ((m = low.match(/^(?:http|status(?: code)?)\s+(\d{3})$/))) { const h = HTTP[+m[1]]; return h ? { kind: `HTTP ${m[1]}`, value: h[0], detail: h[1] } : { kind: `HTTP ${m[1]}`, value: "Not one of the standard codes", detail: "Try a well-known one, like 404 or 418" }; }
  // cron
  if ((m = low.match(/^cron\s+((?:[\d*,LW#\/\-]+\s+){4}[\d*,LW#\/\-]+)$/))) { const f = m[1].split(/\s+/); const at = (h, mi) => { const pm = h >= 12 && h < 24; return `${String(h % 12 || 12).padStart(2, "0")}:${String(mi).padStart(2, "0")} ${pm ? "PM" : "AM"}`; }; const bits = [];
    if (f[1] !== "*") { const mis = f[0] === "*" ? [0] : f[0].split(",").map((x) => x === "0" ? 0 : +x || 0); bits.push(`At ${f[1].split(",").flatMap((h) => mis.map((mi) => at(+h, mi))).join(", ")}`); }
    else if (f[0] !== "*") bits.push(f[0].startsWith("*/") ? `Every ${+f[0].slice(2)} minutes` : `At minute ${f[0]} of every hour`);
    if (f[2] !== "*") bits.push(`On day ${f[2]} of the month`);
    if (f[3] !== "*") bits.push(`In ${cronLine(f[3], "month")}`);
    if (f[4] !== "*") bits.push(`On ${cronLine(f[4], "weekday")}`);
    return { kind: "Cron schedule", value: bits.join(", ") || "Every minute, always", detail: `${f.join(" ")}${bits.length ? "" : " · all fields are *"}` }; }
  // colour: "#ff7a59" or "rgb 255 122 89"
  if ((m = low.match(/^#?([0-9a-f]{6})$/)) && q.trim().startsWith("#")) { const n = parseInt(m[1], 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255, [h, s2, l] = hex2hsl(r, g, b); return { kind: "Colour", value: `rgb(${r}, ${g}, ${b})`, detail: `hsl(${h}, ${s2}%, ${l}%) · #${m[1]}` }; }
  if ((m = low.match(/^rgb\s+(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})$/)) && [+m[1], +m[2], +m[3]].every((x) => x <= 255)) { const [r, g, b] = [+m[1], +m[2], +m[3]], [h, s2, l] = hex2hsl(r, g, b); return { kind: "Colour", value: `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`, detail: `hsl(${h}, ${s2}%, ${l}%) · rgb(${r}, ${g}, ${b})` }; }
  return null;
}
