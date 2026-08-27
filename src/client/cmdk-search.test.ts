import { describe, test as it, expect } from "bun:test";
import { makeFuzzy, type CmdItem } from "./cmdk-palette.tsx";

/**
 * A case must be findable by the customer's name.
 *
 * The index was title + excerpt + badge. Measured on the live site 27 Aug 2026:
 * typing "Sanne" returned "No matches", while the case about her sat at
 * /cases/sanne-andersen — titled "Fire forretninger, én platform", excerpt about
 * a clinic and a Qi Gong universe. Her name appeared in neither. Same shape had
 * just been hit with "fd sundhed".
 *
 * People look for a case by WHO it is about at least as often as by what it is
 * called. That word already existed in `client`, in the tags and in the slug —
 * none of them searchable. `keywords` carries them into the haystack and is
 * never rendered.
 */

const CASE: CmdItem = {
  id: "post:sanne-andersen",
  title: "Fire forretninger, én platform",
  subtitle: "Klinik, uddannelse, webshop og et Qi Gong-univers — samlet i ét system.",
  badge: "CASE",
  keywords: "Sanne Andersen sanne andersen Case Platform Webshop LMS",
  data: "/cases/sanne-andersen",
};
const OTHER: CmdItem = {
  id: "post:fd-sundhed",
  title: "FD Sundhed — 16.838 ansatte",
  subtitle: "Aalborg Kommunes sundhedsordning.",
  badge: "CASE",
  keywords: "FysioDanmark Aalborg fd sundhed",
  data: "/cases/fd-sundhed",
};

const find = makeFuzzy([CASE, OTHER]);

describe("search finds a case by its customer", () => {
  it("finds Sanne's case by her name — the reported failure", () => {
    expect(find("Sanne").map((r) => r.id)).toEqual(["post:sanne-andersen"]);
  });

  it("is case-insensitive and works on the full name", () => {
    expect(find("sanne andersen").map((r) => r.id)).toEqual(["post:sanne-andersen"]);
  });

  it("finds a case by its customer's ORGANISATION too", () => {
    expect(find("fysiodanmark").map((r) => r.id)).toEqual(["post:fd-sundhed"]);
  });

  it("still finds by title — the old behaviour is not traded away", () => {
    // Negative control on the other side: widening the haystack must not break
    // what already worked.
    expect(find("forretninger").map((r) => r.id)).toEqual(["post:sanne-andersen"]);
    expect(find("16.838").map((r) => r.id)).toEqual(["post:fd-sundhed"]);
  });

  it("still finds by excerpt", () => {
    expect(find("qi gong").map((r) => r.id)).toEqual(["post:sanne-andersen"]);
  });

  it("does NOT match a word that appears nowhere", () => {
    // Without this, "search finds everything" would pass every case above.
    expect(find("rendezvous")).toEqual([]);
  });

  it("keeps requiring every term — widening the haystack must not widen the match", () => {
    // "sanne" hits one entry, "kommune" the other; together they must hit none.
    expect(find("sanne kommunes")).toEqual([]);
  });
});
