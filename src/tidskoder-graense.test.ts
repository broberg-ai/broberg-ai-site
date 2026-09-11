/**
 * F019.6 — tidskoderne må ikke spise af TTS-budgettet.
 *
 * FUNDET AF LENS, ikke af en anelse: anden kørsel af oplæser-flowet fik
 * «429 rate_limited» på /api/aidan/tidskoder, og så var der ingen markering —
 * lyd uden lys, og ingen fejl at se på skærmen.
 *
 * Spærren er bygget til at beskytte en TTS-GENERERING (penge, et halvt minut).
 * Tidskoderne er en filindlæsning af noget der kun findes hvis lyden allerede
 * ER lavet. De delte spand, så én afspilning brugte to af de tre kald man har
 * pr. minut.
 */
import { describe, it, expect, beforeAll } from "bun:test";
import { Hono } from "hono";

// /laes svarer 503 FØR spærren hvis der ingen nøgle er — så ville prøven måle
// ingenting. Nøglen her bruges aldrig til et kald: stien er ikke en artikel,
// så ruten falder på 404 længe før den taler med Azure.
beforeAll(() => {
  process.env.AZURE_SPEECH_KEY ||= "kun-for-proeven";
  process.env.AZURE_SPEECH_REGION ||= "swedencentral";
});

const { handleAidanLaes, handleAidanTidskoder } = await import("./aidan-laes.ts");

const app = new Hono();
app.post("/api/aidan/laes", handleAidanLaes);
app.get("/api/aidan/tidskoder", handleAidanTidskoder);

const IP = { "x-forwarded-for": "203.0.113.77" };
const laes = () =>
  app.request("/api/aidan/laes", {
    method: "POST",
    headers: { ...IP, "Content-Type": "application/json" },
    body: JSON.stringify({ sti: "/findes-ikke", persona: "aidan" }),
  });
const tidskoder = () =>
  app.request("/api/aidan/tidskoder?sti=%2Ffindes-ikke&persona=aidan", { headers: IP });

describe("tidskoderne har deres egen spand", () => {
  it("seks opslag i træk bliver ikke afvist — det er en filindlæsning, ikke et TTS-kald", async () => {
    const svar = await Promise.all([...Array(6)].map(tidskoder));
    expect(svar.map((r) => r.status).filter((s) => s === 429)).toEqual([]);
  });

  it("og de har IKKE brugt af TTS-budgettet: tre oplæsninger går stadig igennem", async () => {
    // Den bærende prøve. Med fælles spand var budgettet brugt op af de seks
    // ovenfor, og den FØRSTE oplæsning her ville være 429.
    const et = await laes();
    const to = await laes();
    const tre = await laes();
    for (const r of [et, to, tre]) expect(r.status).not.toBe(429);
    // Fjerde er over loftet — spærren VIRKER stadig, den er bare sin egen.
    expect((await laes()).status).toBe(429);
  });
});
