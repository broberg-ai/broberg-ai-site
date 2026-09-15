/**
 * F024.1 — måler VORES klient mod produktionen, ikke API'et.
 *
 * Kontraktprøven hos helpdesk beviser at ruterne svarer. Den her beviser at
 * src/helpdesk.ts kalder dem rigtigt — to forskellige påstande.
 *
 *   bun scripts/maal-helpdesk.ts
 */
import { opretSag, laesSag, helpdeskStatus } from "@/helpdesk.ts";

const maerke = `f024-maaling-${Date.now().toString(36)}`;
const sag = { emne: "F024 måling — ikke en rigtig henvendelse", krop: `Engangsmærke: ${maerke}`, intakeKey: maerke };

console.log("1. opretter sagen …");
const en = await opretSag(sag);
console.log(`   ref ${en.ref} · oprettet=${en.oprettet} · state=${en.state}`);

console.log("2. SAMME intakeKey igen (et genforsøg er normal drift) …");
const to = await opretSag(sag);
console.log(`   ref ${to.ref} · oprettet=${to.oprettet}`);
const dublet = to.ref === en.ref && to.oprettet === false;
console.log(`   ${dublet ? "OK" : "FEJL"}: samme ref, created=false → ingen dublet`);

console.log("3. læser sagen TILBAGE og leder efter mit eget mærke …");
const laest = JSON.stringify(await laesSag(en.ref));
const fundet = laest.includes(maerke);
console.log(`   ${fundet ? "OK" : "FEJL"}: mærket «${maerke}» ${fundet ? "står" : "MANGLER"} i den gemte sag`);

console.log("\ntæller:", JSON.stringify(helpdeskStatus()));
process.exit(dublet && fundet ? 0 : 1);
