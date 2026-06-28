// cmdk-palette.tsx — generic ⌘K command-palette SHELL, distilled from cardmem's
// command-palette.tsx for reuse on broberg.ai (intercom #7515). Zero app-specific
// deps: only preact/hooks. You inject the data layer via the `search` +
// `onActivate` props, so this is the same shell cardmem uses but with the
// MCP/project/auth bits stripped. When both cardmem + broberg.ai run it,
// components extracts it as @broberg/cmdk against THIS exact prop-shape — so do
// NOT diverge the prop-shape; theme via CSS only.

import { useEffect, useMemo, useRef, useState } from "preact/hooks";

export interface CmdItem {
  id: string;
  title: string;
  subtitle?: string; // optional second line (path, excerpt, repo…)
  badge?: string; // short type label, e.g. "NODE" | "POST" | "CASE"
  badgeTone?: "clay" | "olive" | "oat" | "neutral"; // optional badge colour key
  data?: unknown; // anything you need back in onActivate (e.g. the URL)
}

export interface CmdPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Client-side fuzzy over your prebuilt index. SYNC (no server round-trip). */
  search: (query: string) => CmdItem[];
  onActivate: (item: CmdItem) => void;
  placeholder?: string;
  /** localStorage key for the recents list. Omit to disable recents. */
  recentsKey?: string;
  emptyHint?: string;
}

const MAX_RECENTS = 8;

/** Global ⌘K / Ctrl+K toggle. Call ONCE in your app shell (the listener lives
 *  outside the component, so the palette can be opened from anywhere). */
export function useCmdkHotkey(toggle: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);
}

/** Trivial token-AND substring fuzzy over a prebuilt index. Replace with a real
 *  fuzzy lib (fuse.js) only if you need ranking; for ~dozens of items this is fine. */
export function makeFuzzy(items: CmdItem[], limit = 25): (q: string) => CmdItem[] {
  const idx = items.map((it) => ({
    it,
    hay: `${it.title} ${it.subtitle ?? ""} ${it.badge ?? ""}`.toLowerCase(),
  }));
  return (q: string) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const terms = needle.split(/\s+/);
    return idx.filter((e) => terms.every((t) => e.hay.includes(t))).slice(0, limit).map((e) => e.it);
  };
}

export function CmdPalette({
  open,
  onClose,
  search,
  onActivate,
  placeholder = "Search…",
  recentsKey,
  emptyHint = "Start typing…",
}: CmdPaletteProps) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [recents, setRecents] = useState<CmdItem[]>(() => loadRecents(recentsKey));
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset + focus on open.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlight(0);
    setRecents(loadRecents(recentsKey));
    queueMicrotask(() => inputRef.current?.focus());
  }, [open, recentsKey]);

  // Body scroll-lock while open (so scrolling results doesn't move the page).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Empty query → recents; otherwise the live client-side search.
  const results = useMemo(() => (query.trim() ? search(query) : recents), [query, recents, search]);

  const activate = (item: CmdItem) => {
    storeRecent(recentsKey, item);
    onClose();
    onActivate(item);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const t = results[highlight];
      if (t) activate(t);
    }
  };

  if (!open) return null;

  return (
    <div
      class="cmdk-backdrop"
      data-testid="cmdk-backdrop"
      onClick={(e: MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div class="cmdk-box" role="dialog" aria-label="Command palette">
        <div class="cmdk-head">
          <svg class="cmdk-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <input
            ref={inputRef}
            class="cmdk-input"
            data-testid="cmdk-input"
            placeholder={placeholder}
            value={query}
            onInput={(e: Event) => {
              setQuery((e.currentTarget as HTMLInputElement).value);
              setHighlight(0);
            }}
            onKeyDown={onKey}
          />
          <kbd class="cmdk-kbd">esc</kbd>
        </div>

        <div class="cmdk-list">
          {!query.trim() && recents.length > 0 && <div class="cmdk-section">recent</div>}
          {results.length === 0 && <p class="cmdk-empty">{query.trim() ? "No matches" : emptyHint}</p>}
          {results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              data-testid="cmdk-row"
              class={`cmdk-row${i === highlight ? " active" : ""}`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => activate(r)}
            >
              {r.badge && <span class={`cmdk-badge tone-${r.badgeTone ?? "neutral"}`}>{r.badge}</span>}
              <span class="cmdk-rowtext">
                <span class="cmdk-title">{r.title}</span>
                {r.subtitle && <span class="cmdk-sub">{r.subtitle}</span>}
              </span>
            </button>
          ))}
        </div>

        <div class="cmdk-foot">
          <kbd class="cmdk-kbd">↑↓</kbd>
          <span>navigate</span>
          <kbd class="cmdk-kbd">↵</kbd>
          <span>open</span>
        </div>
      </div>
    </div>
  );
}

function loadRecents(key?: string): CmdItem[] {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as CmdItem[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function storeRecent(key: string | undefined, item: CmdItem) {
  if (!key) return;
  try {
    const cur = loadRecents(key).filter((x) => x.id !== item.id);
    cur.unshift(item);
    localStorage.setItem(key, JSON.stringify(cur.slice(0, MAX_RECENTS)));
  } catch {
    /* localStorage unavailable / quota — ignore */
  }
}
