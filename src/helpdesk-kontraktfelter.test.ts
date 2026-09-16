import { describe, test as it, expect, afterEach } from "bun:test";
import { opretSag } from "@/helpdesk.ts";

/**
 * HelpDesKS DØR BLIVER STRENGERE: et ukendt felt på POST /tickets svarer snart
 * 400 i stedet for 200-og-ingenting. Det er den rigtige rettelse — vi fandt
 * hullet selv, da `erProeve` blev accepteret og lagret ingen steder.
 *
 * MEN DEN VENDER RISIKOEN OM FOR OS. I dag koster et felt for meget ingenting;
 * bagefter koster det en AFVIST SAG for en rigtig besøgende på broberg.ai.
 * Fejlen flytter sig fra «ingen opdager det» til «hun får en fejl mens hun
 * beder om hjælp» — værre for hende, bedre for os, og kun hvis vi opdager det
 * FØR hende.
 *
 * Derfor måles kroppen her på det den FAKTISK sender, ikke på hvad koden ser
 * ud til at sende. Et felt tilføjet i en spread eller bag en betingelse er
 * usynligt for et blik på kildeteksten — det var netop sådan `intent` undslap
 * min egen udtrækning med et regulært udtryk.
 */
const TILLADTE = new Set(["subject", "body", "requesterEmail", "intent", "intakeKey", "erProeve", "kanal"]);

const gemFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = gemFetch; });

async function kropFraEtRigtigtKald(sag: Parameters<typeof opretSag>[0]): Promise<Record<string, unknown>> {
  let sendt: Record<string, unknown> = {};
  process.env.HELPDESK_KEY = "hd_live_test";
  process.env.HELPDESK_TENANT = "broberg-ai";
  process.env.HELPDESK_BASE = "http://127.0.0.1:1";
  globalThis.fetch = (async (_u: string, init?: RequestInit) => {
    sendt = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ ticket: { ref: "BR-TEST", state: "open", level: 1 } }), { status: 201 });
  }) as unknown as typeof fetch;
  await opretSag(sag);
  return sendt;
}

describe("POST /tickets sender KUN felter HelpDesks dør kender", () => {
  it("det fulde kald — hvert felt står i deres skema", async () => {
    const krop = await kropFraEtRigtigtKald({
      emne: "Knappen svarer ikke",
      krop: "den gør ingenting",
      intakeKey: "bai-abc",
      kontaktEmail: "hun@eksempel.dk",
      intent: "virker-ikke",
    });
    const ukendte = Object.keys(krop).filter((k) => !TILLADTE.has(k));
    expect(ukendte).toEqual([]);
  });

  it("det MINDSTE kald — heller ikke her slipper noget med", async () => {
    const krop = await kropFraEtRigtigtKald({ emne: "x", krop: "y", intakeKey: "k" });
    expect(Object.keys(krop).filter((k) => !TILLADTE.has(k))).toEqual([]);
  });

  it("en tom adresse sendes IKKE som tomt felt — den udelades", async () => {
    // Et tomt requesterEmail ville hos dem se ud som en oplyst adresse der
    // ikke virker, frem for som ingen adresse.
    const krop = await kropFraEtRigtigtKald({ emne: "x", krop: "y", intakeKey: "k" });
    expect("requesterEmail" in krop).toBe(false);
    expect("intent" in krop).toBe(false);
  });

  it("VAGTEN KAN FEJLE: et opdigtet felt ville blive fanget", () => {
    // Uden den her ville de tre ovenfor bestå på en tilladelsesliste der
    // tilfældigvis rummer alt vi sender — og ikke bevise at den kan sige nej.
    expect(["subject", "hvor"].filter((k) => !TILLADTE.has(k))).toEqual(["hvor"]);
  });
});

describe("§3.5 — kanalen siger hvilken af VORES flader sagen kom fra", () => {
  it("formularen sender kanal: formular", async () => {
    const krop = await kropFraEtRigtigtKald({ emne: "x", krop: "y", intakeKey: "k", kanal: "formular" });
    expect(krop.kanal).toBe("formular");
  });

  it("udelades den, sendes feltet SLET IKKE — ikke som tom streng", async () => {
    // HelpDesk gemmer et udeladt felt som null. Sendte vi "", ville «ikke
    // oplyst» og «oplyst som ingenting» blive det samme hos dem — samme
    // skelnen vi to har brugt to døgn på.
    const krop = await kropFraEtRigtigtKald({ emne: "x", krop: "y", intakeKey: "k" });
    expect("kanal" in krop).toBe(false);
  });
});
