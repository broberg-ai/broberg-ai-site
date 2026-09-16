import { describe, test as it, expect } from "bun:test";
import { readFileSync, existsSync } from "node:fs";

/**
 * HelpDesks mails henter vores mærke fra vores eget domæne.
 *
 * DERFOR ER STIEN ET LØFTE, ikke en detalje. En hostet fil i en mail hentes
 * igen hver gang brevet åbnes — i årevis. Flyttes eller slettes den, brækker
 * HVER mail HelpDesk nogensinde har sendt på vores vegne, med tilbagevirkende
 * kraft, og ingen af dem fejler synligt: der står bare et tomt felt hvor
 * logoet var.
 *
 * HelpDesk valgte bevidst en URL frem for en vedhæftning, netop fordi filen
 * ligger hos OS: flytter vi den, går vores eget site i stykker samtidig —
 * altså synligt for os frem for tavst for dem. Den her prøve er den anden
 * halvdel af den handel: den gør «synligt for os» til noget der stopper en
 * udrulning i stedet for noget nogen opdager senere.
 *
 * SVG DUER IKKE. Gmail stripper det, Outlook kender det ikke — og et
 * SVG-logo i en mail ligner et der virker. Derfor PNG, og derfor måles
 * signaturen frem for endelsen.
 */
const STI = "public/brand/broberg-mark-96.png";

describe("mærket HelpDesks mails henter", () => {
  it("ligger på den sti vi har lovet HelpDesk — den må aldrig flytte sig", () => {
    expect(existsSync(STI)).toBe(true);
  });

  it("er en RIGTIG PNG, målt på filens signatur og ikke på dens navn", () => {
    const b = readFileSync(STI);
    // \x89PNG\r\n\x1a\n — et omdøbt SVG ville bestå en endelses-kontrol.
    expect([...b.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it("er 96×96 — 2× den 48px HelpDesk tegner den i", () => {
    // Bredde og højde står som 32-bit big-endian i IHDR, byte 16-23.
    const b = readFileSync(STI);
    expect(b.readUInt32BE(16)).toBe(96);
    expect(b.readUInt32BE(20)).toBe(96);
  });

  it("er lille nok til en mail — et 500px-mærke er dét der giver «alt for stort logo»", () => {
    expect(readFileSync(STI).byteLength).toBeLessThan(20_000);
  });
});
