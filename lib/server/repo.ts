/**
 * The order book. Everything the site knows about an order lives here.
 *
 * Layout in the private blob store:
 *   orders/{CODE}.json      one order, the source of truth
 *   index/all.json          compact rows for the staff screens (rebuildable, see reconcile)
 *   notify/{CODE}/{id}.json the notification log
 *   audit/{day}.json        who did what on a staff screen
 *
 * The index is a cache, never the truth: listAllRows() compares it against a listing of
 * orders/ and rebuilds when they disagree, so a lost CAS race heals itself instead of
 * quietly under-reporting a paid order.
 *
 * There used to be one index and one reserve-stock record per community, back when
 * orders were collected at four Beis Medrash tables. The program ships to the door
 * now: one index, no reserve.
 */
import { CODE_ALPHABET } from "@/lib/data";
import type { Order, OrderItem, OrderStatus } from "@/lib/orders";
import { Conflict, createJson, deletePath, listPaths, readJson, updateJson } from "./kv";

export interface IndexRow {
  code: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  /** Enough of the address to scan a list without opening every order. */
  city: string;
  state: string;
  totalCents: number;
  sets: number;
  createdAt: string;
  isDemo?: boolean;
}

export interface OrderIndex {
  rows: IndexRow[];
}

const orderPath = (code: string) => `orders/${code}.json`;
const INDEX_PATH = "index/all.json";

export function rowOf(order: Order): IndexRow {
  return {
    code: order.code,
    status: order.status,
    customerName: order.customerName,
    phone: order.phone,
    city: order.address?.city ?? "",
    state: order.address?.state ?? "",
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
  await updateJson<OrderIndex>(
    INDEX_PATH,
    () => ({ rows: [] }),
    (cur) => {
      const rows = cur.rows.filter((r) => r.code !== order.code);
      rows.push(rowOf(order));
      rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return { rows };
    },
  );
}

async function dropRow(code: string): Promise<void> {
  await updateJson<OrderIndex>(
    INDEX_PATH,
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

/** Every row, index-first, with a self-heal when the index is behind the orders. */
export async function listAllRows(): Promise<IndexRow[]> {
  const rec = await readJson<OrderIndex>(INDEX_PATH);
  const rows = rec?.value.rows ?? [];
  const paths = await listPaths("orders/");
  if (paths.length === rows.length) return rows;
  return reconcile();
}

/** Rebuild the index from the orders themselves. The index is a cache; this is the truth. */
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
  const rows = orders
    .map(rowOf)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  await updateJson<OrderIndex>(INDEX_PATH, () => ({ rows: [] }), () => ({ rows }));
  return rows;
}

export async function countOrders(): Promise<number> {
  const rows = await listAllRows();
  return rows.filter((r) => r.status !== "CANCELLED_REFUNDED").length;
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
  await dropRow(order.code);
  for (const path of await listPaths(`notify/${order.code}/`)) await deletePath(path);
}

/** Used by the staff "clear demo data" action; never touches a real order. */
export async function deleteDemoOrders(): Promise<number> {
  const rows = await listAllRows();
  const demo = rows.filter((r) => r.isDemo);
  for (const r of demo) {
    await deletePath(orderPath(r.code));
    await dropRow(r.code);
  }
  return demo.length;
}

export type { Order, OrderItem };
