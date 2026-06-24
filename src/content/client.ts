// cms read-API client — used ONLY for the initial backfill / resync on first
// boot. ICD push is the steady-state path; this token (WH_READ_TOKEN) is
// seed/resync only.
//
// Response shape (cms intercom #59):
//   GET /api/cms/{collection}?site=… → a BARE ARRAY of docs (no {items}/{docs}).
//   The API does NOT filter: it returns ALL locales + drafts (only `trashed`
//   stripped) and IGNORES any ?locale param. Callers filter status/locale.
//   GET /api/cms/{collection}/{slug} → the doc object directly (404 → {error}).
//   Doc = {slug,status,data,id,_fieldMeta,locale?,translationGroup?,…};
//   editable content lives under .data.*
import { config } from "@/config.ts";
import type { StoredDoc } from "@/content/store.ts";

function unwrap(json: unknown): StoredDoc[] {
  if (Array.isArray(json)) return json as StoredDoc[];
  // Defensive: tolerate a wrapper if the API ever changes.
  if (json && typeof json === "object") {
    for (const key of ["items", "docs", "data", "results"]) {
      const v = (json as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as StoredDoc[];
    }
  }
  return [];
}

function headers(): HeadersInit {
  const h: Record<string, string> = { accept: "application/json" };
  if (config.readToken) h.authorization = `Bearer ${config.readToken}`;
  return h;
}

function url(path: string): string {
  return `${config.readApiBase}/${path}?site=${encodeURIComponent(config.site)}`;
}

export async function fetchCollection(collection: string): Promise<StoredDoc[]> {
  const res = await fetch(url(collection), { headers: headers() });
  if (!res.ok) throw new Error(`read-API ${collection}: ${res.status}`);
  return unwrap(await res.json());
}

export async function fetchDocument(collection: string, slug: string): Promise<StoredDoc | null> {
  const res = await fetch(url(`${collection}/${encodeURIComponent(slug)}`), { headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`read-API ${collection}/${slug}: ${res.status}`);
  return (await res.json()) as StoredDoc;
}
