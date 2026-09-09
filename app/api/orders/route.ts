import type { Address, Order } from "@/lib/orders";
import { currentShippingCents } from "@/lib/orders";
import { verify } from "@/lib/server/auth";
import { bad, clean, clientIp, json, rateLimit } from "@/lib/server/http";
import { notifyPaid } from "@/lib/server/notify";
import { BadCart, DEADLINE_MS, GRACE_MINUTES, graceEndsMs, priceCart } from "@/lib/server/pricing";
import { countOrders, createOrder } from "@/lib/server/repo";
import { HAS_STORE } from "@/lib/server/kv";
import { PAYMENTS_LIVE, createPaymentIntent } from "@/lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ceiling on orders the shipment can absorb. Null means no cap. */
const ORDER_CAP: number | null = null;

const STATE_RE = /^[A-Z]{2}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;

/** A shipping address the carrier could actually deliver to, or null. */
function readAddress(raw: unknown): Address | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const address: Address = {
    line1: clean(a.line1, 120),
    line2: clean(a.line2, 120),
    city: clean(a.city, 80),
    state: clean(a.state, 2).toUpperCase(),
    zip: clean(a.zip, 10),
  };
  if (address.line1.length < 4) return null;
  if (address.city.length < 2) return null;
  if (!STATE_RE.test(address.state)) return null;
  if (!ZIP_RE.test(address.zip)) return null;
  return address;
}

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

  const address = readAddress(body.address);
  if (!address) return bad("a complete shipping address is required");

  if (ORDER_CAP !== null) {
    const taken = await countOrders();
    if (taken >= ORDER_CAP) return bad("the shipment is full", 409);
  }

  const shippingCents = currentShippingCents();
  const nowIso = new Date().toISOString();
  const draft: Omit<Order, "code"> = {
    status: PAYMENTS_LIVE ? "PENDING_PAYMENT" : "PAID",
    customerName,
    phone,
    email,
    address,
    items: priced.items,
    shippingCents,
    totalCents: priced.totalCents + shippingCents,
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
