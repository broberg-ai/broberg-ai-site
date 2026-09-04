/* Segl for Aidan-ruten (bærende: et OFFENTLIGT LLM-endpoint). Rødt hvis
   ship-dark-vagten, rate-limit-spærren eller primer-lagene regredierer.
   Ingen levende netværk — modellen er en stub gennem samme AiClient-interface. */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import type { AiClient, ChatStreamEvent } from "@broberg/ai-sdk";
import {
  handleAidanChat,
  handleAidanHealth,
  aidanConfigured,
  aidanSystemPrompt,
  resetAidanForTest,
} from "./aidan.ts";

const app = () => {
  const a = new Hono();
  a.post("/api/aidan/chat", handleAidanChat);
  a.get("/api/aidan/health", handleAidanHealth);
  return a;
};

function stubKlient(deltas: string[]): AiClient {
  return {
    async *chatStream(): AsyncIterable<ChatStreamEvent> {
      for (const d of deltas) yield { type: "text", delta: d };
      yield { type: "finish", reason: "stop" } as unknown as ChatStreamEvent;
    },
  } as unknown as AiClient;
}

const KEY = "MISTRAL_API_KEY";
let gemt: string | undefined;
beforeEach(() => {
  gemt = process.env[KEY];
  resetAidanForTest();
});
afterEach(() => {
  if (gemt === undefined) delete process.env[KEY];
  else process.env[KEY] = gemt;
  resetAidanForTest();
});

describe("ship-dark", () => {
  test("uden nøgle: chat svarer 503 og health siger nej", async () => {
    delete process.env[KEY];
    expect(aidanConfigured()).toBe(false);
    const res = await app().request("/api/aidan/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hej" }] }),
    });
    expect(res.status).toBe(503);
    const h = await app().request("/api/aidan/health");
    expect(h.status).toBe(503);
  });
});

describe("chatten", () => {
  beforeEach(() => {
    process.env[KEY] = "test-noegle";
    resetAidanForTest(stubKlient(["Hej ", "fra Aidan"]));
  });

  test("streamer svaret som SSE og ender med done", async () => {
    const res = await app().request("/api/aidan/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hvem er du?" }], locale: "da" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const krop = await res.text();
    expect(krop).toContain('event: text');
    expect(krop).toContain('"delta":"Hej "');
    expect(krop).toContain('"delta":"fra Aidan"');
    expect(krop).toContain("event: done");
  });

  test("afviser en tom eller assistent-sidst historik", async () => {
    for (const messages of [[], [{ role: "assistant", content: "x" }]]) {
      const res = await app().request("/api/aidan/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
      });
      expect(res.status).toBe(400);
    }
  });

  test("rate-limit: niende besked i samme minut fra samme IP afvises", async () => {
    const a = app();
    const kald = () =>
      a.request("/api/aidan/chat", {
        method: "POST",
        headers: { "fly-client-ip": "203.0.113.7" },
        body: JSON.stringify({ messages: [{ role: "user", content: "hej" }] }),
      });
    for (let i = 0; i < 8; i++) expect((await kald()).status).toBe(200);
    expect((await kald()).status).toBe(429);
  });

  test("rate-limit rammer IP'en, ikke naboen", async () => {
    const a = app();
    for (let i = 0; i < 8; i++) {
      await a.request("/api/aidan/chat", {
        method: "POST",
        headers: { "fly-client-ip": "203.0.113.7" },
        body: JSON.stringify({ messages: [{ role: "user", content: "hej" }] }),
      });
    }
    const anden = await a.request("/api/aidan/chat", {
      method: "POST",
      headers: { "fly-client-ip": "198.51.100.9" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hej" }] }),
    });
    expect(anden.status).toBe(200);
  });
});

describe("primeren", () => {
  test("bærer alle tre lag: kontrakt, backstory, levende sitekort", async () => {
    const p = await aidanSystemPrompt("da");
    // Lag 1 — kontrakten (spec §5, HJEMME-form)
    expect(p).toContain("Du påstår ikke noget du ikke har set");
    expect(p).toContain("DU MÅ IKKE");
    // Lag 2 — backstoryen, genkendt på en sætning der KUN findes dér
    expect(p).toContain("Aidan er ikke købt ind. Han er vokset op her.");
    // Lag 2's egen advarsel skal være omsat til instruks
    expect(p).toContain("markedsføringstal");
    // Lag 3 — det levende sitekort
    expect(p).toContain("LEVENDE SITEKORT");
  });

  test("engelsk locale giver den engelske kontrakt og backstory", async () => {
    const p = await aidanSystemPrompt("en");
    expect(p).toContain("You do not claim what you have not seen");
    expect(p).not.toContain("Du påstår ikke");
  });
});
