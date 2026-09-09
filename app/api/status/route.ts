import { STAFF_LOCKED } from "@/lib/server/auth";
import { json, staffScope } from "@/lib/server/http";
import { HAS_STORE } from "@/lib/server/kv";
import { NOTIFY_ENABLED } from "@/lib/server/notify";
import { GRACE_MINUTES } from "@/lib/server/pricing";
import { PAYMENTS_LIVE } from "@/lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * What the backend can actually do right now. The order flow reads this so the site
 * degrades honestly instead of pretending: no store means the checkout says so rather
 * than taking an order nobody will ever see.
 */
export async function GET() {
  const scope = await staffScope();
  return json({
    store: HAS_STORE,
    payments: PAYMENTS_LIVE ? "live" : "demo",
    notifications: NOTIFY_ENABLED ? "on" : "off",
    staffLocked: STAFF_LOCKED,
    staffSignedIn: scope !== null,
    staffRole: scope?.role ?? null,
    graceMinutes: GRACE_MINUTES,
    serverNow: Date.now(),
  });
}
