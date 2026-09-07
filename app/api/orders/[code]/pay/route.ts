import { bad, clientIp, json, rateLimit } from "@/lib/server/http";
import { HAS_STORE } from "@/lib/server/kv";
import { DEADLINE_MS, graceEndsMs } from "@/lib/server/pricing";
import { getOrder } from "@/lib/server/repo";
import { PAYMENTS_LIVE, PUBLISHABLE_KEY, createPaymentIntent } from "@/lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * (Re)start payment on an existing PENDING_PAYMENT order - the retry path for a card that
 * failed or a tab that closed. The PaymentIntent is idempotent by order code, so this hands
 * back the SAME intent every time; there is no way to charge an order twice from here.
 */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!HAS_STORE) return bad("not configured", 503);
  if (!PAYMENTS_LIVE) return bad("payments are not connected", 503);
  const { code } = await ctx.params;
  if (!rateLimit(`pay:${clientIp(req)}`, 20, 60_000)) return bad("slow down", 429);

  const order = await getOrder(code);
  if (!order) return bad("not found", 404);
  if (order.status === "PAID") return bad("already paid", 409);
  if (order.status !== "PENDING_PAYMENT") return bad("that order is not payable", 409);
  // The same window as ordering itself: pending orders do not outlive the grace period.
  if (Date.now() >= graceEndsMs() && Date.now() >= DEADLINE_MS) {
    return bad("the deadline has passed; call your community rep", 409);
  }

  try {
    const intent = await createPaymentIntent({
      amountCents: order.totalCents,
      code: order.code,
      siteSlug: order.siteSlug,
      name: order.customerName,
      phone: order.phone,
    });
    return json({ clientSecret: intent.clientSecret, publishableKey: PUBLISHABLE_KEY });
  } catch {
    return bad("could not start the payment; try again", 502);
  }
}
