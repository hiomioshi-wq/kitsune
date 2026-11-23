// Kitsune compatibility test: assets found relative to the module's own address, and stylesheets added later.
const r = [];
try { const t = await (await fetch(new URL("./icons.svg", import.meta.url))).text(); r.push("meta-" + (t.includes("symbol") ? "ok" : "bad")); } catch (e) { r.push("meta-err"); }
const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "late.css"; document.head.append(l);
await new Promise((ok) => { l.onload = l.onerror = ok; setTimeout(ok, 4000); });
r.push("link-" + (l.href.includes("/api/browse/x/") ? "relay" : "direct"), "css-" + getComputedStyle(document.getElementById("h")).color);
document.title = r.join(" ");
