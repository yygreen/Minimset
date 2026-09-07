/**
 * The order book. Everything the site knows about an order lives here.
 *
 * Layout in the private blob store:
 *   orders/{CODE}.json      one order, the source of truth
 *   index/{site}.json       compact rows for the staff screens (rebuildable, see reconcile)
 *   reserve/{site}.json     reserve stock per level, per site (the spec's ReserveStock)
 *   notify/{CODE}/{id}.json the notification log
 *   audit/{day}.json        who did what on a staff screen
 *
 * The index is a cache, never the truth: countOrders() compares it against a listing of
 * orders/ and rebuilds when they disagree, so a lost CAS race heals itself instead of
 * quietly under-reporting a paid order.
 */
import { CODE_ALPHABET, SITES, type LevelKey } from "@/lib/data";
import type { Channel, Order, OrderItem, OrderStatus } from "@/lib/orders";
import { Conflict, createJson, deletePath, listPaths, readJson, updateJson } from "./kv";

export interface IndexRow {
  code: string;
  siteSlug: string;
  status: OrderStatus;
  channel: Channel;
  customerName: string;
  phone: string;
  totalCents: number;
  sets: number;
  createdAt: string;
  isDemo?: boolean;
}

export interface SiteIndex {
  rows: IndexRow[];
}

export type Reserve = Record<LevelKey, { shipped: number; used: number }>;

const EMPTY_RESERVE: Reserve = {
  MEHUDAR_AA: { shipped: 0, used: 0 },
  MEHUDAR_A: { shipped: 0, used: 0 },
  CHINUCH: { shipped: 0, used: 0 },
};

const orderPath = (code: string) => `orders/${code}.json`;
const indexPath = (site: string) => `index/${site}.json`;
const reservePath = (site: string) => `reserve/${site}.json`;

export function rowOf(order: Order): IndexRow {
  return {
    code: order.code,
    siteSlug: order.siteSlug,
    status: order.status,
    channel: order.channel,
    customerName: order.customerName,
    phone: order.phone,
    totalCents: order.totalCents,
    sets: order.items.filter((i) => i.kind === "LEVEL").reduce((n, i) => n + i.quantity, 0),
    createdAt: order.createdAt,
    ...(order.isDemo ? { isDemo: true as const } : {}),
  };
}

/** Crypto-random code in the spec's alphabet (no I, L, O, 0, 1 to survive a phone call). */
function randomCode(len = 7): string {
  const bytes = new Uint8Array(len);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i += 1) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

export async function getOrder(code: string): Promise<Order | null> {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,10}$/.test(clean)) return null;
  const rec = await readJson<Order>(orderPath(clean));
  return rec?.value ?? null;
}

async function putRow(order: Order): Promise<void> {
  await updateJson<SiteIndex>(
    indexPath(order.siteSlug),
    () => ({ rows: [] }),
    (cur) => {
      const rows = cur.rows.filter((r) => r.code !== order.code);
      rows.push(rowOf(order));
      rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return { rows };
    },
  );
}

async function dropRow(siteSlug: string, code: string): Promise<void> {
  await updateJson<SiteIndex>(
    indexPath(siteSlug),
    () => ({ rows: [] }),
    (cur) => ({ rows: cur.rows.filter((r) => r.code !== code) }),
  );
}

/**
 * Claim a code and write the order. The code is claimed by an atomic create, so two
 * simultaneous orders can never share one; a collision just draws again.
 */
export async function createOrder(draft: Omit<Order, "code">): Promise<Order> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomCode(attempt < 5 ? 7 : 8);
    const order: Order = { ...draft, code };
    try {
      await createJson(orderPath(code), order);
      await putRow(order);
      return order;
    } catch (err) {
      if (err instanceof Conflict) continue;
      throw err;
    }
  }
  throw new Error("could not allocate an order code");
}

/**
 * Read-modify-write one order, then refresh its index row.
 * Returns null when the order does not exist or the mutation declined to write.
 */
export async function mutateOrder(
  code: string,
  mutate: (order: Order) => Order | null,
): Promise<Order | null> {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,10}$/.test(clean)) return null;
  const existing = await readJson<Order>(orderPath(clean));
  if (!existing) return null;

  const next = await updateJson<Order>(
    orderPath(clean),
    () => existing.value,
    (cur) => mutate(cur),
  );
  if (next) await putRow(next);
  return next;
}

export async function listSiteRows(siteSlug: string): Promise<IndexRow[]> {
  const rec = await readJson<SiteIndex>(indexPath(siteSlug));
  return rec?.value.rows ?? [];
}

/** Every row across every site, index-first, with a self-heal when the index is behind. */
export async function listAllRows(): Promise<IndexRow[]> {
  const perSite = await Promise.all(SITES.map((s) => listSiteRows(s.slug)));
  const rows = perSite.flat();
  const paths = await listPaths("orders/");
  if (paths.length === rows.length) return rows;
  return reconcile();
}

/** Rebuild every index from the orders themselves. The index is a cache; this is the truth. */
export async function reconcile(): Promise<IndexRow[]> {
  const paths = await listPaths("orders/");
  const orders: Order[] = [];
  const size = 12;
  for (let i = 0; i < paths.length; i += size) {
    const batch = await Promise.all(
      paths.slice(i, i + size).map((p) => readJson<Order>(p).then((r) => r?.value ?? null)),
    );
    orders.push(...batch.filter((o): o is Order => Boolean(o)));
  }
  const bySite = new Map<string, IndexRow[]>();
  for (const o of orders) {
    const rows = bySite.get(o.siteSlug) ?? [];
    rows.push(rowOf(o));
    bySite.set(o.siteSlug, rows);
  }
  for (const site of SITES) {
    const rows = (bySite.get(site.slug) ?? []).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    await updateJson<SiteIndex>(
      indexPath(site.slug),
      () => ({ rows: [] }),
      () => ({ rows }),
    );
  }
  return [...bySite.values()].flat();
}

export async function countSiteOrders(siteSlug: string): Promise<number> {
  const rows = await listSiteRows(siteSlug);
  return rows.filter((r) => r.status !== "CANCELLED_REFUNDED").length;
}

export async function getReserve(siteSlug: string): Promise<Reserve> {
  const rec = await readJson<Reserve>(reservePath(siteSlug));
  return rec?.value ?? { ...EMPTY_RESERVE };
}

/** `used` is optional: an admin correcting a miscount may set it, otherwise it is left alone. */
export async function setReserveShipped(
  siteSlug: string,
  level: LevelKey,
  shipped: number,
  used?: number,
) {
  return updateJson<Reserve>(
    reservePath(siteSlug),
    () => ({ ...EMPTY_RESERVE }),
    (cur) => ({
      ...cur,
      [level]: {
        shipped: Math.max(0, Math.trunc(shipped)),
        used: used === undefined ? cur[level].used : Math.max(0, Math.trunc(used)),
      },
    }),
  );
}

/** An exchange takes one unit out of reserve. Allowed past zero, but the caller is warned. */
export async function useReserve(siteSlug: string, level: LevelKey): Promise<Reserve | null> {
  return updateJson<Reserve>(
    reservePath(siteSlug),
    () => ({ ...EMPTY_RESERVE }),
    (cur) => ({ ...cur, [level]: { ...cur[level], used: cur[level].used + 1 } }),
  );
}

export async function logNotification(code: string, kind: string, detail: unknown) {
  const id = `${Date.now()}-${Math.trunc(globalThis.crypto.getRandomValues(new Uint32Array(1))[0])}`;
  await createJson(`notify/${code}/${id}.json`, { code, kind, at: new Date().toISOString(), detail });
}

export async function logAudit(entry: Record<string, unknown>) {
  const day = new Date().toISOString().slice(0, 10);
  await updateJson<{ entries: unknown[] }>(
    `audit/${day}.json`,
    () => ({ entries: [] }),
    (cur) => ({ entries: [...cur.entries, { at: new Date().toISOString(), ...entry }].slice(-2000) }),
  );
}

/**
 * Remove one order outright: the record, its index row, and its notification log. Audited by
 * the caller. The notify entries go too, or a purged order leaves its customer's address
 * behind in the log it was purged to remove.
 */
export async function purgeOrder(order: Order): Promise<void> {
  await deletePath(orderPath(order.code));
  await dropRow(order.siteSlug, order.code);
  for (const path of await listPaths(`notify/${order.code}/`)) await deletePath(path);
}

/** Used by the staff "clear demo data" action; never touches a real order. */
export async function deleteDemoOrders(): Promise<number> {
  const rows = await listAllRows();
  const demo = rows.filter((r) => r.isDemo);
  for (const r of demo) {
    await deletePath(orderPath(r.code));
    await dropRow(r.siteSlug, r.code);
  }
  return demo.length;
}

export type { Order, OrderItem };
