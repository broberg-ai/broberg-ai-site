import { describe, test as it, expect, afterEach } from "bun:test";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { opretSag, laesSag, helpdeskKonfigureret, helpdeskStatus, HelpDeskFejl, _nulstilTaeller } from "./helpdesk.ts";

/**
 * F024.1 — HelpDesk-klienten.
 *
 * Prøverne dækker de fire ting der kan gå galt UDEN at nogen ser det:
 * en nøgle der slipper ud i browseren, en tabt henvendelse der ser sendt ud,
 * en dublet-sag pr. genforsøg, og en tæller der ikke tæller.
 */

const gem = { ...process.env };
afterEach(() => {
  for (const k of ["HELPDESK_KEY", "HELPDESK_TENANT", "HELPDESK_BASE"]) delete process.env[k];
  Object.assign(process.env, gem);
  _nulstilTaeller();
});

describe("nøglen må aldrig nå en browser", () => {
  /** Deres vigtigste regel, og den eneste her hvor vi hæfter alene: kalder
   *  vores side dem direkte, ligger nøglen i klartekst i JS-bundtet. */
  it("ingen klient-fil importerer helpdesk-modulet", () => {
    const rod = new URL("./client/", import.meta.url).pathname;
    const synder: string[] = [];
    const gaa = (d: string) => {
      for (const navn of readdirSync(d)) {
        const p = join(d, navn);
        if (statSync(p).isDirectory()) { gaa(p); continue; }
        if (!/\.(ts|tsx)$/.test(navn)) continue;
        const kilde = readFileSync(p, "utf-8").replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
        if (/from\s+["'][^"']*helpdesk(\.ts)?["']/.test(kilde)) synder.push(p);
      }
    };
    gaa(rod);
    expect(synder).toEqual([]);
  });

  it("nøglen står ikke i det byggede klient-bundt", () => {
    // Bundtet er sandheden — en import kan snige sig ind gennem et mellemled
    // som kilde-prøven ovenfor ikke ser. Er der ikke bygget, SIGER prøven det
    // frem for at bestå: en kontrol der springer over sig selv er et falsk grønt.
    const dist = new URL("../dist/client/assets/", import.meta.url).pathname;
    expect(existsSync(dist)).toBe(true);
    const filer = readdirSync(dist).filter((f) => f.endsWith(".js"));
    expect(filer.length).toBeGreaterThan(0);
    for (const f of filer) {
      const b = readFileSync(join(dist, f), "utf-8");
      expect(b).not.toContain("hd_live");
      expect(b).not.toContain("api.helpdesk.broberg.ai");
    }
  });
});

describe("en henvendelse må ikke forsvinde tavst", () => {
  /** MODSAT Trail. Trail er ship-dark med vilje: uden token springes opslaget
   *  over og Aidan svarer videre. Gjorde vi det HER, ville en besøgende tro
   *  hun havde rakt ud mens ingen sag blev oprettet. */
  it("uden nøgle KASTER den — den returnerer ikke bare tomt", async () => {
    delete process.env.HELPDESK_KEY;
    expect(helpdeskKonfigureret()).toBe(false);
    await expect(opretSag({ emne: "x", krop: "y", intakeKey: "k" })).rejects.toThrow(HelpDeskFejl);
  });

  it("en fejl fra dem KASTER, og bærer deres egen tekst videre", async () => {
    process.env.HELPDESK_KEY = "hd_live_test";
    process.env.HELPDESK_TENANT = "broberg-ai";
    process.env.HELPDESK_BASE = "http://127.0.0.1:1";  // ingen lytter
    await expect(opretSag({ emne: "x", krop: "y", intakeKey: "k" })).rejects.toThrow();
    expect(helpdeskStatus().fejl).toBe(1);
    expect(helpdeskStatus().ok).toBe(0);
  });

  it("også læsning kaster frem for at give et tomt svar der ligner en sag", async () => {
    delete process.env.HELPDESK_KEY;
    await expect(laesSag("BR-XXXXX")).rejects.toThrow(HelpDeskFejl);
  });
});

describe("tælleren gør bidraget målbart", () => {
  it("starter nulstillet og har samme form som trail-blokken", () => {
    const s = helpdeskStatus();
    expect(Object.keys(s).sort()).toEqual(
      ["dubletter", "fejl", "forsoeg", "konfigureret", "ok", "sidsteMs"],
    );
  });

  it("tæller et fejlet forsøg som ét forsøg OG én fejl", async () => {
    process.env.HELPDESK_KEY = "hd_live_test";
    process.env.HELPDESK_TENANT = "broberg-ai";
    process.env.HELPDESK_BASE = "http://127.0.0.1:1";
    await opretSag({ emne: "x", krop: "y", intakeKey: "k" }).catch(() => {});
    expect(helpdeskStatus().forsoeg).toBe(1);
    expect(helpdeskStatus().fejl).toBe(1);
  });
});

describe("kontrakten, sådan som deres doc kræver den", () => {
  it("en uBEKRÆFTET mailadresse kan ikke smutte med — feltet hedder det det er", () => {
    // Deres afsnit 6: sender vi en adresse gennem VORES nøgle, stoler de på
    // den, og vi hæfter. En adresse en anonym besøgende har tastet er et hint.
    // Værnet er navngivningen: et kaldested kan ikke udfylde «bekraeftetEmail»
    // i god tro med noget utjekket.
    const kilde = readFileSync(new URL("./helpdesk.ts", import.meta.url).pathname, "utf-8");
    expect(kilde).toContain("bekraeftetEmail");
    expect(kilde).not.toMatch(/requesterEmail:\s*sag\.email/);
  });

  it("intakeKey er påkrævet i typen — uden den bliver hvert genforsøg en ny sag", () => {
    const kilde = readFileSync(new URL("./helpdesk.ts", import.meta.url).pathname, "utf-8");
    expect(kilde).toMatch(/intakeKey:\s*string;/);      // ikke intakeKey?: string
  });

  it("har en tidsgrænse — en besøgende venter ikke i det uendelige", () => {
    const kilde = readFileSync(new URL("./helpdesk.ts", import.meta.url).pathname, "utf-8");
    expect(kilde).toContain("AbortController");
    expect(kilde).toMatch(/TIMEOUT_MS\s*=\s*\d/);
  });
});
