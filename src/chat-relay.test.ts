/* Seal for the CMS AI-chat relay (load-bearing: it can drive broberg-ai's ~64
   build/version/control tools). These tests fail RED if the auth gate or the
   ship-dark guard regress. No live network — fetch is stubbed. */
import { describe, test, expect, afterEach } from "bun:test";
import { Hono } from "hono";
import { handleAdminChat, handleAdminChatApi } from "./chat-relay.ts";

const realFetch = globalThis.fetch;

function app() {
  const a = new Hono();
  a.post("/api/admin/chat", handleAdminChat);
  a.all("/api/admin/chat/*", handleAdminChatApi);
  return a;
}

/** Stub fetch: probe (`__auth_probe__`) → probeStatus; anything else → upstream. */
function stubFetch(opts: {
  probeStatus?: number;
  upstream?: () => Response;
  onUpstreamUrl?: (url: string) => void;
  failIfCalled?: boolean;
}) {
  globalThis.fetch = (async (input: unknown) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (opts.failIfCalled) throw new Error(`fetch must not be called (url=${url})`);
    if (url.includes("__auth_probe__")) return new Response("", { status: opts.probeStatus ?? 404 });
    opts.onUpstreamUrl?.(url);
    return opts.upstream
      ? opts.upstream()
      : new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
}

function sseUpstream(text: string): () => Response {
  return () =>
    new Response(
      new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(new TextEncoder().encode(`event: text\ndata: {"text":"${text}"}\n\n`));
          ctrl.close();
        },
      }),
      { status: 200, headers: { "content-type": "text/event-stream" } },
    );
}

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.CMS_ADMIN_TOKEN;
});

describe("chat-relay auth gate", () => {
  test("ship-dark: no CMS_ADMIN_TOKEN → 503, upstream never touched", async () => {
    delete process.env.CMS_ADMIN_TOKEN;
    stubFetch({ failIfCalled: true });
    const res = await app().request("/api/admin/chat", {
      method: "POST",
      headers: { Authorization: "Bearer whatever", "Content-Type": "application/json" },
      body: '{"messages":[]}',
    });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("chat_not_configured");
  });

  test("no Authorization header → 401, never calls upstream", async () => {
    process.env.CMS_ADMIN_TOKEN = "wh_test";
    stubFetch({ failIfCalled: true }); // any fetch (even the probe) is a failure here
    const res = await app().request("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"messages":[]}',
    });
    expect(res.status).toBe(401);
  });

  test("valid token but wrong site (probe 403) → 401", async () => {
    process.env.CMS_ADMIN_TOKEN = "wh_test";
    let upstreamHit = false;
    stubFetch({ probeStatus: 403, onUpstreamUrl: () => { upstreamHit = true; } });
    const res = await app().request("/api/admin/chat", {
      method: "POST",
      headers: { Authorization: "Bearer wrong-site", "Content-Type": "application/json" },
      body: '{"messages":[]}',
    });
    expect(res.status).toBe(401);
    expect(upstreamHit).toBe(false);
  });

  test("expired/invalid token (probe 401) → 401", async () => {
    process.env.CMS_ADMIN_TOKEN = "wh_test";
    stubFetch({ probeStatus: 401 });
    const res = await app().request("/api/admin/chat", {
      method: "POST",
      headers: { Authorization: "Bearer expired", "Content-Type": "application/json" },
      body: '{"messages":[]}',
    });
    expect(res.status).toBe(401);
  });
});

describe("chat-relay happy path", () => {
  test("authed → streams cms-admin SSE straight through", async () => {
    process.env.CMS_ADMIN_TOKEN = "wh_test";
    let upstreamUrl = "";
    stubFetch({ probeStatus: 404, upstream: sseUpstream("hello"), onUpstreamUrl: (u) => (upstreamUrl = u) });
    const res = await app().request("/api/admin/chat", {
      method: "POST",
      headers: { Authorization: "Bearer good", "Content-Type": "application/json" },
      body: '{"messages":[{"role":"user","content":"hi"}]}',
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(upstreamUrl).toContain("/api/cms/chat?site=broberg-ai");
    expect(await res.text()).toContain('"text":"hello"');
  });

  test("conversations relay forwards to cms-admin with site forced", async () => {
    process.env.CMS_ADMIN_TOKEN = "wh_test";
    let upstreamUrl = "";
    stubFetch({
      probeStatus: 404,
      onUpstreamUrl: (u) => (upstreamUrl = u),
      upstream: () =>
        new Response('{"conversations":[]}', { status: 200, headers: { "content-type": "application/json" } }),
    });
    const res = await app().request("/api/admin/chat/conversations", {
      headers: { Authorization: "Bearer good" },
    });
    expect(res.status).toBe(200);
    expect(upstreamUrl).toContain("/api/cms/chat/conversations");
    expect(upstreamUrl).toContain("site=broberg-ai");
  });
});
