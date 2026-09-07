/**
 * The whole persistence layer, in one file, over a PRIVATE Vercel Blob store.
 *
 * Why blob and not Postgres: the Neon/marketplace path needs a browser OAuth install that
 * nobody can click headlessly. Blob is first-party, already the house pattern, costs nothing
 * to stand up, and gives us the three primitives a small order book actually needs:
 *
 *   - put(..., allowOverwrite: false)  -> atomic create, so an order code is claimed once
 *   - put(..., ifMatch: etag)          -> compare-and-swap, so concurrent edits cannot clobber
 *   - get(..., access: 'private')      -> nobody reads customer data without the store token
 *
 * All three are verified against the live store (see DECISIONS.md, slice 108). If this ever
 * outgrows blob, everything SQL-shaped is behind readJson/createJson/updateJson: swap this
 * file, leave the repo and the routes alone.
 *
 * Store: vsamachta-orders-private (store_nYZrW8h8XjIZxFA0), access: private.
 * A direct fetch of a blob URL without the token answers 403.
 */
import { get, list, put, del } from "@vercel/blob";

export const HAS_STORE = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export class Conflict extends Error {}

function isPreconditionFailed(err: unknown): boolean {
  const name = (err as Error)?.constructor?.name ?? "";
  const msg = String((err as Error)?.message ?? "");
  return name === "BlobPreconditionFailedError" || /precondition|etag|conflict/i.test(msg);
}

function isAlreadyExists(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? "");
  return /already exists|overwrite/i.test(msg);
}

/**
 * Once a blob is large enough for the response to be compressed, `get` reports a WEAK
 * validator - `W/"abc"` - while `put`/`head`/`list` report the strong `"abc"`, and `ifMatch`
 * refuses the weak form. Same content, same hash, so normalise it here. Without this, every
 * compare-and-swap on an index over ~1 KB failed forever: found the hard way, on a live 500.
 */
function strongEtag(etag: string): string {
  return etag.startsWith("W/") ? etag.slice(2) : etag;
}

/** Read JSON. Returns null when the path does not exist. */
export async function readJson<T>(path: string): Promise<{ value: T; etag: string } | null> {
  const res = await get(path, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200 || !res.stream) return null;
  const text = await new Response(res.stream).text();
  return { value: JSON.parse(text) as T, etag: strongEtag(res.blob.etag) };
}

/** Create JSON. Throws Conflict if the path is already taken. This is the uniqueness lock. */
export async function createJson(path: string, value: unknown): Promise<string> {
  try {
    const r = await put(path, JSON.stringify(value), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
    return r.etag;
  } catch (err) {
    if (isAlreadyExists(err)) throw new Conflict(`exists: ${path}`);
    throw err;
  }
}

/** Overwrite JSON, but only if the blob still has `etag`. Throws Conflict when it moved. */
export async function casJson(path: string, value: unknown, etag: string): Promise<string> {
  try {
    const r = await put(path, JSON.stringify(value), {
      access: "private",
      addRandomSuffix: false,
      ifMatch: strongEtag(etag),
      contentType: "application/json",
    });
    return r.etag;
  } catch (err) {
    if (isPreconditionFailed(err)) throw new Conflict(`stale: ${path}`);
    throw err;
  }
}

/**
 * Read-modify-write with retry. `mutate` may be called more than once, so keep it pure.
 * Returning null from `mutate` aborts the write and returns null.
 */
export async function updateJson<T>(
  path: string,
  init: () => T,
  mutate: (current: T) => T | null,
  attempts = 6,
): Promise<T | null> {
  for (let i = 0; i < attempts; i += 1) {
    const cur = await readJson<T>(path);
    try {
      if (!cur) {
        const next = mutate(init());
        if (next === null) return null;
        await createJson(path, next);
        return next;
      }
      const next = mutate(cur.value);
      if (next === null) return null;
      await casJson(path, next, cur.etag);
      return next;
    } catch (err) {
      if (err instanceof Conflict) {
        // Somebody wrote first. Back off a little and read again.
        await new Promise((r) => setTimeout(r, 40 + i * 60));
        continue;
      }
      throw err;
    }
  }
  throw new Conflict(`giving up after ${attempts} attempts: ${path}`);
}

export async function listPaths(prefix: string): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

export async function deletePath(path: string): Promise<void> {
  try {
    await del(path);
  } catch {
    /* already gone is fine */
  }
}
