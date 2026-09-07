import { seedOrders } from "@/lib/orders";
import { bad, guardAdmin, json } from "@/lib/server/http";
import { createJson, Conflict } from "@/lib/server/kv";
import { deleteDemoOrders, logAudit, reconcile } from "@/lib/server/repo";
import { HAS_STORE } from "@/lib/server/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sample data, so the staff screens can be reviewed before a single real order exists.
 * Every seeded order is flagged isDemo and can be cleared in one call; nothing here can
 * touch a real order.
 */
export async function POST() {
  const denied = await guardAdmin();
  if (denied) return denied;
  if (!HAS_STORE) return bad("not configured", 503);

  let written = 0;
  for (const order of seedOrders()) {
    try {
      await createJson(`orders/${order.code}.json`, { ...order, isDemo: true });
      written += 1;
    } catch (err) {
      if (!(err instanceof Conflict)) throw err;
    }
  }
  const rows = await reconcile();
  await logAudit({ action: "SEED_DEMO", written });
  return json({ written, rows: rows.length });
}

export async function DELETE() {
  const denied = await guardAdmin();
  if (denied) return denied;
  if (!HAS_STORE) return bad("not configured", 503);
  const removed = await deleteDemoOrders();
  await logAudit({ action: "CLEAR_DEMO", removed });
  return json({ removed });
}
