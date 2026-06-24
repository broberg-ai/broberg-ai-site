// Local content store — the app's own copy of cms content, written by ICD
// pushes + the initial backfill, read by the SSR renderer. Lives under
// CONTENT_DIR, which MUST be a persistent volume on Fly so ICD writes survive
// container restart/redeploy.
//
// Shape-agnostic: a document is stored as opaque JSON keyed by collection/slug.
// Mechanics (atomic write, path-traversal guard, idempotent delete) are ported
// verbatim from cms fly-live-assets/server.ts (intercom #55).
import { mkdir, writeFile, rename, unlink, access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { config } from "@/config.ts";

const ROOT = resolve(config.contentDir);

export type StoredDoc = Record<string, unknown> & { slug?: string; status?: string };

// Reject any relPath that would escape the store root (slug comes from outside).
function safeJoin(root: string, rel: string): string | null {
  const full = resolve(root, rel);
  const rootRes = resolve(root);
  if (full === rootRes) return null;
  if (!full.startsWith(rootRes + "/")) return null;
  return full;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function relFor(collection: string, slug: string): string {
  return `${collection}/${slug}.json`;
}

// Atomic write: write a temp file then rename, so a partial file is never
// visible to a concurrent read.
export async function put(collection: string, slug: string, doc: StoredDoc): Promise<void> {
  const guarded = safeJoin(ROOT, relFor(collection, slug));
  if (!guarded) throw new Error(`path traversal rejected: ${collection}/${slug}`);
  await mkdir(dirname(guarded), { recursive: true });
  const tmp = `${guarded}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, JSON.stringify(doc));
  await rename(tmp, guarded);
}

// Idempotent delete: unlink, tolerate ENOENT (deleting twice is a no-op).
export async function del(collection: string, slug: string): Promise<void> {
  const guarded = safeJoin(ROOT, relFor(collection, slug));
  if (!guarded) throw new Error(`path traversal rejected: ${collection}/${slug}`);
  try {
    await unlink(guarded);
  } catch (e: any) {
    if (e?.code !== "ENOENT") throw e;
  }
}

export async function get(collection: string, slug: string): Promise<StoredDoc | null> {
  const guarded = safeJoin(ROOT, relFor(collection, slug));
  if (!guarded) return null;
  try {
    return JSON.parse(await readFile(guarded, "utf8")) as StoredDoc;
  } catch (e: any) {
    if (e?.code === "ENOENT") return null;
    throw e;
  }
}

// List every stored doc in a collection (the renderer filters status==published).
export async function list(collection: string): Promise<StoredDoc[]> {
  const dir = safeJoin(ROOT, collection);
  if (!dir || !(await pathExists(dir))) return [];
  const names = (await readdir(dir)).filter((n) => n.endsWith(".json") && !n.includes(".tmp-"));
  const docs = await Promise.all(
    names.map(async (n) => {
      try {
        return JSON.parse(await readFile(join(dir, n), "utf8")) as StoredDoc;
      } catch {
        return null;
      }
    }),
  );
  return docs.filter((d): d is StoredDoc => d !== null);
}

export async function ensureRoot(): Promise<void> {
  await mkdir(ROOT, { recursive: true });
}
