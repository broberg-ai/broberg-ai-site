/* Segl for det faste Trail-job (F007.3) — webhook-modtagelse + planlægning.
   Ingen levende netværk; ingen rigtige timere (VENT_MS=0 er stadig async nok
   til at vi kun tester PLANLÆGNINGEN her, ikke selve pushet). */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createHmac } from "node:crypto";
import { Hono } from "hono";
import { handleTrailIngest, planlaegTrailPush, _trailPushTestState } from "./trail-push.ts";

const HEMMELIGHED = "test-hemmelighed";
const app = () => {
  const a = new Hono();
  a.post("/api/trail-ingest", handleTrailIngest);
  return a;
};

function signeret(body: unknown): { raw: string; sig: string } {
  const raw = JSON.stringify(body);
  return { raw, sig: `sha256=${createHmac("sha256", HEMMELIGHED).update(raw).digest("hex")}` };
}

const EVENT = {
  event: "content.published",
  fields: [
    { name: "Collection", value: "posts" },
    { name: "Slug", value: "min-nye-artikel" },
    { name: "Action", value: "published" },
  ],
  data: { slug: "min-nye-artikel", status: "published", locale: "da", data: { title: "x" } },
};

beforeEach(() => {
  process.env.TRAIL_INGEST_SECRET = HEMMELIGHED;
  process.env.TRAIL_TOKEN = "trail_test";
  process.env.TRAIL_KB = "broberg-ai";
  _trailPushTestState().ryd();
});
afterEach(() => {
  delete process.env.TRAIL_INGEST_SECRET;
  delete process.env.TRAIL_TOKEN;
  delete process.env.TRAIL_KB;
  _trailPushTestState().ryd();
});

describe("webhook-endpointet", () => {
  test("ship-dark: uden secret svarer den 503", async () => {
    delete process.env.TRAIL_INGEST_SECRET;
    const { raw, sig } = signeret(EVENT);
    const res = await app().request("/api/trail-ingest", {
      method: "POST", body: raw, headers: { "x-webhook-signature": sig },
    });
    expect(res.status).toBe(503);
  });

  test("afviser manglende og forkert signatur — og planlægger INTET", async () => {
    const { raw } = signeret(EVENT);
    for (const headers of [{}, { "x-webhook-signature": "sha256=" + "0".repeat(64) }] as Record<string, string>[]) {
      const res = await app().request("/api/trail-ingest", { method: "POST", body: raw, headers });
      expect(res.status).toBe(401);
    }
    expect(_trailPushTestState().antalVentende()).toBe(0);
  });

  test("gyldig signatur + content.published → et push planlægges", async () => {
    const { raw, sig } = signeret(EVENT);
    const res = await app().request("/api/trail-ingest", {
      method: "POST", body: raw, headers: { "x-webhook-signature": sig },
    });
    expect(res.status).toBe(200);
    expect(_trailPushTestState().antalVentende()).toBe(1);
  });

  test("andre hændelser ignoreres høfligt (200, intet planlagt)", async () => {
    const { raw, sig } = signeret({ ...EVENT, event: "content.deleted" });
    const res = await app().request("/api/trail-ingest", {
      method: "POST", body: raw, headers: { "x-webhook-signature": sig },
    });
    expect(res.status).toBe(200);
    expect(_trailPushTestState().antalVentende()).toBe(0);
  });
});

describe("planlægningen", () => {
  test("kladder planlægges ALDRIG", () => {
    planlaegTrailPush("posts", "kladde", { status: "draft", locale: "da" });
    expect(_trailPushTestState().antalVentende()).toBe(0);
  });
  test("byggeklods-samlinger (sections/globals) planlægges aldrig", () => {
    planlaegTrailPush("sections", "hero", { status: "published" });
    planlaegTrailPush("globals", "globals", { status: "published" });
    expect(_trailPushTestState().antalVentende()).toBe(0);
  });
  test("to hurtige udgivelser af SAMME side bliver ét job (debounce)", () => {
    planlaegTrailPush("posts", "a", { status: "published", locale: "da" });
    planlaegTrailPush("posts", "a", { status: "published", locale: "da" });
    expect(_trailPushTestState().antalVentende()).toBe(1);
  });
  test("uden Trail-nøgle planlægges intet (ship-dark hele vejen)", () => {
    delete process.env.TRAIL_TOKEN;
    planlaegTrailPush("posts", "a", { status: "published", locale: "da" });
    expect(_trailPushTestState().antalVentende()).toBe(0);
  });
});
