import type { Order } from "@/lib/orders";
import { bad, json, staffScope } from "@/lib/server/http";
import { listAllRows } from "@/lib/server/repo";
import { HAS_STORE, readJson } from "@/lib/server/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The order list behind the staff screens. Index-backed for the search screen;
 * `?full=1` hydrates every order for the packing screen, which needs the line
 * items and the delivery address.
 */
export async function GET(req: Request) {
  const scope = await staffScope();
  if (!scope) return bad("not signed in", 401);
  if (!HAS_STORE) return json({ rows: [], orders: [], configured: false });

  const url = new URL(req.url);
  const rows = await listAllRows();

  if (url.searchParams.get("full") !== "1") return json({ rows, configured: true });

  const orders: Order[] = [];
  const size = 12;
  for (let i = 0; i < rows.length; i += size) {
    const batch = await Promise.all(
      rows.slice(i, i + size).map((r) => readJson<Order>(`orders/${r.code}.json`).then((x) => x?.value ?? null)),
    );
    orders.push(...batch.filter((o): o is Order => Boolean(o)));
  }
  return json({ rows, orders, configured: true });
}
