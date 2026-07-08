# F002 — broberg.ai admin AI chat (full CMS palette + history + memory)

## Motivation

broberg.ai/admin should have the SAME AI chat as (a) **webhouse.app/admin's "Chat with your site"** — the full ~64-tool build/version/control palette — and (b) **sanne's `/admin-chat` UX**: a dedicated full-screen surface with conversation history, memory, and quick-action pills. The promise in the broberg.ai articles is "talk to your website"; this makes that literal, and it is a strong sales demo for new customers.

The chat must be able to **build, version and control the site by conversation** — create/update/publish content, revisions, trigger deploy, translate, curate, lighthouse, forms, agents, memory, workflows, etc. Later it must also answer from a **Trail knowledge base** via a first-class adapter (broberg has no Trail KB yet — deferred). Finally the surface is **extracted into a shared `@broberg/*` npm** so broberg (Stack B), sanne (Stack A) and future sites share one implementation — closing the drift where the chat UI is today copied 1:1 across cms-admin and sanne.

## Decisions (confirmed with Christian 2026-07-08)

- **Tool access = PROXY.** broberg's own backend relays the SSE stream to cms-admin's existing 65-tool chat (`POST /api/cms/chat?site=broberg-ai`) server-to-server. No tool re-implementation; single source (cms-admin owns tools + orchestration + LLM). (NOT: broberg re-defining tools locally like sanne did.)
- **History + memory = SHARED with the CMS.** Same store as webhouse.app's chat for broberg-ai (one source of truth — the same conversations + memory appear both places). broberg relays the conversations + memory endpoints.
- **Trail = a config-gated tool-provider adapter (`TrailKbAdapter`) in the CMS chat.** Any site's chat gains `trail_search` / `trail_list_kbs` / `trail_image_search` once a Trail KB is connected via site-config. Deferred (broberg KB post-Sunday); the adapter/interface is designed in from the start and becomes part of the shared npm contract.
- **LLM = same as CMS/sanne** — @broberg/ai-sdk, Mistral-EU (`mistral-large-latest`, "code" tier). Inherited automatically via the proxy.

## Architecture (Phase 1)

```
Browser (broberg.ai/admin/chat, Preact)
   |  same-origin fetch POST /api/admin/chat  (SSE)
   v
broberg Hono backend  /api/admin/chat  (thin relay, admin-gated)
   |  server->server fetch, secret token, ?site=broberg-ai
   v
webhouse.app  POST /api/cms/chat?site=broberg-ai
   - proxy.ts turns X-CMS-Service-Token (CMS_JWT_SECRET) or Bearer wh_... into an admin cms-session
   - 65-tool agentic loop (buildChatTools), Mistral-EU
   - custom SSE: event: text|thinking|tool_call|tool_result|form|artifact|done|error
   <-- stream piped straight back through the relay to the browser
```

- **Auth (two layers):** (1) broberg's `/admin/chat` route + relay is gated to the **connected admin** (the inline-edit / cb-session broberg/admin already uses). (2) the relay authenticates to cms-admin with a **secret token** (`X-CMS-Service-Token: $CMS_JWT_SECRET` OR a scoped `Bearer wh_...`) that lives ONLY on broberg's backend (Fly secret) — never in a browser bundle. `?site=broberg-ai` scopes the tenant (proxy.ts injects `cms-active-*` cookies).
- **No CORS change needed on cms-admin** — the browser talks only to broberg's own origin; the cross-origin hop is server-to-server (CORS-exempt). (`POST /api/cms/chat` has no CORS today; a direct-browser client would need it — we avoid that by relaying.)
- **History + memory:** broberg relays `/api/admin/chat/conversations*` -> `/api/cms/chat/conversations*?site=broberg-ai` and `/api/admin/chat/memory*` -> `/api/cms/chat/memory*?site=broberg-ai`. Shared store in cms-admin (keyed by a stable admin userId so it matches what cb sees in webhouse.app/admin for broberg-ai).
- **UI:** Preact full-screen route `/admin/chat` porting cms-admin's `chat-interface.tsx` behaviour (SSE parse via fetch+reader, tool-call cards, markdown, thinking, inline-form/artifact) + left panel with **Samtaler** (history) + **Hukommelse** (memory) + quick-actions + Ny chat / Historik. Linked from the `/admin` Værktøjer dropdown.

## Scope

### Phase 1 — broberg chat working (Sunday target)
- Relay backend (chat + conversations + memory), admin-gated, secret token server-side, ship-dark.
- Full-screen `/admin/chat` Preact UI (stream, tool cards, history, memory, quick-actions).
- Værktøjer-dropdown entry -> /admin/chat.
- All ~64 CMS tools reachable; verified against real broberg-ai content.

### Phase 2 — extract to `@broberg/*` npm (after Phase 1 proven)
- Factor UI shell + SSE relay-client + relay helper into a shared package (components-owned). cms-admin + broberg + sanne consume it. Trail-aware rendering included. Discovery-enrolled.

### Phase 3 — Trail KB adapter (deferred, post-Sunday)
- `TrailKbAdapter` tool-provider in cms-admin's chat, config-gated per site (site-config `trailKbId` + token). Dark until configured. broberg connects its KB later. Lands in the cms repo (cms-admin chat) + becomes part of the shared npm's Trail-aware rendering contract.

### Non-goals
- No re-implementation of the 64 tools in broberg (proxy handles it).
- No separate broberg-local history/memory store (shared with CMS).
- No CORS/direct-browser access to cms-admin's chat (proxy avoids it; could be added later).
- Not building broberg's Trail KB itself (separate work, post-Sunday).

## Dependencies
- cms-admin `POST /api/cms/chat` (+ `/api/cms/chat/conversations*`, `/api/cms/chat/memory*`) — exist, token + `?site=` callable today (proxy.ts translates `X-CMS-Service-Token` / `Bearer wh_` -> admin cms-session).
- A relay secret: prefer a **scoped `wh_` access token** minted in cms-admin (Account -> Access Tokens) for broberg-ai (least privilege) over the master `CMS_JWT_SECRET`; decide at build. Stored as a Fly secret on broberg-ai.
- broberg /admin connected-admin auth (inline-edit session) for gating the route.
- @broberg/ai-sdk (used by cms-admin; inherited via proxy).

## Rollout
1. Phase 1 behind the existing /admin connected-admin gate. Relay token as a Fly secret (ship-dark: no token -> chat shows a clear "not configured" state, no crash).
2. Verify with Lens + real tool calls on broberg-ai ("list my drafts", "what can you do?", a safe read tool).
3. Phase 2 npm extraction with parity (replace-then-prove, never a naked cutover).
4. Phase 3 Trail adapter when broberg's KB exists.

## Verification
- Relay streams the full SSE; a CMS tool call returns real broberg-ai data.
- Relay token never in the client bundle (grep the built bundle).
- Unauthed `/admin/chat` -> bounce to connect; only the connected admin passes.
- History + memory shared with webhouse.app's broberg-ai chat (same items both places).
- Lens capture of `/admin/chat` green; every interactive element has a semantic `data-testid`.
