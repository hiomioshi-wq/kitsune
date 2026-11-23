// Kitsune Browser, v117: progressive rendering for very big pages. Instead of building ten thousand elements in one go
// (the screen stays blank until the last one is laid out), the page is poured in top to bottom in short slices, so the
// first screenful appears almost at once and the rest follows while you read.
const BIG_SUBTREE = 600, SLICE_MS = 9;

const count = (n) => (n.nodeType === 1 ? n.getElementsByTagName("*").length : 0);
const wide = (n) => n.nodeType === 1 && !n.shadowRoot && !n.tagName.includes("-") && n.childNodes.length > 0 && count(n) > BIG_SUBTREE && !/^(TABLE|SVG|SELECT|PRE|UL|OL|DL|TBODY|PICTURE|VIDEO|AUDIO|FORM|TEXTAREA)$/i.test(n.tagName);

export async function fill(target, html) {
  const stage = document.createElement("div");
  if (typeof stage.setHTMLUnsafe === "function") stage.setHTMLUnsafe(html); else stage.innerHTML = html;
  let deadline = performance.now() + SLICE_MS, slices = 1;
  const tick = async () => { if (performance.now() < deadline) return; if (document.hidden) return; await new Promise((r) => { requestAnimationFrame(() => r()); setTimeout(r, 70); }); deadline = performance.now() + SLICE_MS; slices++; };
  async function walk(dest, src) {
    for (const child of [...src.childNodes]) {
      if (wide(child)) { const shell = child.cloneNode(false); dest.append(shell); await walk(shell, child); }
      else dest.append(child);
      await tick();
    }
  }
  await walk(target, stage);
  return slices;
}
export const worthIt = (html) => html.length > 500000;
