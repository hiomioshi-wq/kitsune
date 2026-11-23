// Kitsune Browser, v109: feeds from the browser. Follow the site you're on, or see what it publishes.
import { toast } from "./util.js";
import * as F from "./feedlib.js";

export function items({ T, go }) {
  return [
    { label: "Follow this site in Feeds", icon: "plus", run: async () => {
      const t = T(); if (!t.url) return toast("Open a page first.");
      toast("Looking for this site's feed…", { ms: 1500 });
      try { const r = await F.subscribe(t.url); toast(r.existed ? `You already follow ${r.sub.title}.` : `Following ${r.sub.title}.`, { action: "Open Feeds", onAction: () => (location.hash = "feeds") }); }
      catch (e) { toast(e.message); }
    } },
    { label: "Open my Feeds", icon: "list", run: () => (location.hash = "feeds") },
  ];
}
