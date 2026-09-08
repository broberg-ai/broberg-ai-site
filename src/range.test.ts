import { describe, it, expect } from "bun:test";
import { beregnUdsnit } from "./range.ts";

const N = 1000;

describe("uden Range sendes hele filen", () => {
  it("intet hoved", () => expect(beregnUdsnit(undefined, N).slags).toBe("hele"));
  it("tomt hoved", () => expect(beregnUdsnit("", N).slags).toBe("hele"));
  it("en form vi ikke forstår → hele filen, ikke en fejl", () => {
    // Fail-open: en browser der beder om noget mærkeligt skal have lyden,
    // ikke en 416. Det værste udfald er at den ikke kan spole.
    expect(beregnUdsnit("bytes=0-10, 20-30", N).slags).toBe("hele");
  });
});

describe("almindelige udsnit", () => {
  it("bytes=0-499", () => expect(beregnUdsnit("bytes=0-499", N)).toEqual({ slags: "udsnit", start: 0, slut: 499 }));
  it("bytes=500- betyder resten", () => expect(beregnUdsnit("bytes=500-", N)).toEqual({ slags: "udsnit", start: 500, slut: 999 }));
  it("for meget bedt om klippes til filens ende", () => {
    expect(beregnUdsnit("bytes=900-99999", N)).toEqual({ slags: "udsnit", start: 900, slut: 999 });
  });
});

describe("bytes=-N er de SIDSTE N bytes", () => {
  it("bagfra", () => {
    // Fælden: læses den som «fra 0 til N» får afspilleren begyndelsen af filen
    // og konkluderer at der ingen metadata er — så kan den ikke vise varighed.
    expect(beregnUdsnit("bytes=-100", N)).toEqual({ slags: "udsnit", start: 900, slut: 999 });
  });
  it("flere bytes end filen har → hele filen", () => {
    expect(beregnUdsnit("bytes=-99999", N)).toEqual({ slags: "udsnit", start: 0, slut: 999 });
  });
  it("KONTROL: bytes=-100 er IKKE det samme som bytes=0-100", () => {
    expect(beregnUdsnit("bytes=-100", N)).not.toEqual(beregnUdsnit("bytes=0-100", N));
  });
});

describe("ugyldige udsnit afvises", () => {
  it("start efter slut", () => expect(beregnUdsnit("bytes=500-100", N).slags).toBe("ugyldigt"));
  it("start uden for filen", () => expect(beregnUdsnit("bytes=5000-", N).slags).toBe("ugyldigt"));
  it("KONTROL: den afviser ikke bare alt", () => {
    expect(beregnUdsnit("bytes=0-0", N)).toEqual({ slags: "udsnit", start: 0, slut: 0 });
  });
});
