/**
 * F019.4 — talen genfindes i den viste tekst.
 *
 * HVERT INTERVAL UDLEDES AF STRENGEN, aldrig talt i hånden. Jeg regnede indeks
 * forkert tre gange mens filen blev skrevet, og hver gang lignede det en fejl i
 * motoren. En prøve hvis forventning er et håndtalt tal måler mit hovedregning
 * lige så meget som koden.
 *
 * Prøverne kører på tekststykker med en streng-reference i stedet for på ægte
 * tekstknuder. Det er ikke en mock af DOM'en: det ER den form funktionen
 * arbejder på, og DOM-adapteren er tre linjer der samler node-tekster.
 *
 * De to vigtigste prøver er dem hvor talen og teksten IKKE er ens — det er dér
 * en eksakt sammenligning ville knække og tage resten af artiklen med sig.
 */
import { describe, it, expect } from "bun:test";
import { byggKort, omraadeTil, type Stykke } from "@/dom-kort.ts";

const st = (...dele: string[]): Stykke<string>[] =>
  dele.map((tekst, i) => ({ tekst, ref: `n${i}` }));

/** Hvad et interval PEGER på, samlet fra stykkerne — det er dét der skal males. */
function udsnit(stykker: Stykke<string>[], o: { start: { ref: string; offset: number }; slut: { ref: string; offset: number } }): string {
  let ud = "";
  let inde = false;
  for (const s of stykker) {
    const fra = s.ref === o.start.ref ? o.start.offset : inde ? 0 : -1;
    if (fra === -1) continue;
    inde = true;
    const til = s.ref === o.slut.ref ? o.slut.offset : s.tekst.length;
    ud += s.tekst.slice(fra, til);
    if (s.ref === o.slut.ref) break;
  }
  return ud;
}

describe("talen genfindes i teksten", () => {
  it("et ord i ét stykke", () => {
    const s = st("Hej med dig");
    const k = byggKort("Hej med dig", s);
    const o = omraadeTil(k, 4, 7)!;
    expect(udsnit(s, o)).toBe("med");
  });

  it("ET ORD DER ER DELT OVER TO KNUDER", () => {
    // Sådan ser «meget **vigtigt**» ud efter rendering: tre tekstknuder.
    // Et ord der krydser grænsen er det normale, ikke kantsagen.
    const tale = "Dette er meget vigtigt at forstå";
    const s = st("Dette er ", "meget vigtigt", " at forstå");
    const k = byggKort(tale, s);
    const fra = tale.indexOf("meget vigtigt");
    const o = omraadeTil(k, fra, fra + "meget vigtigt".length)!;
    expect(udsnit(s, o)).toBe("meget vigtigt");
  });

  it("en markering kan SPÆNDE over to knuder", () => {
    const tale = "Første del og anden del";
    const s = st("Første del ", "og anden del");
    const k = byggKort(tale, s);
    const fra = tale.indexOf("del og");
    const o = omraadeTil(k, fra, fra + "del og".length)!;
    expect(udsnit(s, o)).toBe("del og");
  });
});

describe("når talen og teksten IKKE er ens", () => {
  it("«AI agenter» i talen findes som «AI-agenter» på skærmen", () => {
    // Det er dét tilTale gør ved hver eneste forkortelse — 60+ forekomster i
    // vores artikler. En eksakt sammenligning ville knække på den FØRSTE.
    const tale = "Vi bygger med AI agenter hver dag";
    const s = st("Vi bygger med AI-agenter hver dag");
    const k = byggKort(tale, s);
    const fra = tale.indexOf("agenter");
    const o = omraadeTil(k, fra, fra + "agenter".length)!;
    expect(udsnit(s, o)).toBe("agenter");
  });

  it("teksten kan bære EKSTRA tegn talen ikke har", () => {
    const tale = "Se vores flagskibe her";
    const s = st("Se «vores flagskibe» her");
    const k = byggKort(tale, s);
    const fra = tale.indexOf("flagskibe");
    const o = omraadeTil(k, fra, fra + "flagskibe".length)!;
    expect(udsnit(s, o)).toBe("flagskibe");
  });

  it("forskelle i mellemrum betyder ingenting", () => {
    const tale = "Et ord her";
    const s = st("Et   ord\n\n  her");
    const k = byggKort(tale, s);
    const fra = tale.indexOf("ord");
    const o = omraadeTil(k, fra, fra + 3)!;
    expect(udsnit(s, o)).toBe("ord");
  });

  it("EN AFVIGELSE KOSTER ÉT ORD, IKKE RESTEN AF ARTIKLEN", () => {
    // Det er hele grunden til at gangen er tolerant. Knækkede vi, ville
    // markeringen stoppe midtvejs — og det ligner lyd der stopper.
    const tale = "Start her. Noget ganske andet står her. Slut her.";
    const s = st("Start her. Noget HELT andet står her. Slut her.");
    const k = byggKort(tale, s);
    const fra = tale.indexOf("Slut");
    const o = omraadeTil(k, fra, fra + 4)!;
    expect(udsnit(s, o)).toBe("Slut");
  });
});

describe("kontroller", () => {
  it("tekst uden ET ENESTE fælles tegn giver null", () => {
    // Gangen er tolerant med vilje, så «matcher ikke» betyder her: der findes
    // ikke et eneste tegn den kan genkende. Første udgave af denne prøve brugte
    // to danske sætninger og fejlede — de deler naturligvis bogstaver, og et
    // tolerant match ER det rigtige svar dér.
    const k = byggKort("xyzq", st("---- ---- ----"), 5);
    expect(omraadeTil(k, 0, 4)).toBeNull();
  });

  it("tomme stykker springes over uden at ødelægge kortet", () => {
    const tale = "Hej med dig";
    const s = st("Hej ", "", "med ", "", "dig");
    const k = byggKort(tale, s);
    const fra = tale.indexOf("dig");
    expect(udsnit(s, omraadeTil(k, fra, fra + 3)!)).toBe("dig");
  });

  it("et interval efter tekstens slutning giver null", () => {
    const k = byggKort("Hej", st("Hej"));
    expect(omraadeTil(k, 10, 14)).toBeNull();
  });

  it("kortet har ét felt pr. tegn i talen", () => {
    const tale = "Hej med dig";
    expect(byggKort(tale, st(tale)).length).toBe(tale.length);
  });

  it("KONTROL: et taleord uden bogstaver matcher IKKE hvad som helst", () => {
    // «—» normaliserer til tomt, og en tom streng er indeholdt i alt. Uden
    // spærren ville tankestregen få et sted i teksten, og markeringen ville
    // hoppe derhen midt i oplæsningen. Mutations-fundet: den forrige udgave af
    // denne fil kunne ikke skelne, så spærren stod som pynt.
    const s = st("Her er en sætning");
    const k = byggKort("— Her", s);
    expect(k[0]).toBeNull();
    expect(k[2]).not.toBeNull(); // «Her» findes stadig
  });

  it("KONTROL: SPRINGLOFTET forhindrer et hop langt ned i artiklen", () => {
    // Et ord der først optræder 30 ord senere er næsten altid et tilfældigt
    // sammenfald, ikke det samme sted i teksten. Uden loftet ville markeringen
    // springe derned og se ud som om oplæsningen var et andet sted.
    const fyld = Array.from({ length: 30 }, (_, i) => `fyld${i}`).join(" ");
    const s = st(`start ${fyld} maal`);
    // Talen har «maal» som ord nr. 2; teksten har det som ord nr. 32.
    const k = byggKort("start maal", s);
    const fra = "start maal".indexOf("maal");
    expect(omraadeTil(k, fra, fra + 4)).toBeNull();
  });

  it("KONTROL: kortet peger FREMAD — aldrig tilbage i teksten", () => {
    // Et kort der hopper baglæns ville få markeringen til at springe op i
    // artiklen midt i en sætning.
    const s = st("Vi bygger med AI-agenter hver dag og det virker fint");
    const k = byggKort("Vi bygger med AI agenter hver dag og det virker fint", s);
    let sidst = -1;
    for (const p of k) {
      if (!p) continue;
      const idx = Number(p.ref.slice(1)) * 10_000 + p.offset;
      expect(idx).toBeGreaterThanOrEqual(sidst);
      sidst = idx;
    }
  });
});
