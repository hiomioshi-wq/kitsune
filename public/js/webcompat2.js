// Kitsune Browser, v142: the second compatibility pass. v105's fixDoc rescues lazy media, sprites and TeX; this one
// clears what stands between you and the text (consent walls, pop-ups, scroll locks, accordions that never open
// because their script didn't run) and keeps the oldest pages of the web readable (<font>, <center>, bgcolor,
// border tables, marquee, hspace/vspace, old image attributes) without waiting for any script.
// Everything is DOM-only, runs on the parsed copy, and can't reach Kitsune itself.

export const COMPAT_CSS2 = `
#onetrust-consent-sdk,#onetrust-banner-sdk,#onetrust-prompt-sdk,#onetrust-accept-btn-handler,.onetrust-pc-dark-filter,
#CybotCookiebotDialog,#CybotCookiebotDialogBodyUnderlay,.CookieConsent,
#cookiescript_injected,#cookiescript_wrapper,#cookiescript_sr,
#cookie-law-info-bar,#cookie-law-info-again,.cli-bar-message,.cli-modal-backdrop,
.cc-banner,.cc-banner__content,.cc-window,.cc-grower,.cc-revoke,
.cookie-banner,.cookie-banner__container,.cookie-bar,.cookie-notice,.cookie-message,.cookie-consent,.cookie-disclaimer,.cookie-modal,.cookie-popup,.cookie-alert,.cookie-notification,.cookie-check,.cookie-curtain,
.cookiewall,#cookiewall,.cookies-message,.cookies-eu,.cookies-notification,.cookies-bar,
.gdpr-banner,#gdpr-banner,.gdpr-bar,.gdpr-popup,.gdpr-overlay,.gdpr-consent,.gdpr-window,.gdpr-modal,
.iubenda-cs-banner,#iubenda-cs-banner,#iubenda-cs,.iubenda-widget,
.osano.cm-window,.osano-btn-outer,#osano,
#cmp-wrapper,.cmpbox,.cmpboxWelcome,#cmpbox,.cmp-container,.sp_message_container,.sp-cc,.s-cc-banner,#cc--main,
#cookiebanner,#cookieBanner,#cookie_banner,#cookie-notice,.cookie__banner,#cookieNotification,.CookieBanner,.CookieBanner__wrapper,
#consent,#consent-banner,.consent-banner,.consent-bar,.consent-modal,.consent-wall,.consent-popup,.js-cookie-consent,.js-cookie-banner,.site-cookie-notice,#site-cookie-notice,.CookieInformation,
[class*="cookie-consent" i],[class*="cookieConsent" i],[class*="cookie_banner" i],[class*="cookieBar" i],[id*="cookieBar" i],[class*="CookieBanner" i],[class*="cookie-banner" i],[class*="cookiewall" i],
.newsletter-modal,.newsletter-popup,.newsletter-dialog,.newsletter-overlay,.exit-intent,.exit-intent-popup,.exit-popup,.exit-modal,.subscribe-modal,.subscribe-popup,.subscribe-overlay,.paywall-modal,
[class*="newsletter-modal" i],[class*="exit-intent" i],[class*="exit_popup" i],[class*="age-gate" i],[class*="agegate" i],[class*="subscribe-modal" i],
.mfp-bg,.mfp-wrap,.modal-backdrop,.modal-overlay,.overlay-backdrop,#overlay-background,.veil,
marquee{display:none!important}
marquee.kb-keep{display:block!important;white-space:normal;overflow:visible}
body{overflow:auto!important;position:static!important}
html{overflow:auto!important}
summary{cursor:pointer}
details>summary::marker{content:"▸ ";}
details[data-kb-open]>summary::marker{content:"▾ ";}
[nowrap]{white-space:normal!important}
.kb-lt-c{color:var(--kb-ltc)}
tt{font-family:monospace}
[data-kb-tb]{border-collapse:collapse}
[data-kb-tb] td,[data-kb-tb] th{border:1px solid var(--kb-tbc,#9a9a9a)}
.kb-tb0 td,.kb-tb0 th{border:none}
[data-kb-kp] td,[data-kb-kp] th{padding:var(--kb-kp,0)}
`;

// Consent SDKs, paywall shrouds and pop-up makers whose whole job is to appear over the page.
const WALL_SEL = [
  "#onetrust-consent-sdk", "#CybotCookiebotDialog", "#cookiescript_injected", "#cookie-law-info-bar", ".cookiewall", ".cc-window", ".cc-banner",
  "#cmp-wrapper", ".cmpbox", ".sp_message_container", "#iubenda-cs", ".iubenda-cs-banner", ".osano.cm-window", "#osano", "#cookiebanner", ".osano-btn-outer",
  ".mfp-wrap", ".mfp-bg", "#SiteNotification", ".cvt_notification",
].join(",");
const WALL_WORDS = /(cookie|consent|gdpr|privacy[-_ ]?(banner|bar|notice)|cookiewall|newsletter|subscribe|exit[-_ ]?intent|age[-_ ]?gate|agegate|cmp[-_ ]?(wrapper|box|container)|onetrust|cookiebot|cookiescript|osano|webedoctor|newsletter[-_ ]?modal|paywall[-_ ]?modal)/i;
const OVERLAY_WORDS = /(banner|cookie|consent|gdpr|cmp|overlay|backdrop|interstitial|subscribe|newsletter|popup|modal|gate|splash|preloader|veil|wall)/i;

const inlineFixed = (el) => {
  const s = (el.getAttribute("style") || "").replace(/\s+/g, "").toLowerCase();
  if (!/(position:fixed|position:absolute)/.test(s)) return false;
  const cover = (s.match(/(left|right):[^;]*0/) || s.match(/inset:0/)) && ((s.match(/(top|bottom):[^;]*0/) || /inset:0/.test(s)));
  const wide = /(width|height|min-width|min-height):(100%|100vw|100vh)/.test(s) || /inset:0/.test(s);
  return cover && (wide || el.tagName === "DIALOG");
};

export function sweepWalls(doc) {
  let n = 0;
  const kill = (el, why) => { if (el && el.isConnected) { el.remove(); n++; } };
  doc.querySelectorAll(WALL_SEL).forEach((el) => kill(el));
  // name-matched consent and pop-up roots (class, id, aria, test ids), and full-viewport overlays styled inline
  const pageWords = (doc.body.textContent || "").replace(/\s+/g, " ").trim().length || 1;
  doc.querySelectorAll("[class], [id]").forEach((el) => {
    if (!el.isConnected) return;
    const tag = el.tagName;
    if (!/^(DIV|SECTION|ASIDE|DIALOG|HEADER|SPAN|UL|OL|P|A|IMG|SVG|BUTTON)$/.test(tag)) return;
    const name = `${el.id || ""} ${typeof el.className === "string" ? el.className : ""} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("role") || ""} ${el.getAttribute("data-testid") || ""}`;
    const big = inlineFixed(el) || tag === "DIALOG" && el.hasAttribute("open");
    if ((big && OVERLAY_WORDS.test(name) && !/^MAIN$/.test(tag)) || WALL_WORDS.test(name) && /banner|bar|wall|modal|popup|overlay|dialog/i.test(name)) {
      // never take the page's own content: an "overlay" that holds most of the page is a layout, not a wall
      const words = (el.textContent || "").replace(/\s+/g, " ").trim().length;
      if (words / pageWords > .55) return;
      if (big || words < 400) kill(el);
    }
  });
  // a locked page: scripts hid the scrollbar behind their wall
  for (const el of [doc.body, doc.documentElement]) {
    const s = el && el.getAttribute("style");
    if (s && /overflow\s*:\s*hidden/i.test(s)) { el.setAttribute("style", s.replace(/overflow[^;"']*/gi, "").replace(/;\s*$/, "")); n++; }
  }
  doc.querySelectorAll("html[style], body[style]").forEach((el) => {
    const s = el.getAttribute("style");
    if (/position\s*:\s*fixed/i.test(s) && !/top\s*:\s*0/i.test(s)) { el.setAttribute("style", s.replace(/position[^;"']*/i, "position:static")); n++; }
  });
  return n;
}

const FONT_SIZES = { 1: "xx-small", 2: "small", 3: "medium", 4: "large", 5: "x-large", 6: "xx-large", 7: "xxx-large" };

function oneLegacy(doc, el, abs) {
  const tag = el.tagName;
  if (tag === "FONT") {
    const s = [];
    const c = el.getAttribute("color"); if (c) s.push(`color:${c}`);
    const z = el.getAttribute("size"); if (z && FONT_SIZES[z.trim()]) s.push(`font-size:${FONT_SIZES[z.trim()]}`);
    const f = el.getAttribute("face"); if (f) s.push(`font-family:${f.replace(/[<>"]/g, "").split(",")[0]},serif`);
    const sp = doc.createElement("span");
    if (s.length) sp.setAttribute("style", s.join(";"));
    sp.append(...el.childNodes);
    el.replaceWith(sp);
    return 1;
  }
  if (tag === "CENTER") {
    const d = doc.createElement("div");
    d.setAttribute("style", "text-align:center");
    d.append(...el.childNodes);
    el.replaceWith(d);
    return 1;
  }
  if (tag === "MARQUEE") {
    el.removeAttribute("truespeed");
    const d = doc.createElement("div");
    d.setAttribute("class", "kb-keep");
    d.append(...el.childNodes);
    el.replaceWith(d);
    return 1;
  }
  if (tag === "TABLE") {
    const s = [];
    const b = el.getAttribute("border");
    if (b != null) {
      const bw = parseInt(b, 10);
      if (bw > 0) { el.setAttribute("data-kb-tb", ""); el.style.setProperty("--kb-tbc", bw >= 3 ? "#6b6b6b" : "#9a9a9a"); }
      else el.setAttribute("class", `${el.getAttribute("class") || ""} kb-tb0`);
      s.push("border-collapse:collapse");
    }
    if (el.hasAttribute("cellspacing")) { s.push(`border-spacing:${Math.max(0, parseInt(el.getAttribute("cellspacing"), 10) || 0)}px`); el.removeAttribute("cellspacing"); }
    if (el.hasAttribute("cellpadding")) { el.style.setProperty("--kb-kp", `${Math.max(0, parseInt(el.getAttribute("cellpadding"), 10) || 0)}px`); el.setAttribute("data-kb-kp", ""); el.removeAttribute("cellpadding"); }
    const bg = el.getAttribute("background"); if (bg) { s.push(`background-image:url("${abs(bg)}")`); el.removeAttribute("background"); }
    if (s.length) { el.setAttribute("style", `${el.getAttribute("style") || ""};${s.join(";")}`); return 1; }
    return 0;
  }
  if (tag === "IMG") {
    const s = [];
    const b = el.getAttribute("border"); if (b != null) { s.push(`border:${Math.max(0, parseInt(b, 10) || 0)}px solid`); el.removeAttribute("border"); }
    const a = el.getAttribute("align");
    if (a) {
      if (a === "left" || a === "right") s.push(`float:${a}`);
      else s.push(`vertical-align:${{ top: "top", texttop: "text-top", middle: "middle", absmiddle: "middle", baseline: "baseline", bottom: "bottom", absbottom: "abs-bottom" }[a.toLowerCase()] || "baseline"}`);
      el.removeAttribute("align");
    }
    const h = el.getAttribute("vspace"), w = el.getAttribute("hspace");
    if (h != null || w != null) { const hv = Math.max(0, parseInt(h, 10) || 0), wv = Math.max(0, parseInt(w, 10) || 0); s.push(`margin:${hv}px ${wv}px`); el.removeAttribute("vspace"); el.removeAttribute("hspace"); }
    if (s.length) { el.setAttribute("style", `${el.getAttribute("style") || ""};${s.join(";")}`); return 1; }
    return 0;
  }
  if (tag === "HR") {
    const s = [];
    if (el.hasAttribute("size")) { s.push(`height:${Math.max(1, parseInt(el.getAttribute("size"), 10) || 2)}px`); el.removeAttribute("size"); }
    if (el.hasAttribute("color")) { s.push(`background-color:${el.getAttribute("color")}`); s.push(`color:${el.getAttribute("color")}`); el.removeAttribute("color"); }
    if (el.hasAttribute("noshade")) { s.push("border-style:solid;border-width:1px 0 0"); el.removeAttribute("noshade"); }
    if (s.length) { el.setAttribute("style", `${el.getAttribute("style") || ""};${s.join(";")}`); return 1; }
    return 0;
  }
  if (tag === "TD" || tag === "TH") {
    const bg = el.getAttribute("background"), w = el.getAttribute("width"), h = el.getAttribute("height");
    const s = [];
    if (bg) { s.push(`background-image:url("${abs(bg)}")`); el.removeAttribute("background"); }
    if (w && !el.getAttribute("style")) s.push(`width:${/^\d+$/.test(w) ? w + "px" : w}`);
    if (h && !el.getAttribute("style")) s.push(`height:${/^\d+$/.test(h) ? h + "px" : h}`);
    if (s.length) { el.setAttribute("style", `${el.getAttribute("style") || ""};${s.join(";")}`); return 1; }
    return 0;
  }
  if (tag === "BODY") {
    const s = [];
    const bg = el.getAttribute("bgcolor"); if (bg) { s.push(`background-color:${bg}`); el.removeAttribute("bgcolor"); }
    const tx = el.getAttribute("text"); if (tx) { s.push(`color:${tx}`); el.removeAttribute("text"); }
    if (s.length) { el.setAttribute("style", `${el.getAttribute("style") || ""};${s.join(";")}`); return 1; }
    return 0;
  }
  return 0;
}

export function legacyHtml(doc, abs = (u) => u, limit = 4000) {
  const set = doc.querySelectorAll("font, center, marquee, table[border], table[cellspacing], table[cellpadding], table[background], img[border], img[align], img[vspace], img[hspace], hr[size], hr[color], hr[noshade], td[background], td[width], td[height], body[bgcolor], body[text]");
  let n = 0;
  for (const el of set) { if (n >= limit) break; n += oneLegacy(doc, el, abs); }
  return n;
}

// Accordions and tabs that a script was supposed to open: without it they hide their answer forever.
export function openToggles(doc) {
  let n = 0;
  doc.querySelectorAll("details:not([open])").forEach((d) => {
    d.setAttribute("open", "");
    d.setAttribute("data-kb-open", "");
    n++;
  });
  // script-driven tabs: the panels exist but were display:none until their tab script ran
  doc.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
    if (!/^(DIV|SECTION|ARTICLE|UL|OL|TABLE|P|FIGURE)$/.test(el.tagName)) return;
    const s = (el.getAttribute("style") || "").toLowerCase();
    if (!/display\s*:\s*none/.test(s)) return;
    const words = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (words.length < 60 || words.length > 8000) return;
    el.removeAttribute("aria-hidden");
    el.setAttribute("style", s.replace(/display\s*:\s*none\s*;?/i, ""));
    n++;
  });
  return n;
}

// Scroll-reveal decorations left inline: the element stays invisible forever without its animation script.
export function unhideReveals(doc) {
  let n = 0;
  doc.querySelectorAll("[style]").forEach((el) => {
    const cls = typeof el.className === "string" ? el.className : "";
    if (!/(reveal|fade|animate|aos|sal|wow|scroll|motion|appear|visible-on|show-on|js-[a-z]*-show)/i.test(cls)) return;
    const s = el.getAttribute("style") || "";
    if (!/opacity\s*:\s*0|visibility\s*:\s*hidden/.test(s)) return;
    el.setAttribute("style", s.replace(/opacity\s*:\s*0\s*;?|visibility\s*:\s*hidden\s*;?/gi, ""));
    n++;
  });
  return n;
}

// The one call: walls first (they can hold the page hostage), then the oldest markup, then the script-dependent bits.
export function fixDoc2(doc, abs = (u) => u, opts = {}) {
  if (!doc || !doc.body) return 0;
  let n = 0;
  n += sweepWalls(doc);
  n += legacyHtml(doc, abs);
  n += openToggles(doc);
  n += unhideReveals(doc);
  doc.querySelectorAll("style[media]").forEach((s) => { if (/^(print|only print|none|only x|not all)$/i.test((s.getAttribute("media") || "").trim())) { s.remove(); n++; } });
  if (opts.liveHint) void opts.liveHint;
  return n;
}
