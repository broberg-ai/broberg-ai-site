import { expect, test, beforeEach } from "bun:test";
import { roterFeatured, nulstilRotation } from "./featured-rotation.ts";

beforeEach(() => nulstilRotation());

test("ruller ét hak pr. kald og wrapper rundt", () => {
  const xs = ["A", "B", "C"];
  expect(roterFeatured(xs, "da")).toEqual(["A", "B", "C"]);
  expect(roterFeatured(xs, "da")).toEqual(["B", "C", "A"]);
  expect(roterFeatured(xs, "da")).toEqual(["C", "A", "B"]);
  expect(roterFeatured(xs, "da")).toEqual(["A", "B", "C"]);
});

test("ALLE historier kommer i den store plads over en runde", () => {
  const xs = ["A", "B", "C", "D"];
  const store = [0, 1, 2, 3].map(() => roterFeatured(xs, "da")[0]);
  expect(new Set(store)).toEqual(new Set(xs));
});

test("de to sprog ruller uafhængigt", () => {
  const xs = ["A", "B", "C"];
  roterFeatured(xs, "da");
  roterFeatured(xs, "da");
  expect(roterFeatured(xs, "en")).toEqual(["A", "B", "C"]);
  expect(roterFeatured(xs, "da")).toEqual(["C", "A", "B"]);
});

test("0 og 1 historie: uændret, og ingen tæller-drift", () => {
  expect(roterFeatured([], "da")).toEqual([]);
  expect(roterFeatured(["kun"], "da")).toEqual(["kun"]);
  expect(roterFeatured(["kun"], "da")).toEqual(["kun"]);
});

test("rører ikke den oprindelige liste", () => {
  const xs = ["A", "B", "C"];
  roterFeatured(xs, "da");
  roterFeatured(xs, "da");
  expect(xs).toEqual(["A", "B", "C"]);
});
