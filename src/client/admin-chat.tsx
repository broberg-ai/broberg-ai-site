/* broberg.ai — full-screen AI chat surface (F002).

   Mounts a Preact island into #admin-chat-root that streams the FULL cms-admin
   agentic chat (the ~64 build/version/control tools) through the same-origin
   /api/admin/chat relay (see src/chat-relay.ts). Conversation history (Samtaler)
   + memory (Hukommelse) are the SAME per-site stores webhouse.app's own chat
   uses, relayed via /api/admin/chat/conversations* and /api/admin/chat/memory*.

   Auth: the browser sends its connected editSession token (the shared
   "log ind via webhouse.app" login) as a Bearer header; the relay verifies it
   and holds the server-side admin token. Not connected → bounce to the connect
   flow (same as the /admin panel). */
import { render } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { marked } from "marked";
import { getConnectedToken, buildConnectUrl } from "@broberg/cms-inline-edit";
import { peekQuickAction, warmQuickAction, CHAT_MARKDOWN_CSS } from "@broberg/cms-chat-client";

const CMS = { cmsBaseUrl: "https://webhouse.app", siteId: "broberg-ai" };

// ── Types ───────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";
interface ToolCall { tool: string; input?: Record<string, unknown>; result?: string; status: "running" | "done" | "error"; }
interface Msg { id: string; role: Role; content: string; thinking?: string; toolCalls?: ToolCall[]; isStreaming?: boolean; startedAt?: number; }
interface ConvListItem { id: string; title: string; updatedAt: string; starred?: boolean; }
interface Memory { id: string; fact: string; category: string; entities?: string[]; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

function authHeaders(): Record<string, string> {
  const token = getConnectedToken(CMS);
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!t) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "lige nu";
  if (s < 3600) return `${Math.floor(s / 60)} min. siden`;
  if (s < 86400) return `${Math.floor(s / 3600)} t. siden`;
  return `${Math.floor(s / 86400)} d. siden`;
}

// Danish labels for the common tools (fallback = the raw name humanised).
const TOOL_LABELS: Record<string, string> = {
  list_documents: "Henter dokumenter", get_document: "Henter dokument", create_document: "Opretter dokument",
  update_document: "Opdaterer dokument", publish_document: "Udgiver", unpublish_document: "Afpublicerer",
  trash_document: "Flytter til papirkurv", restore_from_trash: "Gendanner", clone_document: "Kopierer dokument",
  translate_document: "Oversætter dokument", translate_site: "Oversætter site", search_content: "Søger i indhold",
  search_memories: "Søger i hukommelse", save_memory: "Gemmer i hukommelse", get_site_info: "Henter site-info",
  list_collections: "Henter kollektioner", generate_interactive: "Bygger interaktiv", deploy_site: "Deployer site",
  get_analytics: "Henter analytics", list_forms: "Henter formularer",
};
const toolLabel = (t: string) => TOOL_LABELS[t] || t.replace(/_/g, " ");
function toolDetail(input?: Record<string, unknown>): string {
  if (!input) return "";
  if (typeof input.collection === "string") return input.collection + (typeof input.slug === "string" ? `/${input.slug}` : "");
  if (typeof input.query === "string") return `"${input.query}"`;
  if (typeof input.slug === "string") return String(input.slug);
  return "";
}

function renderMarkdown(md: string): string {
  const html = marked.parse(md, { breaks: true, async: false }) as string;
  return html
    // Open links in a new tab (admin surface, external targets).
    .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ')
    // Wrap wide tables so they scroll inside their own box (no mobile wiggle).
    .replace(/<table>/g, '<div class="chat-table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>");
}

// ── Quick actions (empty state) ───────────────────────────────────────────────
const SUGGESTIONS: { label: string; message: string; key: string }[] = [
  { key: "overview", label: "Overblik over sitet", message: "Giv mig et overblik over mit site — hvor mange kollektioner, dokumenter og kladder har jeg?" },
  { key: "drafts", label: "Vis mine kladder", message: "Vis alle upublicerede kladder på tværs af kollektioner." },
  { key: "capabilities", label: "Hvad kan du?", message: "List alle de værktøjer og ting du kan hjælpe mig med på mit site." },
  { key: "site-info", label: "Site-info", message: "Fortæl mig alt om mit site — kollektioner, felter, indstillinger og indholds-statistik." },
];

// ── Root component ────────────────────────────────────────────────────────────
function ChatApp() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [convId, setConvId] = useState(() => uuid());
  const [drawer, setDrawer] = useState<null | "chats" | "memory">(null);
  const [conversations, setConversations] = useState<ConvListItem[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [confirmConv, setConfirmConv] = useState<string | null>(null);
  const [confirmMem, setConfirmMem] = useState<string | null>(null);
  const messagesRef = useRef<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  messagesRef.current = messages;

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; });
  }, []);

  useEffect(() => { scrollDown(); }, [messages, scrollDown]);

  // ── API ───────────────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/chat/conversations", { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setConversations(Array.isArray(d.conversations) ? d.conversations : []); }
    } catch { /* offline */ }
  }, []);

  const loadMemories = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/chat/memory", { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setMemories(Array.isArray(d.memories) ? d.memories : []); }
    } catch { /* offline */ }
  }, []);

  const saveConversation = useCallback(async (id: string, msgs: Msg[]) => {
    if (!msgs.length) return;
    const title = (msgs[0]?.content || "Ny samtale").slice(0, 60);
    const body = {
      id, title,
      messages: msgs.map((m) => ({
        id: m.id, role: m.role, content: m.content, timestamp: new Date().toISOString(),
        toolCalls: (m.toolCalls ?? []).map((tc) => ({ tool: tc.tool, input: tc.input ?? {}, result: tc.result ?? "" })),
      })),
    };
    try { await fetch("/api/admin/chat/conversations", { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }); } catch { /* */ }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/admin/chat/conversations/${id}`, { headers: authHeaders() });
      if (!r.ok) return;
      const { conversation } = await r.json();
      const msgs: Msg[] = (conversation.messages ?? []).map((m: any) => ({
        id: m.id, role: m.role, content: m.content,
        toolCalls: (m.toolCalls ?? []).map((tc: any) => ({ tool: tc.tool, input: tc.input, result: tc.result, status: "done" as const })),
      }));
      setMessages(msgs); setConvId(conversation.id); setDrawer(null);
    } catch { /* */ }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    setConfirmConv(null);
    try { await fetch(`/api/admin/chat/conversations/${id}`, { method: "DELETE", headers: authHeaders() }); } catch { /* */ }
    setConversations((c) => c.filter((x) => x.id !== id));
    if (id === convId) { setMessages([]); setConvId(uuid()); }
  }, [convId]);

  const deleteMemory = useCallback(async (id: string) => {
    setConfirmMem(null);
    try { await fetch(`/api/admin/chat/memory/${id}`, { method: "DELETE", headers: authHeaders() }); } catch { /* */ }
    setMemories((m) => m.filter((x) => x.id !== id));
  }, []);

  const newChat = useCallback(() => { setMessages([]); setConvId(uuid()); setInput(""); setDrawer(null); }, []);

  // ── Streaming send ──────────────────────────────────────────────────────────
  const send = useCallback(async (text: string, warmKey?: string) => {
    const clean = text.trim();
    if (!clean || streaming) return;
    const userMsg: Msg = { id: uuid(), role: "user", content: clean };
    const asstId = uuid();
    const asstMsg: Msg = { id: asstId, role: "assistant", content: "", toolCalls: [], isStreaming: true, startedAt: Date.now() };
    const base = [...messagesRef.current, userMsg];
    setMessages([...base, asstMsg]);
    setInput("");
    setStreaming(true);

    const update = (fn: (m: Msg) => Msg) =>
      setMessages((cur) => cur.map((m) => (m.id === asstId ? fn(m) : m)));

    // Accumulated across the whole turn (survives the batched display flush).
    let fullText = "";
    const localTools: ToolCall[] = [];

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          conversationId: convId,
          messages: base.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) {
        let msg = "Kunne ikke få svar";
        try { const e = await res.json(); if (e?.error === "chat_not_configured") msg = "Chatten er ikke konfigureret endnu."; else if (e?.error) msg = String(e.error); } catch { /* */ }
        update((m) => ({ ...m, content: `Fejl: ${msg}`, isStreaming: false }));
        setStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", event = "";
      // Batch text deltas. Streaming emits hundreds of tiny `text` events; a
      // setState + re-render per delta saturated mobile Safari's main thread
      // until reader.read() stalled and the connection dropped. Coalesce deltas
      // and flush on a ~70ms throttle. fullText/localTools accumulate the whole
      // turn so nothing is lost to throttling (used for the final render + save).
      let pending = "";
      let flushTimer: ReturnType<typeof setTimeout> | null = null;
      const flushText = () => {
        flushTimer = null;
        if (!pending) return;
        const t = pending; pending = "";
        update((m) => ({ ...m, content: m.content + t }));
      };
      const addText = (d: string) => { if (!d) return; fullText += d; pending += d; if (!flushTimer) flushTimer = setTimeout(flushText, 70); };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("event: ")) { event = line.slice(7).trim(); continue; }
          if (!line.startsWith("data: ")) continue;
          let data: any; try { data = JSON.parse(line.slice(6)); } catch { continue; }
          if (event === "text") addText(data.text ?? "");
          else if (event === "thinking") update((m) => ({ ...m, thinking: (m.thinking ?? "") + (data.text ?? "") }));
          else if (event === "tool_call") {
            localTools.push({ tool: data.tool, input: data.input, status: "running" });
            update((m) => ({ ...m, toolCalls: [...(m.toolCalls ?? []), { tool: data.tool, input: data.input, status: "running" }] }));
          } else if (event === "tool_result") {
            const li = localTools.findIndex((t) => t.tool === data.tool && t.status === "running");
            if (li >= 0) localTools[li] = { ...localTools[li], result: data.result, status: "done" };
            update((m) => {
              const tcs = [...(m.toolCalls ?? [])];
              const i = tcs.findIndex((t) => t.tool === data.tool && t.status === "running");
              if (i >= 0) tcs[i] = { ...tcs[i], result: data.result, status: "done" };
              return { ...m, toolCalls: tcs };
            });
          } else if (event === "artifact") addText(`\n\n**${data.title ?? "Artefakt"}**`);
          else if (event === "error") fullText += `\n\nFejl: ${data.message ?? "ukendt"}`;
          event = "";
        }
      }
      if (flushTimer) clearTimeout(flushTimer);
    } catch {
      if (!fullText) fullText = "Forbindelsen blev afbrudt. Prøv igen.";
    } finally {
      // One final render with the complete text — markdown now applies since
      // isStreaming flips false — then persist from local data (the ref lags
      // the throttled flush, so build the saved message here).
      update((m) => ({ ...m, content: fullText, toolCalls: localTools, isStreaming: false }));
      setStreaming(false);
      saveConversation(convId, [...base, { id: asstId, role: "assistant", content: fullText, toolCalls: localTools }]);
      loadConversations();
      // F158: warm the quick-action cache with this streamed answer so the next
      // click is instant. Only for a clean tool-free-or-not answer (skip errors).
      if (warmKey && fullText && !fullText.startsWith("Forbindelsen") && !fullText.startsWith("Fejl:")) {
        // F158.2: shared @broberg/cms-chat-client (same-origin relay). Never throws.
        warmQuickAction(warmKey, fullText, { path: "/api/admin/chat/quick/:key", headers: authHeaders() });
      }
    }
  }, [streaming, convId, saveConversation, loadConversations]);

  // F158: a quick-action click tries the cache first (instant), else streams
  // normally and warms the cache on completion (via send's warmKey).
  const sendQuick = useCallback(async (action: { key: string; message: string }) => {
    if (streaming) return;
    // "Hvad kan du?" renders a curated, designed capabilities panel (static,
    // instant, always Danish) instead of the flat AI markdown. Rollback path:
    // delete this block → falls back to the cached markdown answer below.
    if (action.key === "capabilities") {
      const userMsg: Msg = { id: uuid(), role: "user", content: action.message };
      const asstMsg: Msg = { id: uuid(), role: "assistant", content: CAPABILITIES_MARK };
      const next = [...messagesRef.current, userMsg, asstMsg];
      setMessages(next);
      saveConversation(convId, next);
      loadConversations();
      return;
    }
    // F158.2: peek the shared cache via @broberg/cms-chat-client (same-origin
    // relay). A warm hit renders instantly; peek never throws, so a miss / error
    // just falls through to normal streaming (which warms the cache on finish).
    const { cached, markdown } = await peekQuickAction(action.key, { path: "/api/admin/chat/quick/:key", headers: authHeaders() });
    if (cached && markdown) {
      const userMsg: Msg = { id: uuid(), role: "user", content: action.message };
      const asstMsg: Msg = { id: uuid(), role: "assistant", content: markdown };
      const next = [...messagesRef.current, userMsg, asstMsg];
      setMessages(next);
      saveConversation(convId, next);
      loadConversations();
      return;
    }
    send(action.message, action.key);
  }, [streaming, convId, send, saveConversation, loadConversations]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const c = {
    bg: "#0d0d0d", panel: "#161616", panel2: "#1c1c1c", border: "#2a2a2a",
    fg: "#f0f4f8", muted: "#8a8a8a", accent: "var(--orange-text, #ff6a45)",
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: c.bg, color: c.fg, fontFamily: "system-ui,-apple-system,sans-serif", overflowX: "hidden" }} data-testid="admin-chat-app">
      {/* Action bar — the only chrome (no stacked admin header). One line, no
          wiggle: nowrap + items that fit; on mobile the brand hides and "Ny chat"
          collapses to "+". NEVER overflow-x scroll (global mobile hard rule). */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "nowrap", gap: "8px", padding: "10px 16px", borderBottom: `1px solid ${c.border}`, maxWidth: "100%" }}>
        <span class="chat-brand" style={{ fontWeight: 700, fontSize: "15px", marginRight: "4px", flex: "0 0 auto" }}>broberg<span style={{ color: c.accent }}>.ai</span></span>
        <button data-testid="chat-new" onClick={newChat} aria-label="Ny chat" title="Ny chat" style={{ ...btn(c, true), flex: "0 0 auto" }}>
          <span class="chat-lbl-full">Ny chat</span><span class="chat-lbl-mini">+</span>
        </button>
        <button data-testid="chat-open-conversations" onClick={() => { setDrawer("chats"); loadConversations(); }} style={{ ...btn(c), flex: "0 0 auto" }}>Samtaler</button>
        <button data-testid="chat-open-memory" onClick={() => { setDrawer("memory"); loadMemories(); }} style={{ ...btn(c), flex: "0 0 auto" }}>
          Hukommelse{memories.length ? ` (${memories.length})` : ""}
        </button>
        <div style={{ flex: "1 1 auto", minWidth: "6px" }} />
        <a data-testid="chat-exit" href="/" style={{ ...btn(c), flex: "0 0 auto", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>Forlad →</a>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }} data-testid="chat-messages">
        <div style={{ maxWidth: "768px", margin: "0 auto" }}>
          {messages.length === 0 ? (
            <div data-testid="chat-welcome" style={{ textAlign: "center", paddingTop: "8vh" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,106,69,.12)", border: "1px solid rgba(255,106,69,.32)" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: c.accent }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <h1 style={{ fontSize: "30px", fontWeight: 600, margin: "0 0 10px" }}>Snak med dit site</h1>
              <p style={{ color: c.muted, fontSize: "15px", lineHeight: 1.5, margin: "0 auto 30px", maxWidth: "470px" }}>
                Spørg om hvad som helst på <b style={{ color: c.fg }}>broberg.ai</b> — jeg kender dit skema, dit indhold og dine indstillinger, og kan bygge, rette og udgive for dig.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px", textAlign: "left" }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} data-testid="chat-suggestion" onClick={() => sendQuick(s)}
                    onMouseEnter={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.borderColor = c.accent; t.style.background = c.panel2; }}
                    onMouseLeave={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.borderColor = c.border; t.style.background = c.panel; }}
                    style={{ ...cardBase(c), display: "flex", alignItems: "center", gap: "11px", cursor: "pointer", padding: "13px 15px", fontSize: "13.5px", fontWeight: 500, transition: "border-color .15s, background .15s" }}>
                    {quickIcon(s.key, c.accent)}
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
              <p style={{ marginTop: "26px", fontSize: "11px", color: c.muted, opacity: .55 }}>
                Enter sender · Shift + Enter = ny linje
              </p>
            </div>
          ) : (
            messages.map((m) => <Message key={m.id} m={m} c={c} />)
          )}
        </div>
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${c.border}`, padding: "12px 16px" }}>
        <div style={{ maxWidth: "768px", margin: "0 auto", display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea data-testid="chat-input" value={input} onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            onKeyDown={onKey} rows={1} placeholder="Skriv en besked…" disabled={streaming}
            style={{ flex: 1, resize: "none", minHeight: "44px", maxHeight: "160px", padding: "11px 14px", borderRadius: "10px", border: `1px solid ${c.border}`, background: c.panel, color: c.fg, fontSize: "15px", fontFamily: "inherit", outline: "none" }} />
          <button data-testid="chat-send" onClick={() => send(input)} disabled={streaming || !input.trim()}
            style={{ ...btn(c, true), height: "44px", padding: "0 18px", opacity: streaming || !input.trim() ? 0.5 : 1 }}>
            {streaming ? "…" : "Send"}
          </button>
        </div>
      </div>

      {/* Drawer */}
      {drawer && (
        <>
          <div data-testid="chat-drawer-backdrop" onClick={() => setDrawer(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 998 }} />
          <div data-testid="chat-drawer" style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "min(92vw,400px)", background: c.panel, borderRight: `1px solid ${c.border}`, zIndex: 999, display: "flex", flexDirection: "column", boxShadow: "0 0 40px rgba(0,0,0,.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 16px", borderBottom: `1px solid ${c.border}` }}>
              <button data-testid="chat-drawer-tab-chats" onClick={() => setDrawer("chats")} style={tab(c, drawer === "chats")}>Samtaler</button>
              <button data-testid="chat-drawer-tab-memory" onClick={() => setDrawer("memory")} style={tab(c, drawer === "memory")}>Hukommelse</button>
              <div style={{ flex: 1 }} />
              <button data-testid="chat-drawer-close" onClick={() => setDrawer(null)} style={{ ...btn(c), padding: "4px 10px" }}>Luk</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
              {drawer === "chats" ? (
                conversations.length === 0 ? <p style={{ color: c.muted, fontSize: "13px", padding: "12px" }}>Ingen samtaler endnu.</p> :
                conversations.map((cv) => (
                  <div key={cv.id} style={{ ...cardBase(c), padding: "10px 12px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    <button data-testid="chat-conv-load" onClick={() => loadConversation(cv.id)}
                      style={{ flex: 1, minWidth: 0, overflow: "hidden", textAlign: "left", background: "none", border: "none", color: c.fg, cursor: "pointer", padding: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cv.title}</div>
                      <div style={{ fontSize: "11px", color: c.muted }}>{relativeTime(cv.updatedAt)}</div>
                    </button>
                    {confirmConv === cv.id ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "0.65rem", color: "var(--destructive,#e5484d)", fontWeight: 500, padding: "0 2px" }}>Slet?</span>
                        <button data-testid="chat-conv-delete-yes" onClick={() => deleteConversation(cv.id)} style={confYes()}>Ja</button>
                        <button data-testid="chat-conv-delete-no" onClick={() => setConfirmConv(null)} style={confNo(c)}>Nej</button>
                      </span>
                    ) : (
                      <button data-testid="chat-conv-delete" onClick={() => setConfirmConv(cv.id)} aria-label="Slet samtale"
                        style={{ background: "none", border: "none", color: c.muted, cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>
                    )}
                  </div>
                ))
              ) : (
                memories.length === 0 ? <p style={{ color: c.muted, fontSize: "13px", padding: "12px" }}>Ingen hukommelse endnu. Ting du beder om huskes automatisk fra dine samtaler.</p> :
                memories.map((mem) => (
                  <div key={mem.id} style={{ ...cardBase(c), padding: "10px 12px", marginBottom: "6px", display: "flex", alignItems: "flex-start", gap: "8px", overflow: "hidden" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", overflowWrap: "break-word", wordBreak: "break-word" }}>{mem.fact}</div>
                      <div style={{ fontSize: "11px", color: c.muted, marginTop: "3px" }}>{mem.category}</div>
                    </div>
                    {confirmMem === mem.id ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "0.65rem", color: "var(--destructive,#e5484d)", fontWeight: 500, padding: "0 2px" }}>Slet?</span>
                        <button data-testid="chat-mem-delete-yes" onClick={() => deleteMemory(mem.id)} style={confYes()}>Ja</button>
                        <button data-testid="chat-mem-delete-no" onClick={() => setConfirmMem(null)} style={confNo(c)}>Nej</button>
                      </span>
                    ) : (
                      <button data-testid="chat-mem-delete" onClick={() => setConfirmMem(mem.id)} aria-label="Slet hukommelse"
                        style={{ background: "none", border: "none", color: c.muted, cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── "Hvad kan du?" — curated designed capabilities panel ─────────────────────
// Rendered client-side (static, instant, always Danish) instead of the flat AI
// markdown answer. A sentinel content string flags the message so it survives
// reload. Rollback = remove the sendQuick branch + this block → cached markdown.
const CAPABILITIES_MARK = "::capabilities-panel::";
type CapItem = { b: string; s?: string; chips?: string[] };
type CapGroup = { icon: () => any; label: string; items: CapItem[] };
type CapCat = { num: string; icon: () => any; title: string; groups: CapGroup[] };
const svgBase = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IcoLayers = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="m12 2 9 5-9 5-9-5 9-5z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></svg>);
const IcoFile = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>);
const IcoImage = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>);
const IcoSearch = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
const IcoSparkles = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" /></svg>);
const IcoPen = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>);
const IcoChevron = () => (<svg viewBox="0 0 24 24" strokeWidth={3} {...svgBase}><path d="m9 18 6-6-6-6" /></svg>);
const IcoBot = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M12 4v4" /><circle cx="9" cy="14" r="1" /><circle cx="15" cy="14" r="1" /></svg>);
const IcoServer = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><rect x="2" y="3" width="20" height="8" rx="2" /><rect x="2" y="13" width="20" height="8" rx="2" /><path d="M6 7h.01" /><path d="M6 17h.01" /></svg>);
const IcoSettings = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><line x1="21" y1="4" x2="14" y2="4" /><line x1="10" y1="4" x2="3" y2="4" /><line x1="21" y1="12" x2="12" y2="12" /><line x1="8" y1="12" x2="3" y2="12" /><line x1="21" y1="20" x2="16" y2="20" /><line x1="12" y1="20" x2="3" y2="20" /><line x1="14" y1="2" x2="14" y2="6" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="16" y1="18" x2="16" y2="22" /></svg>);
const IcoActivity = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>);
const IcoInbox = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>);
const IcoShield = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
const IcoRocket = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>);
const IcoEdit = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IcoZap = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>);
const IcoBox = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>);
const IcoGlobe = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>);
const IcoLanguages = () => (<svg viewBox="0 0 24 24" strokeWidth={2} {...svgBase}><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>);
const CAPS: CapCat[] = [
  { num: "01", icon: IcoLayers, title: "Indholdsstyring", groups: [
    { icon: IcoFile, label: "Dokumenter & kollektioner", items: [
      { b: "List, søg og læs", s: "alt indhold på tværs af kollektioner — Sektioner, Indlæg, Kategorier, Flagskibe, Løsninger, Globals" },
      { b: "Opret nye dokumenter", s: "blogindlæg, sektioner, flagskibe i enhver kollektion" },
      { b: "Opdatér eksisterende", s: "redigér titel, brødtekst, tags, billeder, SEO m.m." },
      { b: "Publicér eller afpublicér", s: "enkeltvis eller i bulk" },
      { b: "Flyt til papirkurv", s: "med bekræftelse" },
      { b: "Gendan & klon", s: "gendan fra papirkurv, eller lav en kopi som kladde" },
      { b: "Planlæg publicering", s: "til fremtidige datoer og tidspunkter" },
      { b: "Oversæt & bulk-oversæt", s: "enkelte dokumenter eller alle uoversatte til et målsprog" },
      { b: "Bulk-publicér", s: "alle kladder i én kollektion eller på hele sitet" },
      { b: "Bulk-opdatér felter", s: "fx tilføj et tag til alle indlæg eller skift en kategori" },
    ] },
    { icon: IcoImage, label: "Mediebibliotek", items: [
      { b: "List alle mediefiler", s: "billeder, video, lyd, dokumenter" },
      { b: "Søg i medier", s: "via AI-tekster, AI-tags, brugertags eller filnavne" },
      { b: "Find relevante billeder", s: "til et indlæg eller en sektion" },
      { b: "Indsæt medie-URLs", s: "cover-billeder, gallerier, indlejrede billeder" },
    ] },
    { icon: IcoSearch, label: "SEO & metadata", items: [
      { b: "Generér SEO-titler, -beskrivelser & -nøgleord", s: "til dine dokumenter" },
      { b: "Opdatér meta-felter", chips: ["metaTitle", "metaDescription", "ogImage"] },
      { b: "Optimér eksisterende indhold", s: "omskriv titler, uddrag eller beskrivelser til SEO" },
    ] },
  ] },
  { num: "02", icon: IcoSparkles, title: "AI-drevet indholdsskabelse", groups: [
    { icon: IcoPen, label: "Generér indhold", items: [
      { b: "Skriv nyt indhold", s: "til felter som", chips: ["body", "excerpt", "description"] },
      { b: "Omskriv eksisterende", s: "oversæt, forkort, skift tone, forenkl eller udvid" },
      { b: "Generér AI-billeder", s: "og gem dem direkte i mediebiblioteket" },
      { b: "Opret interaktive værktøjer", s: "beregnere, quizzer, formularer, grafer, widgets, mini-apps" },
    ] },
    { icon: IcoBot, label: "Agenter & workflows", items: [
      { b: "Administrér AI-agenter", s: "list, opret & redigér — tekstforfattere, SEO-specialister, oversættere" },
      { b: "Kør agenter", s: "generér indhold på kommando" },
      { b: "Byg workflows", s: "kæder af agenter (Skribent → SEO → Oversætter)" },
      { b: "Kør workflows", s: "automatisér flertrins-produktion" },
      { b: "Godkend eller afvis", s: "AI-indhold i kurateringskøen" },
      { b: "Gem agenter som skabeloner", s: "til genbrug" },
    ] },
  ] },
  { num: "03", icon: IcoServer, title: "Site-administration", groups: [
    { icon: IcoSettings, label: "Site-konfiguration", items: [
      { b: "Se & opdatér site-indstillinger", s: "navn, beskrivelse, navigation, footer, sociale links" },
      { b: "Tjek content-drift", s: "sammenlign CMS-indhold med det live site" },
    ] },
    { icon: IcoActivity, label: "Analyse & ydeevne", items: [
      { b: "Kør Lighthouse / PageSpeed", s: "audit af ydeevne, tilgængelighed, SEO & best practices" },
      { b: "Se score-historik", s: "følg forbedringer over tid" },
    ] },
    { icon: IcoInbox, label: "Formularer & indsendelser", items: [
      { b: "List formular-indsendelser", s: "kontaktformularer, tilmeldinger" },
      { b: "Læs fulde detaljer", s: "beskedindhold og afsender-info" },
      { b: "Se formular-statistik", s: "ulæste og indsendelses-tendenser" },
    ] },
    { icon: IcoShield, label: "Backup & vedligehold", items: [
      { b: "Opret backups", s: "af sitets indhold" },
      { b: "Se indholds-statistik", s: "ordtal, dokumenttal, AI- vs. menneske-forhold" },
      { b: "List & gendan revisioner", s: "for dokumenter" },
      { b: "Tjek for døde links", s: "på tværs af sitet" },
      { b: "Tøm papirkurv", s: "slet permanent" },
    ] },
    { icon: IcoRocket, label: "Deployments", items: [
      { b: "Byg sitet", s: "regenerér statiske sider" },
      { b: "Deploy", s: "push ændringer til det live site" },
      { b: "Se deploy-historik" },
    ] },
  ] },
  { num: "04", icon: IcoEdit, title: "Redigering & samarbejde", groups: [
    { icon: IcoEdit, label: "", items: [
      { b: "Vis inline-redigeringsformularer", s: "for bestemte felter — fx titel og uddrag" },
      { b: "Forhåndsvis dokumenter", s: "med direkte preview-links" },
      { b: "Søg i hukommelse", s: "fra tidligere samtaler" },
      { b: "Tilføj hukommelse", s: "fx 'brug altid britisk engelsk til denne kunde'" },
      { b: "Glem hukommelse", s: "fjern en tidligere note" },
    ] },
  ] },
  { num: "05", icon: IcoZap, title: "Avancerede funktioner", groups: [
    { icon: IcoBox, label: "Interaktivt indhold", items: [
      { b: "Generér interaktive HTML-værktøjer", s: "beregnere, quizzer, formularer, grafer, sliders, spil" },
      { b: "Forhåndsvis interaktive live", s: "direkte i chatten" },
      { b: "Gem interaktive", s: "til indlejring på sider" },
    ] },
    { icon: IcoGlobe, label: "Websøgning & hentning", items: [
      { b: "Søg på nettet", s: "aktuelle fakta, tendenser, nylige begivenheder" },
      { b: "Hent indhold fra en URL", s: "fx 'opsummér denne artikel til et blogindlæg'" },
    ] },
    { icon: IcoLanguages, label: "Flersproget", items: [
      { b: "Oversæt enkelte dokumenter", s: "opretter linkede oversættelser" },
      { b: "Bulk-oversæt alle uoversatte", s: "til et målsprog" },
      { b: "Sæt agent-sprog", s: "fx en dansk og en engelsk skribent til samme site" },
    ] },
  ] },
];
const CAPS_CSS = `.chat-caps{max-width:100%}.chat-caps .caps-intro{color:#8a8a8a;font-size:15px;line-height:1.55;margin:0 0 22px}.chat-caps .caps-intro .brand{color:var(--orange-text,#ff6a45);font-weight:600}.chat-caps .cat{position:relative;background:#161616;border:1px solid #2a2a2a;border-radius:16px;padding:22px 24px 18px;margin-bottom:16px;overflow:hidden}.chat-caps .cat::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--orange-text,#ff6a45),transparent 78%)}.chat-caps .cat-num{position:absolute;top:12px;right:20px;font-family:var(--fd,"Cormorant Garamond",Georgia,serif);font-weight:600;font-size:44px;line-height:1;color:#f0f4f8;opacity:.06;pointer-events:none}.chat-caps .cat-head{display:flex;align-items:center;gap:12px;margin-bottom:18px}.chat-caps .cat-ic{width:38px;height:38px;border-radius:11px;flex-shrink:0;background:rgba(255,106,69,.12);border:1px solid rgba(255,106,69,.30);display:flex;align-items:center;justify-content:center;color:var(--orange-text,#ff6a45)}.chat-caps .cat-ic svg{width:20px;height:20px}.chat-caps .cat-head h2{font-family:var(--fd,"Cormorant Garamond",Georgia,serif);font-weight:600;font-size:23px;letter-spacing:.2px;margin:0;color:#f0f4f8}.chat-caps .group{margin-top:16px}.chat-caps .group:first-of-type{margin-top:0}.chat-caps .group-label{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:.9px;text-transform:uppercase;color:var(--orange-text,#ff6a45)}.chat-caps .group-label svg{width:14px;height:14px;flex-shrink:0}.chat-caps .group-label .rule{flex:1;height:1px;background:#2a2a2a;margin-left:4px}.chat-caps .items{display:grid;grid-template-columns:1fr 1fr;gap:2px 28px}@media(max-width:560px){.chat-caps .items{grid-template-columns:1fr}}.chat-caps .item{display:flex;gap:9px;padding:7px 6px 7px 0;border-radius:8px;transition:background .14s}.chat-caps .item:hover{background:#1c1c1c}.chat-caps .item .mk{flex-shrink:0;margin-top:3px;color:var(--orange-text,#ff6a45);opacity:.85}.chat-caps .item .mk svg{width:13px;height:13px;display:block}.chat-caps .item .tx b{display:block;color:#f0f4f8;font-weight:600;font-size:13.5px;line-height:1.35}.chat-caps .item .tx span{display:block;color:#b8bdc4;font-size:12.5px;line-height:1.45;margin-top:1px}.chat-caps .item .tx code{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:.82em;padding:1px 6px;border-radius:5px;background:rgba(255,106,69,.10);border:1px solid rgba(255,106,69,.26);color:var(--orange-text,#ff6a45);margin-right:4px}`;
function Capabilities() {
  return (
    <div class="chat-caps" data-testid="chat-capabilities">
      <p class="caps-intro">Her er et komplet overblik over alt, jeg kan hjælpe dig med på <span class="brand">broberg.ai</span> — organiseret efter funktion.</p>
      {CAPS.map((cat) => (
        <section class="cat" key={cat.num}>
          <span class="cat-num">{cat.num}</span>
          <div class="cat-head">
            <span class="cat-ic">{cat.icon()}</span>
            <h2>{cat.title}</h2>
          </div>
          {cat.groups.map((g) => (
            <div class="group" key={g.label}>
              {g.label ? <div class="group-label">{g.icon()} {g.label} <span class="rule" /></div> : null}
              <div class="items">
                {g.items.map((it) => (
                  <div class="item" key={it.b}>
                    <span class="mk"><IcoChevron /></span>
                    <div class="tx">
                      <b>{it.b}</b>
                      {it.s || it.chips ? (
                        <span>{it.s}{it.s && it.chips ? " " : ""}{(it.chips ?? []).map((cc) => <code key={cc}>{cc}</code>)}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

// ── Message ───────────────────────────────────────────────────────────────────
function Message({ m, c }: { m: Msg; c: Record<string, string> }) {
  if (m.content === CAPABILITIES_MARK) {
    return (
      <div data-testid="chat-msg-assistant" style={{ margin: "0 0 20px" }}>
        <Capabilities />
      </div>
    );
  }
  if (m.role === "user") {
    return (
      <div data-testid="chat-msg-user" style={{ display: "flex", justifyContent: "flex-end", margin: "0 0 16px" }}>
        <div style={{ maxWidth: "85%", background: c.accent, color: "#0d0d0d", padding: "10px 14px", borderRadius: "14px 14px 4px 14px", fontSize: "15px", whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word", fontWeight: 500 }}>{m.content}</div>
      </div>
    );
  }
  return (
    <div data-testid="chat-msg-assistant" style={{ margin: "0 0 20px" }}>
      {m.thinking ? (
        <div data-testid="chat-thinking" style={{ fontSize: "12px", color: c.muted, fontStyle: "italic", marginBottom: "8px", whiteSpace: "pre-wrap", borderLeft: `2px solid ${c.border}`, paddingLeft: "10px" }}>{m.thinking}</div>
      ) : null}
      {(m.toolCalls ?? []).map((tc, i) => (
        <div key={i} data-testid="chat-tool-call" style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: c.panel, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "5px 10px", fontSize: "12px", color: c.muted, marginBottom: "6px", marginRight: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: tc.status === "running" ? c.accent : "#3fb950", flex: "0 0 auto", animation: tc.status === "running" ? "chatpulse 1s infinite" : "none" }} />
          <span style={{ color: c.fg }}>{toolLabel(tc.tool)}</span>
          {toolDetail(tc.input) ? <span>· {toolDetail(tc.input)}</span> : null}
        </div>
      ))}
      {m.content ? (
        m.isStreaming ? (
          // While streaming render PLAIN text (no per-frame markdown re-parse —
          // that pegged mobile Safari's main thread). Markdown applies once done.
          <div data-testid="chat-markdown" style={{ fontSize: "15px", lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>{m.content}</div>
        ) : (
          <div data-testid="chat-markdown" class="chat-md" style={{ fontSize: "15px", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
        )
      ) : m.isStreaming ? (
        <ThinkingDots c={c} startedAt={m.startedAt} />
      ) : null}
    </div>
  );
}

// Claude-inspired "thinking" animation (ported from cms-admin's chat), in the
// broberg .ai orange. Shown while the answer is generating — the CMS chat sends
// its text only when the whole (often 30-60s) agentic turn finishes, so without
// this the surface looks hung.
function ThinkingDots({ c, startedAt }: { c: Record<string, string>; startedAt?: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const time = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  return (
    <div data-testid="chat-thinking-dots" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ position: "relative", width: "28px", height: "28px" }}>
        <div style={{ position: "absolute", inset: "-2px", borderRadius: "50%", border: `1.5px solid ${c.accent}`, animation: "chat-ring 2.4s ease-in-out infinite" }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: "5px", height: "5px", marginTop: "-2.5px", marginLeft: "-2.5px", borderRadius: "50%", background: c.accent, animation: "chat-orbit 1.8s cubic-bezier(0.4,0,0.2,1) infinite", animationDelay: `${i * -0.6}s` }} />
        ))}
        <div style={{ position: "absolute", top: "50%", left: "50%", width: "4px", height: "4px", marginTop: "-2px", marginLeft: "-2px", borderRadius: "50%", background: c.accent, opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: "13px", color: c.muted, fontStyle: "italic" }}>Tænker…</span>
      {elapsed > 0 ? <span style={{ fontSize: "12px", color: c.muted, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>{time}</span> : null}
    </div>
  );
}

// ── Small style helpers ───────────────────────────────────────────────────────
function btn(c: Record<string, string>, primary = false) {
  return {
    background: primary ? c.accent : c.panel, color: primary ? "#0d0d0d" : c.fg,
    border: primary ? "none" : `1px solid ${c.border}`, borderRadius: "8px",
    padding: "7px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
  } as const;
}
function tab(c: Record<string, string>, active: boolean) {
  return {
    background: active ? c.accent : "transparent", color: active ? "#0d0d0d" : c.fg,
    border: active ? "none" : `1px solid ${c.border}`, borderRadius: "8px",
    padding: "6px 12px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
  } as const;
}
function cardBase(c: Record<string, string>) {
  return { background: c.panel, border: `1px solid ${c.border}`, borderRadius: "10px", color: c.fg } as const;
}
// Inline quick-action icons (no icon lib in this repo) — accent-coloured, 17px, lucide-style.
function quickIcon(key: string, color: string) {
  const s = { color, flexShrink: 0 } as const;
  switch (key) {
    case "overview":
      return (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>);
    case "drafts":
      return (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>);
    case "capabilities":
      return (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>);
    case "site-info":
      return (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="21" y1="4" x2="14" y2="4" /><line x1="10" y1="4" x2="3" y2="4" /><line x1="21" y1="12" x2="12" y2="12" /><line x1="8" y1="12" x2="3" y2="12" /><line x1="21" y1="20" x2="16" y2="20" /><line x1="12" y1="20" x2="3" y2="20" /><line x1="14" y1="2" x2="14" y2="6" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="16" y1="18" x2="16" y2="22" /></svg>);
    default:
      return null;
  }
}
function confYes() {
  return { fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: "3px", border: "none", background: "var(--destructive,#e5484d)", color: "#fff", cursor: "pointer", lineHeight: 1 } as const;
}
function confNo(c: Record<string, string>) {
  return { fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: "3px", border: `1px solid ${c.border}`, background: "transparent", color: c.fg, cursor: "pointer", lineHeight: 1 } as const;
}

// ── Mount ─────────────────────────────────────────────────────────────────────
export function mountAdminChat() {
  const root = document.getElementById("admin-chat-root");
  if (!root) return;
  const token = getConnectedToken(CMS);
  if (!token) { window.location.href = buildConnectUrl(CMS, window.location.href); return; }
  // Inject the one keyframe the pills/cursor need.
  if (!document.getElementById("chat-anim")) {
    const st = document.createElement("style");
    st.id = "chat-anim";
    // F158.2: the .chat-md rules come from the shared @broberg/cms-chat-client
    // (CHAT_MARKDOWN_CSS) — one source across all consumers. Only the
    // broberg-specific keyframes + brand-responsive rules stay local.
    st.textContent = `@keyframes chatpulse{0%,100%{opacity:1}50%{opacity:.35}}@keyframes chat-orbit{0%{transform:rotate(0deg) translateX(9px) rotate(0deg);opacity:1}33%{opacity:.6}66%{opacity:1}100%{transform:rotate(360deg) translateX(9px) rotate(-360deg);opacity:1}}@keyframes chat-ring{0%,100%{transform:scale(.85);opacity:.2}50%{transform:scale(1.1);opacity:.06}}${CHAT_MARKDOWN_CSS}${CAPS_CSS}.chat-lbl-mini{display:none}@media(max-width:520px){.chat-brand{display:none}.chat-lbl-full{display:none}.chat-lbl-mini{display:inline}}`;
    document.head.appendChild(st);
  }
  root.style.cssText = "";
  render(<ChatApp />, root);
}
