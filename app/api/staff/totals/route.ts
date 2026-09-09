import type { LevelKey } from "@/lib/data";
import type { Order } from "@/lib/orders";
import { guardAdmin, json } from "@/lib/server/http";
import { listAllRows } from "@/lib/server/repo";
import { HAS_STORE, readJson } from "@/lib/server/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEVEL_KEYS: LevelKey[] = ["MEHUDAR_AA", "MEHUDAR_A", "CHINUCH"];

/**
 * The sheet pulled the moment the deadline passes: sets per level, with and without pitom,
 * add-ons, shipping and revenue. Item detail lives on the orders, so this reads them all -
 * a few hundred, twelve at a time, on an admin screen only.
 */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  if (!HAS_STORE) return json({ configured: false });

  const rows = (await listAllRows()).filter((r) => r.status !== "CANCELLED_REFUNDED");
  const orders: Order[] = [];
  const size = 12;
  for (let i = 0; i < rows.length; i += size) {
    const batch = await Promise.all(
      rows.slice(i, i + size).map((r) => readJson<Order>(`orders/${r.code}.json`).then((x) => x?.value ?? null)),
    );
    orders.push(...batch.filter((o): o is Order => Boolean(o)));
  }

  const blank = () => ({
    levels: Object.fromEntries(
      LEVEL_KEYS.map((k) => [k, { sets: 0, withPitom: 0, withoutPitom: 0, cents: 0 }]),
    ) as Record<LevelKey, { sets: number; withPitom: number; withoutPitom: number; cents: number }>,
    addOns: {} as Record<string, { qty: number; cents: number }>,
    orders: 0,
    shippingCents: 0,
    revenueCents: 0,
  });

  /* Where the boxes go, so the office can see the shape of the shipment at a glance. */
  const byState = new Map<string, { orders: number; sets: number }>();
  const all = blank();

  for (const o of orders) {
    all.orders += 1;
    all.revenueCents += o.totalCents;
    all.shippingCents += o.shippingCents ?? 0;

    const st = o.address?.state || "??";
    const region = byState.get(st) ?? { orders: 0, sets: 0 };
    region.orders += 1;

    for (const i of o.items) {
      const cents = i.unitPriceCents * i.quantity;
      if (i.kind === "LEVEL" && i.levelKey) {
        const t = all.levels[i.levelKey];
        t.sets += i.quantity;
        t.cents += cents;
        if (i.withPitom) t.withPitom += i.quantity;
        else t.withoutPitom += i.quantity;
        region.sets += i.quantity;
      } else if (i.kind === "ADDON" && i.addOnId) {
        const cur = all.addOns[i.addOnId] ?? { qty: 0, cents: 0 };
        cur.qty += i.quantity;
        cur.cents += cents;
        all.addOns[i.addOnId] = cur;
      }
    }
    byState.set(st, region);
  }

  return json({
    configured: true,
    generatedAt: new Date().toISOString(),
    all,
    states: [...byState.entries()]
      .map(([state, v]) => ({ state, ...v }))
      .sort((a, b) => b.sets - a.sets),
  });
}
