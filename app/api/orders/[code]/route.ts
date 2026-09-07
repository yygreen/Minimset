import type { Order } from "@/lib/orders";
import { bad, clientIp, json, rateLimit } from "@/lib/server/http";
import { BadCart, DEADLINE_MS, priceCart } from "@/lib/server/pricing";
import { getOrder, logAudit, mutateOrder } from "@/lib/server/repo";
import { HAS_STORE } from "@/lib/server/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The code is the card: whoever holds it may see and edit the order, exactly as at the table. */
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!HAS_STORE) return bad("not configured", 503);
  const { code } = await ctx.params;
  if (!rateLimit(`look:${clientIp(req)}`, 40, 60_000)) return bad("slow down", 429);
  const order = await getOrder(code);
  if (!order) return bad("not found", 404);
  return json({ order });
}

/** Edit the sets before the deadline. Everything is repriced server-side. */
export async function PATCH(req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!HAS_STORE) return bad("not configured", 503);
  const { code } = await ctx.params;
  if (!rateLimit(`edit:${clientIp(req)}`, 20, 60_000)) return bad("slow down", 429);
  if (Date.now() >= DEADLINE_MS) return bad("the deadline has passed; call your community rep", 409);

  let body: { lines?: unknown };
  try {
    body = (await req.json()) as { lines?: unknown };
  } catch {
    return bad("bad request");
  }

  let priced;
  try {
    priced = priceCart(body.lines);
  } catch (err) {
    return bad(err instanceof BadCart ? err.message : "bad cart");
  }

  const updated = await mutateOrder(code, (cur): Order | null => {
    if (cur.status === "CANCELLED_REFUNDED") return null;
    if (cur.items.some((i) => i.qtyPickedUp > 0)) return null;
    return {
      ...cur,
      items: priced.items,
      totalCents: priced.totalCents,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!updated) return bad("that order cannot be changed", 409);
  await logAudit({ action: "EDIT", code: updated.code, totalCents: updated.totalCents });
  return json({ order: updated });
}

/** Cancel before the deadline. A live processor would refund here; today it only marks. */
export async function DELETE(req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!HAS_STORE) return bad("not configured", 503);
  const { code } = await ctx.params;
  if (!rateLimit(`cancel:${clientIp(req)}`, 10, 60_000)) return bad("slow down", 429);
  if (Date.now() >= DEADLINE_MS) return bad("the deadline has passed; call your community rep", 409);

  const updated = await mutateOrder(code, (cur): Order | null => {
    if (cur.status === "CANCELLED_REFUNDED") return cur;
    if (cur.items.some((i) => i.qtyPickedUp > 0)) return null;
    return { ...cur, status: "CANCELLED_REFUNDED", updatedAt: new Date().toISOString() };
  });

  if (!updated) return bad("that order cannot be cancelled", 409);
  await logAudit({ action: "CANCEL", code: updated.code });
  return json({ order: updated });
}
