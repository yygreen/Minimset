import { SITES, type LevelKey } from "@/lib/data";
import type { Order } from "@/lib/orders";
import { guardAdmin, json } from "@/lib/server/http";
import { getReserve, listAllRows } from "@/lib/server/repo";
import { HAS_STORE, readJson } from "@/lib/server/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEVEL_KEYS: LevelKey[] = ["MEHUDAR_AA", "MEHUDAR_A", "CHINUCH"];

/**
 * The sheet pulled the moment the deadline passes: sets per level, with and without pitom,
 * add-ons, revenue, per site and in total. Item detail lives on the orders, so this reads
 * them all - a few hundred, twelve at a time, on an admin screen only.
 */
export async function GET() {
  // HQ revenue across every community is the admin's sheet, not a rep's.
  const denied = await guardAdmin();
  if (denied) return denied;
  if (!HAS_STORE) return json({ configured: false, sites: [], reserve: {} });

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
    paper: 0,
    revenueCents: 0,
  });

  const perSite = new Map<string, ReturnType<typeof blank>>();
  const all = blank();

  for (const o of orders) {
    const s = perSite.get(o.siteSlug) ?? blank();
    s.orders += 1;
    all.orders += 1;
    if (o.channel === "PAPER") {
      s.paper += 1;
      all.paper += 1;
    }
    s.revenueCents += o.totalCents;
    all.revenueCents += o.totalCents;
    for (const i of o.items) {
      const cents = i.unitPriceCents * i.quantity;
      if (i.kind === "LEVEL" && i.levelKey) {
        for (const t of [s.levels[i.levelKey], all.levels[i.levelKey]]) {
          t.sets += i.quantity;
          t.cents += cents;
          if (i.withPitom) t.withPitom += i.quantity;
          else t.withoutPitom += i.quantity;
        }
      } else if (i.kind === "ADDON" && i.addOnId) {
        for (const t of [s.addOns, all.addOns]) {
          const cur = t[i.addOnId] ?? { qty: 0, cents: 0 };
          cur.qty += i.quantity;
          cur.cents += cents;
          t[i.addOnId] = cur;
        }
      }
    }
    perSite.set(o.siteSlug, s);
  }

  const reserve = Object.fromEntries(
    await Promise.all(SITES.map(async (s) => [s.slug, await getReserve(s.slug)] as const)),
  );

  return json({
    configured: true,
    generatedAt: new Date().toISOString(),
    all,
    sites: SITES.map((s) => ({ slug: s.slug, name: s.name, ...(perSite.get(s.slug) ?? blank()) })),
    reserve,
  });
}
