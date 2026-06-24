// Initial backfill / resync. ICD only pushes FUTURE changes, so on first boot
// (empty store) we pull every collection once via the read-API and seed the
// local store. Safe to re-run: it overwrites with the current published state.
// No-op when WH_READ_TOKEN is absent (e.g. local dev before creds land).
//
// IMPORTANT (cms intercom #59, K1): the read-API does NOT filter — it returns
// ALL locales + drafts mixed (only `trashed` stripped) and IGNORES ?locale. So
// we filter ourselves: keep status==='published'. Slugs are unique per locale
// (om-os vs about-us), so (collection, slug) is a safe store key; the doc keeps
// its own `locale` for the renderer to filter on.
import { config } from "@/config.ts";
import { fetchCollection } from "@/content/client.ts";
import { put, list, ensureRoot, type StoredDoc } from "@/content/store.ts";

// The 6 cms collections for broberg.ai (intercom #57).
export const COLLECTIONS = [
  "sections",
  "posts",
  "categories",
  "platforms",
  "globals",
  "pages",
] as const;

function isPublished(doc: StoredDoc): boolean {
  return doc.status === "published";
}

export async function runBackfill(): Promise<{ seeded: number; skipped: boolean }> {
  await ensureRoot();
  if (!config.readToken) return { seeded: 0, skipped: true };

  let seeded = 0;
  for (const collection of COLLECTIONS) {
    let docs: StoredDoc[];
    try {
      docs = await fetchCollection(collection); // returns all locales + statuses
    } catch {
      continue; // a missing collection is not fatal for boot
    }
    for (const doc of docs) {
      if (!doc?.slug || !isPublished(doc)) continue;
      await put(collection, doc.slug, doc);
      seeded++;
    }
  }
  return { seeded, skipped: false };
}

// True when the store has no content yet — used to decide whether to backfill.
export async function storeIsEmpty(): Promise<boolean> {
  for (const collection of COLLECTIONS) {
    if ((await list(collection)).length > 0) return false;
  }
  return true;
}
