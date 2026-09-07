/**
 * Stripe, over plain fetch. No SDK: this is two endpoints and one signature check, and an
 * unused 600 KB dependency in a site that must stay fast is a bad trade.
 *
 * The processor is DORMANT until the operator's own keys are set:
 *   STRIPE_SECRET_KEY        sk_live_... or sk_test_... (the OPERATOR's account, not ours)
 *   STRIPE_WEBHOOK_SECRET    whsec_...
 *   NEXT_PUBLIC_STRIPE_KEY   pk_... (only needed when the card fields go live)
 *
 * With no keys the site runs in demo mode exactly as it does today: the card step is a
 * preview and the order is marked PAID with paymentRef DEMO. Money never moves either way
 * without the operator's account, which is the only correct place for it to land.
 */
export const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
export const PAYMENTS_LIVE = STRIPE_KEY.startsWith("sk_");
/** The browser side of the same account. Harmless to expose; useless without it. */
export const PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_KEY || "";

const API = "https://api.stripe.com/v1";

function form(data: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) if (v !== undefined) p.set(k, String(v));
  return p.toString();
}

export interface Intent {
  id: string;
  clientSecret: string;
}

/**
 * One PaymentIntent per order attempt, keyed by the order code so a double-submit cannot
 * create two charges (Stripe's own idempotency, not ours).
 */
export async function createPaymentIntent(args: {
  amountCents: number;
  code: string;
  siteSlug: string;
  name: string;
  phone: string;
}): Promise<Intent> {
  const res = await fetch(`${API}/payment_intents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `order-${args.code}`,
    },
    body: form({
      amount: args.amountCents,
      currency: "usd",
      "automatic_payment_methods[enabled]": "true",
      description: `Arba Minim ${args.code}`,
      statement_descriptor_suffix: "ARBA MINIM",
      "metadata[code]": args.code,
      "metadata[site]": args.siteSlug,
      "metadata[name]": args.name,
      "metadata[phone]": args.phone,
    }),
  });
  const body = (await res.json()) as { id?: string; client_secret?: string; error?: { message: string } };
  if (!res.ok || !body.id || !body.client_secret) {
    throw new Error(body.error?.message || `stripe ${res.status}`);
  }
  return { id: body.id, clientSecret: body.client_secret };
}

/**
 * Verify a webhook the way Stripe documents it: t=timestamp,v1=signature over "t.payload".
 * Rejects anything older than five minutes so a captured request cannot be replayed.
 */
export async function verifyWebhook(payload: string, header: string | null): Promise<boolean> {
  if (!STRIPE_WEBHOOK_SECRET || !header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), p.slice(i + 1)];
    }),
  ) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) return false;
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (!Number.isFinite(age) || age > 300) return false;

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", STRIPE_WEBHOOK_SECRET).update(`${parts.t}.${payload}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
