import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* The inline-edit toggle reads `enabled` off the wire in TWO places: once when
 * the panel loads, once after a click. For months those two lines disagreed —
 * the first treated a missing field as "off" on purpose, the second declared
 * the field non-optional and painted `undefined` straight onto the knob.
 *
 * Nothing broke, because the endpoint happened to always send the field. That
 * is the whole failure shape helpdesk hit on 18/9 with `as TenantConfig`: the
 * answer depends on which of two equivalent spellings someone picked, so the
 * code is not safe — it is lucky.
 *
 * Worse here than there, because of the ORDER: the load path was the defensive
 * one. So the knob painted correctly on arrival and wrongly after a click —
 * the user sees their own action undone.
 *
 * A wire field is optional until proven otherwise. This test pins both reads,
 * and it pins a THIRD one nobody has written yet. */
const src = readFileSync(join(import.meta.dir, "client/enhance.ts"), "utf8");

describe("inline-edit toggle: `enabled` is read the same way everywhere", () => {
  it("never declares the wire field non-optional", () => {
    // `{ enabled: boolean }` is a promise the network cannot keep.
    expect(src).not.toMatch(/\{\s*enabled:\s*boolean\s*\}/);
  });

  it("every read of `enabled` compares against true explicitly", () => {
    const reads = [...src.matchAll(/\b(?:body|j|json)\.enabled\b(?!\s*===\s*true)/g)];
    expect(reads.map((m) => src.slice(Math.max(0, m.index - 60), m.index + 40))).toEqual([]);
  });

  it("both call sites still exist — so the test cannot pass by them being deleted", () => {
    expect([...src.matchAll(/paintToggle\(/g)].length).toBeGreaterThanOrEqual(3);
  });
});
