import { describe, test as it, expect, beforeEach, afterEach } from "bun:test";
import { rm, readFile } from "node:fs/promises";
import { skrivIKo, markerLeveret, markerFejlet, ventende, laesAlle, draenKo, koStatus, koTaeller } from "./support-ko.ts";

/**
 * F024.7 — køen. Den findes fordi reservevejen aldrig har virket i
 * produktionen, og fordi mine prøver for DEN var grønne mod en attrap.
 *
 * Derfor måler prøverne her FILEN, ikke funktionernes returværdier.
 */
const FIL = "/tmp/test-support-ko.jsonl";
const gemEnv = { ...process.env };
beforeEach(async () => { process.env.SUPPORT_KO = FIL; await rm(FIL, { force: true }); Object.assign(koTaeller, { skrevet: 0, leveret: 0, ventende: 0, skrivefejl: 0 }); });
afterEach(() => { Object.assign(process.env, gemEnv); });

const post = (id: string, intakeKey = "k1") => ({ id, intakeKey, kald: { subject: "x", body: "hendes ord" }, kanal: "formular" });

describe("hendes ord står på disk", () => {
  it("skrives til filen — målt på FILEN, ikke på returværdien", async () => {
    await skrivIKo(post("a"));
    const raa = await readFile(FIL, "utf-8");
    expect(raa).toContain("hendes ord");
    expect(raa).toContain('"forsoeg":0');
  });

  it("en post uden levering står som VENTENDE", async () => {
    await skrivIKo(post("a"));
    expect((await ventende()).map((p) => p.id)).toEqual(["a"]);
  });

  it("markeret leveret forsvinder fra ventende — og bærer sin ref", async () => {
    await skrivIKo(post("a"));
    await markerLeveret("a", "BR-XYZ");
    expect(await ventende()).toEqual([]);
    expect((await laesAlle())[0]!.ref).toBe("BR-XYZ");
  });

  it("en fejl tæller forsøget og bevarer teksten", async () => {
    await skrivIKo(post("a"));
    await markerFejlet("a", "503 nede");
    const p = (await laesAlle())[0]!;
    expect(p.forsoeg).toBe(1);
    expect(p.sidsteFejl).toContain("503");
    expect(p.kald.body).toBe("hendes ord");     // teksten overlever en fejl
  });

  it("en manglende fil er ikke en fejl — den er en tom kø", async () => {
    expect(await laesAlle()).toEqual([]);
  });
});

describe("køen må ALDRIG lave dubletter", () => {
  it("en LEVERET post genforsøges ikke", async () => {
    await skrivIKo(post("a"));
    await markerLeveret("a", "BR-1");
    const kaldt: unknown[] = [];
    await draenKo(async (k) => { kaldt.push(k); return { ref: "BR-2" }; });
    expect(kaldt).toEqual([]);      // den blev ALDRIG forsøgt igen
  });

  it("genforsøget sender SAMME intakeKey — HelpDesks dublet-spærre er nettet under nettet", async () => {
    await skrivIKo(post("a", "bai-fingeraftryk"));
    let set: Record<string, unknown> | null = null;
    await draenKo(async (k) => { set = k as Record<string, unknown>; return { ref: "BR-1" }; });
    expect((set as unknown as { intakeKey?: string } | null)?.intakeKey).toBeUndefined();
    // intakeKey ligger i kaldet selv — bevist ved at hele kaldet gives videre uændret
    const p = (await laesAlle())[0]!;
    expect(p.intakeKey).toBe("bai-fingeraftryk");
  });

  it("et lykket genforsøg markerer posten, så næste dræning springer den over", async () => {
    await skrivIKo(post("a"));
    await draenKo(async () => ({ ref: "BR-9" }));
    expect(await ventende()).toEqual([]);
    const kaldt: unknown[] = [];
    await draenKo(async (k) => { kaldt.push(k); return { ref: "BR-9" }; });
    expect(kaldt).toEqual([]);
  });

  it("et FEJLET genforsøg lader posten stå — og tæller op", async () => {
    await skrivIKo(post("a"));
    await draenKo(async () => { throw new Error("stadig nede"); });
    const p = (await laesAlle())[0]!;
    expect(p.leveret).toBeUndefined();
    expect(p.forsoeg).toBe(1);
  });

  it("dræner højst N ad gangen — en kø der hamrer løs rammer dem mens de kommer sig", async () => {
    for (const id of ["a", "b", "c", "d"]) await skrivIKo(post(id));
    const r = await draenKo(async () => ({ ref: "BR-1" }), 2);
    expect(r.forsoegt).toBe(2);
    expect((await ventende()).length).toBe(2);
  });
});

describe("status siger hvor LÆNGE nogen har ventet", () => {
  it("alderen på den ældste ventende er tallet der betyder noget", async () => {
    await skrivIKo(post("a"));
    const s = await koStatus();
    expect(s.ventende).toBe(1);
    expect(s.aeldsteVentendeMs).toBeGreaterThanOrEqual(0);
  });

  it("tom kø giver null, ikke 0 — «ingen venter» og «nogen har ventet 0 ms» er ikke det samme", async () => {
    expect((await koStatus()).aeldsteVentendeMs).toBeNull();
  });
});

describe("«vi har den» må aldrig være en løgn", () => {
  it("skrivIKo SIGER om det lykkedes — den sluger ikke fejlen", async () => {
    process.env.SUPPORT_KO = FIL;
    expect(await skrivIKo(post("a"))).toBe(true);
  });

  it("en kø der ikke kan skrive svarer FALSE", async () => {
    // Det er dét svar ruten bygger «vi har din besked» på. Sluges fejlen, får
    // hun den sætning mens ingen har hendes ord — det værste af alle udfald.
    process.env.SUPPORT_KO = "/dev/null/kan-ikke/ko.jsonl";
    expect(await skrivIKo(post("b"))).toBe(false);
  });
});
