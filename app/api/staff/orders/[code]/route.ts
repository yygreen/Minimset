import type { Order } from "@/lib/orders";
import { bad, clean, inScope, json, staffScope } from "@/lib/server/http";
import { getOrder, logAudit, mutateOrder, purgeOrder, useReserve } from "@/lib/server/repo";
import { HAS_STORE } from "@/lib/server/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const scope = await staffScope();
  if (!scope) return bad("not signed in", 401);
  if (!HAS_STORE) return bad("not configured", 503);
  const { code } = await ctx.params;
  const order = await getOrder(code);
  // 404 for out-of-scope too: a rep must not be able to probe which codes exist elsewhere.
  if (!order || !inScope(scope, order.siteSlug)) return bad("not found", 404);
  return json({ order });
}

function derive(items: Order["items"]): Order["status"] {
  const total = items.reduce((n, i) => n + i.quantity, 0);
  const taken = items.reduce((n, i) => n + i.qtyPickedUp, 0);
  if (taken === 0) return "PAID";
  return taken >= total ? "FULFILLED" : "PARTIALLY_PICKED_UP";
}

/**
 * Distribution-day actions. One endpoint, one action per call, every one written to the audit
 * log, because on the day itself the question is always "who handed this over, and when".
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

  // Scope is checked against the ORDER's site, before any action touches it.
  const target = await getOrder(code);
  if (!target || !inScope(scope, target.siteSlug)) return bad("not found", 404);
  // Purging an order outright is an admin move; a rep corrects mistakes through the office.
  if (action === "purge" && scope.role !== "admin") return bad("admin only", 403);

  if (action === "pickup") {
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return bad("bad quantity");
    const updated = await mutateOrder(code, (cur): Order | null => {
      if (cur.status === "CANCELLED_REFUNDED") return null;
      const items = cur.items.map((i) =>
        i.id === itemId
          ? { ...i, qtyPickedUp: Math.min(i.quantity, i.qtyPickedUp + quantity) }
          : i,
      );
      if (!items.some((i) => i.id === itemId)) return null;
      return { ...cur, items, status: derive(items), updatedAt: new Date().toISOString() };
    });
    if (!updated) return bad("cannot pick up on that order", 409);
    await logAudit({ action: "PICKUP", code: updated.code, itemId, quantity });
    return json({ order: updated });
  }

  if (action === "undo") {
    const updated = await mutateOrder(code, (cur): Order | null => {
      const items = cur.items.map((i) => ({ ...i, qtyPickedUp: 0 }));
      return { ...cur, items, status: derive(items), updatedAt: new Date().toISOString() };
    });
    if (!updated) return bad("not found", 404);
    await logAudit({ action: "UNDO_PICKUP", code: updated.code });
    return json({ order: updated });
  }

  if (action === "exchange") {
    const note = clean(body.note, 200);
    let level: Order["items"][number]["levelKey"];
    const updated = await mutateOrder(code, (cur): Order | null => {
      const item = cur.items.find((i) => i.id === itemId);
      if (!item || item.kind !== "LEVEL" || !item.levelKey) return null;
      level = item.levelKey;
      return {
        ...cur,
        exchanges: [...cur.exchanges, { itemId, at: new Date().toISOString(), note }],
        updatedAt: new Date().toISOString(),
      };
    });
    if (!updated) return bad("that item cannot be exchanged", 409);
    const reserve = level ? await useReserve(updated.siteSlug, level) : null;
    const short = level && reserve ? reserve[level].used > reserve[level].shipped : false;
    await logAudit({ action: "EXCHANGE", code: updated.code, itemId, note, short });
    return json({ order: updated, reserve, reserveShort: short });
  }

  if (action === "unclaimed") {
    const updated = await mutateOrder(code, (cur): Order | null => {
      if (cur.status === "CANCELLED_REFUNDED") return null;
      return { ...cur, status: "UNCLAIMED", updatedAt: new Date().toISOString() };
    });
    if (!updated) return bad("cannot mark that order", 409);
    await logAudit({ action: "UNCLAIMED", code: updated.code });
    return json({ order: updated });
  }

  if (action === "purge") {
    // Removes an order outright. Used by the QA golden path to clean up after itself, and by
    // an admin clearing a mistake; every purge is in the audit log with what it contained.
    const existing = await getOrder(code);
    if (!existing) return bad("not found", 404);
    await purgeOrder(existing);
    await logAudit({
      action: "PURGE",
      code: existing.code,
      site: existing.siteSlug,
      name: existing.customerName,
      totalCents: existing.totalCents,
    });
    return json({ purged: existing.code });
  }

  return bad("unknown action");
}
