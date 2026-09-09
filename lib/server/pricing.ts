/**
 * Prices are computed on the server, from lib/data.ts, every time. The browser sends
 * quantities only; anything it says about money is ignored. This is the difference between
 * a shop and a form.
 */
import { ADDONS, LEVELS, SEASON, getAddOn, getLevel, type LevelKey } from "@/lib/data";
import type { OrderItem } from "@/lib/orders";

export interface CartLine {
  kind: "LEVEL" | "ADDON";
  levelKey?: LevelKey;
  addOnId?: string;
  withPitom?: boolean;
  quantity: number;
}

export const MAX_QTY_PER_LINE = 20;

export class BadCart extends Error {}

/** Turn a client cart into priced items. Throws BadCart on anything that does not add up. */
export function priceCart(lines: unknown): { items: OrderItem[]; totalCents: number } {
  if (!Array.isArray(lines) || lines.length === 0) throw new BadCart("empty cart");
  if (lines.length > 24) throw new BadCart("too many lines");

  const items: OrderItem[] = [];
  let n = 0;

  for (const raw of lines as CartLine[]) {
    const quantity = Number(raw?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
      throw new BadCart("bad quantity");
    }

    if (raw.kind === "LEVEL") {
      const level = LEVELS.find((l) => l.key === raw.levelKey);
      if (!level) throw new BadCart("unknown level");
      const withPitom = Boolean(raw.withPitom) && level.pitomSurchargeCents !== null;
      const unitPriceCents = level.basePriceCents + (withPitom ? (level.pitomSurchargeCents ?? 0) : 0);
      items.push({
        id: `i${(n += 1)}`,
        kind: "LEVEL",
        levelKey: level.key,
        withPitom,
        quantity,
        unitPriceCents,
      });
    } else if (raw.kind === "ADDON") {
      const addOn = ADDONS.find((a) => a.id === raw.addOnId);
      if (!addOn) throw new BadCart("unknown add-on");
      items.push({
        id: `i${(n += 1)}`,
        kind: "ADDON",
        addOnId: addOn.id,
        withPitom: false,
        quantity,
        unitPriceCents: addOn.priceCents,
      });
    } else {
      throw new BadCart("bad line kind");
    }
  }

  // An order must contain at least one set; add-ons alone are not a set.
  if (!items.some((i) => i.kind === "LEVEL")) throw new BadCart("no sets in cart");

  const totalCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
  if (totalCents <= 0) throw new BadCart("zero total");
  return { items, totalCents };
}

/** Present so a repriced edit uses exactly the same code path as a new order. */
export function levelLabel(key: LevelKey): string {
  return getLevel(key).name;
}

export function addOnLabel(id: string): string {
  return getAddOn(id)?.name ?? id;
}

export const DEADLINE_MS = Date.parse(SEASON.deadlineIso);

/** Minutes after the deadline in which a ticket issued before it may still be completed. */
export const GRACE_MINUTES = Number(process.env.GRACE_MINUTES ?? 15);

export function graceEndsMs(): number {
  return DEADLINE_MS + GRACE_MINUTES * 60_000;
}
