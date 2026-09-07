import { getSite } from "@/lib/data";
import type { Order } from "@/lib/orders";
import { verify } from "@/lib/server/auth";
import { bad, clean, clientIp, json, rateLimit } from "@/lib/server/http";
import { notifyPaid } from "@/lib/server/notify";
import { BadCart, DEADLINE_MS, GRACE_MINUTES, graceEndsMs, priceCart } from "@/lib/server/pricing";
import { countSiteOrders, createOrder } from "@/lib/server/repo";
import { HAS_STORE } from "@/lib/server/kv";
import { PAYMENTS_LIVE, createPaymentIntent } from "@/lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Per-site ceiling. Null means no cap. Kept here so it can be raised without a data migration. */
const SITE_CAP: Record<string, number | null> = {
  baltimore: null,
  lakewood: null,
  monsey: null,
  "five-towns": null,
};

export async function POST(req: Request) {
  if (!HAS_STORE) return bad("ordering is not configured", 503);
  // Generous on purpose: a shul, a yeshiva or one family's house all share a single IP, and
  // several people ordering in the same minute is the good case, not the attack.
  if (!rateLimit(`order:${clientIp(req)}`, 30, 60_000)) return bad("slow down", 429);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return bad("bad request");
  }

  const site = getSite(String(body.siteSlug ?? ""));
  if (!site) return bad("unknown community");
  if (site.status !== "OPEN") return bad("that community is closed", 409);

  /* ---- deadline, with the spec's grace window ---- */
  const now = Date.now();
  if (now >= DEADLINE_MS) {
    const ticket = verify<{ iat: number; kind: string }>(String(body.ticket ?? ""));
    const inGrace =
      ticket?.kind === "checkout" && ticket.iat < DEADLINE_MS && now < graceEndsMs();
    if (!inGrace) {
      return json(
        { error: "closed", message: `Ordering closed at the deadline. Grace window: ${GRACE_MINUTES} minutes.` },
        409,
      );
    }
  }

  /* ---- money is ours to decide ---- */
  let priced;
  try {
    priced = priceCart(body.lines);
  } catch (err) {
    return bad(err instanceof BadCart ? err.message : "bad cart");
  }

  /* ---- customer ---- */
  const customerName = clean(body.customerName, 80);
  const phone = clean(body.phone, 32);
  if (customerName.length < 2) return bad("name is required");
  if (phone.replace(/\D/g, "").length < 7) return bad("a phone number is required");
  const email = clean(body.email, 120);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("that email does not look right");

  const cap = SITE_CAP[site.slug];
  if (cap !== null && cap !== undefined) {
    const taken = await countSiteOrders(site.slug);
    if (taken >= cap) return bad("that community is full", 409);
  }

  const nowIso = new Date().toISOString();
  const draft: Omit<Order, "code"> = {
    siteSlug: site.slug,
    status: PAYMENTS_LIVE ? "PENDING_PAYMENT" : "PAID",
    channel: "ONLINE",
    customerName,
    phone,
    email,
    shul: clean(body.shul, 80),
    items: priced.items,
    totalCents: priced.totalCents,
    paymentMethod: "CARD",
    createdAt: nowIso,
    updatedAt: nowIso,
    notes: clean(body.notes, 400),
    exchanges: [],
    ...(PAYMENTS_LIVE ? {} : { paymentRef: "DEMO", paidAt: nowIso }),
    ...(now >= DEADLINE_MS ? { grace: true } : {}),
  };

  const order = await createOrder(draft);

  /* ---- payment ---- */
  if (PAYMENTS_LIVE) {
    try {
      const intent = await createPaymentIntent({
        amountCents: order.totalCents,
        code: order.code,
        siteSlug: order.siteSlug,
        name: order.customerName,
        phone: order.phone,
      });
      return json({ code: order.code, status: order.status, clientSecret: intent.clientSecret });
    } catch {
      // The order exists and is PENDING_PAYMENT; the customer can retry payment on it.
      return json({ code: order.code, status: order.status, paymentError: true }, 202);
    }
  }

  await notifyPaid(order);
  return json({ code: order.code, status: order.status, demo: true });
}
