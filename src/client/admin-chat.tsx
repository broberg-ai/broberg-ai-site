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
  // Open links in a new tab (admin surface, external targets).
  return html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}

// ── Quick actions (empty state) ───────────────────────────────────────────────
const SUGGESTIONS: { label: string; message: string }[] = [
  { label: "Overblik over sitet", message: "Giv mig et overblik over mit site — hvor mange kollektioner, dokumenter og kladder har jeg?" },
  { label: "Vis mine kladder", message: "Vis alle upublicerede kladder på tværs af kollektioner." },
  { label: "Hvad kan du?", message: "List alle de værktøjer og ting du kan hjælpe mig med på mit site." },
  { label: "Site-info", message: "Fortæl mig alt om mit site — kollektioner, felter, indstillinger og indholds-statistik." },
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
  const send = useCallback(async (text: string) => {
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
          if (event === "text") update((m) => ({ ...m, content: m.content + (data.text ?? "") }));
          else if (event === "thinking") update((m) => ({ ...m, thinking: (m.thinking ?? "") + (data.text ?? "") }));
          else if (event === "tool_call") update((m) => ({ ...m, toolCalls: [...(m.toolCalls ?? []), { tool: data.tool, input: data.input, status: "running" }] }));
          else if (event === "tool_result") update((m) => {
            const tcs = [...(m.toolCalls ?? [])];
            const i = tcs.findIndex((t) => t.tool === data.tool && t.status === "running");
            if (i >= 0) tcs[i] = { ...tcs[i], result: data.result, status: "done" };
            return { ...m, toolCalls: tcs };
          });
          else if (event === "artifact") update((m) => ({ ...m, content: m.content + `\n\n**${data.title ?? "Artefakt"}**` }));
          else if (event === "error") update((m) => ({ ...m, content: m.content + `\n\nFejl: ${data.message ?? "ukendt"}`, isStreaming: false }));
          event = "";
        }
      }
    } catch {
      update((m) => ({ ...m, content: m.content || "Forbindelsen blev afbrudt. Prøv igen.", isStreaming: false }));
    } finally {
      update((m) => ({ ...m, isStreaming: false }));
      setStreaming(false);
      const finalMsgs = messagesRef.current;
      saveConversation(convId, finalMsgs);
      loadConversations();
    }
  }, [streaming, convId, saveConversation, loadConversations]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const c = {
    bg: "#0d0d0d", panel: "#161616", panel2: "#1c1c1c", border: "#2a2a2a",
    fg: "#f0f4f8", muted: "#8a8a8a", accent: "var(--orange-text, #ff6a45)",
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: c.bg, color: c.fg, fontFamily: "system-ui,-apple-system,sans-serif" }} data-testid="admin-chat-app">
      {/* Action bar — the only chrome (no stacked admin header). */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", padding: "10px 16px", borderBottom: `1px solid ${c.border}` }}>
        <span style={{ fontWeight: 700, fontSize: "15px", marginRight: "4px" }}>broberg<span style={{ color: c.accent }}>.ai</span></span>
        <button data-testid="chat-new" onClick={newChat} style={btn(c, true)}>Ny chat</button>
        <button data-testid="chat-open-conversations" onClick={() => { setDrawer("chats"); loadConversations(); }} style={btn(c)}>Samtaler</button>
        <button data-testid="chat-open-memory" onClick={() => { setDrawer("memory"); loadMemories(); }} style={btn(c)}>
          Hukommelse{memories.length ? ` (${memories.length})` : ""}
        </button>
        <div style={{ flex: 1 }} />
        <a data-testid="chat-exit" href="/" style={{ ...btn(c), textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>Forlad →</a>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }} data-testid="chat-messages">
        <div style={{ maxWidth: "768px", margin: "0 auto" }}>
          {messages.length === 0 ? (
            <div data-testid="chat-welcome" style={{ textAlign: "center", paddingTop: "8vh" }}>
              <h1 style={{ fontSize: "26px", fontWeight: 600, margin: "0 0 8px" }}>Snak med dit site</h1>
              <p style={{ color: c.muted, fontSize: "15px", margin: "0 0 28px" }}>
                Spørg om hvad som helst på <b style={{ color: c.fg }}>broberg.ai</b> — jeg kender dit skema, dit indhold og dine indstillinger, og kan bygge, rette og udgive for dig.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px", textAlign: "left" }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} data-testid="chat-suggestion" onClick={() => send(s.message)}
                    style={{ ...cardBase(c), cursor: "pointer", padding: "14px 16px", fontSize: "14px" }}>
                    {s.label}
                  </button>
                ))}
              </div>
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
                  <div key={cv.id} style={{ ...cardBase(c), padding: "10px 12px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <button data-testid="chat-conv-load" onClick={() => loadConversation(cv.id)}
                      style={{ flex: 1, textAlign: "left", background: "none", border: "none", color: c.fg, cursor: "pointer", padding: 0 }}>
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
                  <div key={mem.id} style={{ ...cardBase(c), padding: "10px 12px", marginBottom: "6px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px" }}>{mem.fact}</div>
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

// ── Message ───────────────────────────────────────────────────────────────────
function Message({ m, c }: { m: Msg; c: Record<string, string> }) {
  if (m.role === "user") {
    return (
      <div data-testid="chat-msg-user" style={{ display: "flex", justifyContent: "flex-end", margin: "0 0 16px" }}>
        <div style={{ maxWidth: "85%", background: c.accent, color: "#0d0d0d", padding: "10px 14px", borderRadius: "14px 14px 4px 14px", fontSize: "15px", whiteSpace: "pre-wrap", fontWeight: 500 }}>{m.content}</div>
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
        <div data-testid="chat-markdown" class="chat-md" style={{ fontSize: "15px", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
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
    st.textContent = "@keyframes chatpulse{0%,100%{opacity:1}50%{opacity:.35}}@keyframes chat-orbit{0%{transform:rotate(0deg) translateX(9px) rotate(0deg);opacity:1}33%{opacity:.6}66%{opacity:1}100%{transform:rotate(360deg) translateX(9px) rotate(-360deg);opacity:1}}@keyframes chat-ring{0%,100%{transform:scale(.85);opacity:.2}50%{transform:scale(1.1);opacity:.06}}.chat-md a{color:var(--orange-text,#ff6a45)}.chat-md pre{background:#161616;border:1px solid #2a2a2a;border-radius:8px;padding:12px;overflow:auto}.chat-md code{font-family:ui-monospace,monospace;font-size:.9em}.chat-md h1,.chat-md h2,.chat-md h3{margin:.8em 0 .4em}.chat-md ul,.chat-md ol{padding-left:1.4em}.chat-md p{margin:.5em 0}.chat-md table{border-collapse:collapse;width:100%;font-size:.9em;margin:.5em 0}.chat-md th,.chat-md td{border:1px solid #2a2a2a;padding:5px 9px;text-align:left}";
    document.head.appendChild(st);
  }
  root.style.cssText = "";
  render(<ChatApp />, root);
}
