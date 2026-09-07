import type { Order } from "@/lib/orders";
import { bad, ok } from "@/lib/server/http";
import { notifyPaid } from "@/lib/server/notify";
import { logAudit, mutateOrder } from "@/lib/server/repo";
import { STRIPE_WEBHOOK_SECRET, verifyWebhook } from "@/lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The only thing allowed to mark an order PAID when a processor is connected. Idempotent:
 * Stripe retries, and a second delivery of the same event must be a no-op, not a second
 * confirmation email.
 */
export async function POST(req: Request) {
  if (!STRIPE_WEBHOOK_SECRET) return bad("webhooks are not configured", 503);

  const payload = await req.text();
  if (!(await verifyWebhook(payload, req.headers.get("stripe-signature")))) {
    return bad("bad signature", 400);
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return bad("bad payload");
  }

  const intent = event.data?.object ?? {};
  const code = String((intent.metadata as Record<string, string> | undefined)?.code ?? "");
  if (!code) return ok({ ignored: true });

  if (event.type === "payment_intent.succeeded") {
    let flipped = false;
    const updated = await mutateOrder(code, (cur): Order | null => {
      if (cur.status !== "PENDING_PAYMENT") return null; // already handled
      flipped = true;
      const nowIso = new Date().toISOString();
      return {
        ...cur,
        status: "PAID",
        paymentRef: String(intent.id ?? ""),
        paidAt: nowIso,
        updatedAt: nowIso,
      };
    });
    if (updated && flipped) {
      await logAudit({ action: "PAID", code, ref: String(intent.id ?? "") });
      await notifyPaid(updated);
    }
    return ok({ handled: true, flipped });
  }

  if (event.type === "payment_intent.payment_failed") {
    await logAudit({ action: "PAYMENT_FAILED", code, ref: String(intent.id ?? "") });
    return ok({ handled: true });
  }

  return ok({ ignored: true });
}
