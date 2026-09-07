import { getSite } from "@/lib/data";
import type { Order } from "@/lib/orders";
import { bad, clean, inScope, json, staffScope } from "@/lib/server/http";
import { BadCart, priceCart } from "@/lib/server/pricing";
import { createOrder, listAllRows, listSiteRows, logAudit } from "@/lib/server/repo";
import { HAS_STORE, readJson } from "@/lib/server/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The order list behind the staff screens. Index-backed (one read per site) for the search
 * screen; `?full=1` hydrates every order for distribution day, which needs the line items.
 */
export async function GET(req: Request) {
  const scope = await staffScope();
  if (!scope) return bad("not signed in", 401);
  if (!HAS_STORE) return json({ rows: [], orders: [], configured: false });

  const url = new URL(req.url);
  // A rep's scope wins over whatever the query asks for. The filter is here, not in the UI.
  const site = scope.role === "rep" ? scope.site! : url.searchParams.get("site");
  const rows = site ? await listSiteRows(site) : await listAllRows();

  if (url.searchParams.get("full") !== "1") return json({ rows, configured: true });

  const orders: Order[] = [];
  const size = 12;
  for (let i = 0; i < rows.length; i += size) {
    const batch = await Promise.all(
      rows.slice(i, i + size).map((r) => readJson<Order>(`orders/${r.code}.json`).then((x) => x?.value ?? null)),
    );
    orders.push(...batch.filter((o): o is Order => Boolean(o)));
  }
  return json({ rows, orders, configured: true });
}

/**
 * Paper channel. A rep keys an order taken on a sheet at the Beis Medrash; it is PAID on
 * creation with a cash or check payment, and flows into totals and distribution identically.
 */
export async function POST(req: Request) {
  const scope = await staffScope();
  if (!scope) return bad("not signed in", 401);
  if (!HAS_STORE) return bad("not configured", 503);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return bad("bad request");
  }

  const site = getSite(String(body.siteSlug ?? ""));
  if (!site) return bad("unknown community");
  if (!inScope(scope, site.slug)) return bad("outside your site", 403);

  let priced;
  try {
    priced = priceCart(body.lines);
  } catch (err) {
    return bad(err instanceof BadCart ? err.message : "bad cart");
  }

  const customerName = clean(body.customerName, 80);
  const phone = clean(body.phone, 32);
  if (customerName.length < 2) return bad("name is required");
  if (phone.replace(/\D/g, "").length < 7) return bad("a phone number is required");

  const method = body.paymentMethod === "CHECK" ? "CHECK" : "CASH";
  const nowIso = new Date().toISOString();

  const order = await createOrder({
    siteSlug: site.slug,
    status: "PAID",
    channel: "PAPER",
    customerName,
    phone,
    email: clean(body.email, 120),
    shul: clean(body.shul, 80),
    items: priced.items,
    totalCents: priced.totalCents,
    paymentMethod: method,
    createdAt: nowIso,
    updatedAt: nowIso,
    paidAt: nowIso,
    paymentRef: method,
    notes: clean(body.notes, 400),
    enteredBy: clean(body.enteredBy, 60) || "rep",
    exchanges: [],
  } satisfies Omit<Order, "code">);

  await logAudit({ action: "PAPER_ORDER", code: order.code, site: site.slug, method });
  return json({ order });
}
