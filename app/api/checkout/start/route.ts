import { mint, TICKET_TTL_MS } from "@/lib/server/auth";
import { DEADLINE_MS, GRACE_MINUTES } from "@/lib/server/pricing";
import { PAYMENTS_LIVE, PUBLISHABLE_KEY } from "@/lib/server/stripe";
import { bad, clientIp, ok, rateLimit } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issued when the customer reaches the payment step. The ticket's issued-at is the server's,
 * which is what makes the post-deadline grace window honest: a cart that genuinely got to
 * payment in time can still finish, and a phone with a wound-back clock cannot fake it.
 */
export async function POST(req: Request) {
  if (!rateLimit(`start:${clientIp(req)}`, 30, 60_000)) return bad("slow down", 429);

  const now = Date.now();
  if (now >= DEADLINE_MS) return bad("orders are closed", 409);

  return ok({
    ticket: mint({ iat: now, kind: "checkout" }, TICKET_TTL_MS),
    paymentsLive: PAYMENTS_LIVE,
    publishableKey: PAYMENTS_LIVE ? PUBLISHABLE_KEY : "",
    graceMinutes: GRACE_MINUTES,
    serverNow: now,
  });
}
