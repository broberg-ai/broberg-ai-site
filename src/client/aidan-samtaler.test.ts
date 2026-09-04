/* Segl for samtale-lageret (F007.4) — gem/læs/slet/loft, med læs-tilbage. */
import { describe, test, expect, beforeEach } from "bun:test";

// bun:test har ingen DOM — et minimalt localStorage-stub, samme kontrakt.
const lager = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => lager.get(k) ?? null,
  setItem: (k: string, v: string) => void lager.set(k, v),
  removeItem: (k: string) => void lager.delete(k),
};

import { gemAktiv, hentSamtale, listSamtaler, sletSamtale, aktivId, saetAktiv, titelFra, relativTid, erNaerBunden } from "./aidan-samtaler.ts";

beforeEach(() => lager.clear());

describe("lageret", () => {
  test("gem → læs tilbage med streng lighed på beskederne", () => {
    const beskeder = [
      { role: "user" as const, content: "Hvad koster et projekt?" },
      { role: "assistant" as const, content: "Det afhænger af **scope**." },
    ];
    const id = gemAktiv(beskeder);
    expect(id).toBeTruthy();
    const tilbage = hentSamtale(id!);
    expect(tilbage!.beskeder).toEqual(beskeder);
    expect(tilbage!.titel).toBe("Hvad koster et projekt?");
  });

  test("en samtale uden brugerbesked gemmes ALDRIG", () => {
    expect(gemAktiv([{ role: "assistant", content: "hilsen" }])).toBeNull();
    expect(listSamtaler()).toHaveLength(0);
  });

  test("samme aktive samtale opdateres — der oprettes ikke en ny pr. tur", () => {
    const id1 = gemAktiv([{ role: "user", content: "a" }]);
    const id2 = gemAktiv([{ role: "user", content: "a" }, { role: "assistant", content: "b" }]);
    expect(id2).toBe(id1);
    expect(listSamtaler()).toHaveLength(1);
    expect(hentSamtale(id1!)!.beskeder).toHaveLength(2);
  });

  test("Ny samtale (saetAktiv null) giver et NYT id — historikken består", () => {
    const id1 = gemAktiv([{ role: "user", content: "første" }]);
    saetAktiv(null);
    const id2 = gemAktiv([{ role: "user", content: "anden" }]);
    expect(id2).not.toBe(id1);
    expect(listSamtaler()).toHaveLength(2);
  });

  test("slet fjerner præcis den ene — og rydder aktiv-markøren hvis den pegede dér", () => {
    const id1 = gemAktiv([{ role: "user", content: "behold mig" }]);
    saetAktiv(null);
    const id2 = gemAktiv([{ role: "user", content: "slet mig" }]);
    sletSamtale(id2!);
    expect(hentSamtale(id2!)).toBeNull();
    expect(hentSamtale(id1!)).not.toBeNull();
    expect(aktivId()).toBeNull();
  });

  test("loftet: nummer 21 skubber den ældste ud", () => {
    for (let i = 0; i < 21; i++) {
      saetAktiv(null);
      gemAktiv([{ role: "user", content: `samtale ${i}` }]);
    }
    const alle = listSamtaler();
    expect(alle).toHaveLength(20);
    expect(alle.some((s) => s.titel === "samtale 0")).toBe(false);
    expect(alle.some((s) => s.titel === "samtale 20")).toBe(true);
  });

  test("korrupt lager vælter intet — læses som tomt", () => {
    lager.set("aidan-samtaler-v1", "{ikke json");
    expect(listSamtaler()).toEqual([]);
  });
});

describe("hjælperne", () => {
  test("titel klippes ved 60 tegn med ellipse", () => {
    const lang = "x".repeat(80);
    expect(titelFra([{ role: "user", content: lang }])).toHaveLength(58);
    expect(titelFra([{ role: "user", content: lang }]).endsWith("…")).toBe(true);
  });
  test("relativ tid på begge sprog", () => {
    expect(relativTid(Date.now() - 5 * 60_000, false)).toBe("for 5 min siden");
    expect(relativTid(Date.now() - 5 * 60_000, true)).toBe("5 min ago");
  });
});

describe("erNaerBunden (F007.5) — hvornår må chatten auto-scrolle", () => {
  test("helt i bunden: ja", () => {
    expect(erNaerBunden(400, 600, 1000)).toBe(true);
  });
  test("scrollet op: nej — brugerens scroll må ikke bekæmpes", () => {
    expect(erNaerBunden(0, 600, 1000)).toBe(false);
    expect(erNaerBunden(200, 600, 1000)).toBe(false);
  });
  test("marginen tilgiver et par linjers afdrift, men ikke mere", () => {
    expect(erNaerBunden(360, 600, 1000)).toBe(true); // 40px fra bunden < 48-margin
    expect(erNaerBunden(351, 600, 1000)).toBe(false); // 49px fra bunden
  });
  test("indhold kortere end vinduet: altid ja", () => {
    expect(erNaerBunden(0, 600, 300)).toBe(true);
  });
});
