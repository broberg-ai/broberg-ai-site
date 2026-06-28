/* broberg.ai ⌘K wiring around the reusable cmdk-palette shell (cardmem #7515).
   Client-only progressive enhancement (the page is fully usable without it):
   mounts a Preact island into #cmdk-root, registers the ⌘K/Ctrl+K hotkey, wires
   any SSR [data-testid="cmdk-trigger"] buttons, and lazily fetches the SSR search
   index (/search-index.json?locale=…) on first open. The index is built from the
   live cms store (platforms + posts) so search content stays 100% editable in cms. */
import { render } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { CmdPalette, useCmdkHotkey, makeFuzzy, type CmdItem } from "@/client/cmdk-palette.tsx";

function currentLocale(): "da" | "en" {
  return document.documentElement.lang === "en" ? "en" : "da";
}

function CmdkApp() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CmdItem[]>([]);
  const locale = currentLocale();

  useCmdkHotkey(useCallback(() => setOpen((o) => !o), []));

  // Wire SSR search triggers (the nav search button).
  useEffect(() => {
    const onTrigger = (e: Event) => {
      e.preventDefault();
      setOpen(true);
    };
    const btns = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="cmdk-trigger"]'));
    btns.forEach((b) => b.addEventListener("click", onTrigger));
    return () => btns.forEach((b) => b.removeEventListener("click", onTrigger));
  }, []);

  // Lazy-load the index on first open — one ~few-KB fetch, then cached in state.
  useEffect(() => {
    if (!open || items.length) return;
    fetch(`/search-index.json?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? (data as CmdItem[]) : []))
      .catch(() => {
        /* offline / 404 — palette just shows the empty hint */
      });
  }, [open, items.length, locale]);

  const search = useMemo(() => makeFuzzy(items), [items]);

  return (
    <CmdPalette
      open={open}
      onClose={() => setOpen(false)}
      search={search}
      onActivate={(it) => {
        if (typeof it.data === "string") location.href = it.data;
      }}
      placeholder={locale === "en" ? "Search the universe…" : "Søg i universet…"}
      emptyHint={locale === "en" ? "Search flagships, cases, insights…" : "Søg flagskibe, cases, indsigter…"}
      recentsKey="brobergai:cmdk:recents"
    />
  );
}

export function mountCmdk() {
  if (document.getElementById("cmdk-root")) return;
  const root = document.createElement("div");
  root.id = "cmdk-root";
  document.body.appendChild(root);
  render(<CmdkApp />, root);
}
