import type { Order } from "@/lib/orders";
import { bad, clean, json, staffScope } from "@/lib/server/http";
import { getOrder, logAudit, mutateOrder, purgeOrder } from "@/lib/server/repo";
import { HAS_STORE } from "@/lib/server/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const scope = await staffScope();
  if (!scope) return bad("not signed in", 401);
  if (!HAS_STORE) return bad("not configured", 503);
  const { code } = await ctx.params;
  const order = await getOrder(code);
  if (!order) return bad("not found", 404);
  return json({ order });
}

/**
 * Fulfilment actions. One endpoint, one action per call, every one written to the audit log,
 * because the question later is always "who sent this, and when".
 */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const scope = await staffScope();
  if (!scope) return bad("not signed in", 401);
  if (!HAS_STORE) return bad("not configured", 503);

  const { code } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return bad("bad request");
  }
  const action = String(body.action ?? "");
  const itemId = clean(body.itemId, 20);

  const target = await getOrder(code);
  if (!target) return bad("not found", 404);

  if (action === "ship") {
    const carrier = clean(body.carrier, 40);
    const trackingNumber = clean(body.trackingNumber, 60);
    if (!carrier) return bad("a carrier is required");
    if (trackingNumber.length < 4) return bad("a tracking number is required");
    const updated = await mutateOrder(code, (cur): Order | null => {
      if (cur.status === "CANCELLED_REFUNDED" || cur.status === "PENDING_PAYMENT") return null;
      const at = new Date().toISOString();
      return { ...cur, status: "SHIPPED", carrier, trackingNumber, shippedAt: at, updatedAt: at };
    });
    if (!updated) return bad("that order cannot be shipped yet", 409);
    await logAudit({ action: "SHIP", code: updated.code, carrier, trackingNumber });
    return json({ order: updated });
  }

  if (action === "delivered") {
    const updated = await mutateOrder(code, (cur): Order | null => {
      if (cur.status !== "SHIPPED") return null;
      return { ...cur, status: "DELIVERED", updatedAt: new Date().toISOString() };
    });
    if (!updated) return bad("only a shipped order can be marked delivered", 409);
    await logAudit({ action: "DELIVERED", code: updated.code });
    return json({ order: updated });
  }

  if (action === "undo") {
    // Back to PAID: a tracking number keyed against the wrong order, corrected.
    const updated = await mutateOrder(code, (cur): Order | null => {
      if (cur.status !== "SHIPPED" && cur.status !== "DELIVERED") return null;
      const next = { ...cur, status: "PAID" as const, updatedAt: new Date().toISOString() };
      delete next.carrier;
      delete next.trackingNumber;
      delete next.shippedAt;
      return next;
    });
    if (!updated) return bad("nothing to undo on that order", 409);
    await logAudit({ action: "UNDO_SHIP", code: updated.code });
    return json({ order: updated });
  }

  if (action === "exchange") {
    const note = clean(body.note, 200);
    const updated = await mutateOrder(code, (cur): Order | null => {
      const item = cur.items.find((i) => i.id === itemId);
      if (!item || item.kind !== "LEVEL" || !item.levelKey) return null;
      return {
        ...cur,
        exchanges: [...cur.exchanges, { itemId, at: new Date().toISOString(), note }],
        updatedAt: new Date().toISOString(),
      };
    });
    if (!updated) return bad("that item cannot be exchanged", 409);
    await logAudit({ action: "EXCHANGE", code: updated.code, itemId, note });
    return json({ order: updated });
  }

  if (action === "purge") {
    // Removes an order outright. Used by the QA golden path to clean up after itself, and by
    // an admin clearing a mistake; every purge is in the audit log with what it contained.
    await purgeOrder(target);
    await logAudit({
      action: "PURGE",
      code: target.code,
      name: target.customerName,
      totalCents: target.totalCents,
    });
    return json({ purged: target.code });
  }

  return bad("unknown action");
}
