import {
  ADDONS,
  CODE_ALPHABET,
  Channel,
  LevelKey,
  OrderStatus,
  SEASON,
  SITES,
  getAddOn,
  getLevel,
} from "./data";

export interface OrderItem {
  id: string;
  kind: "LEVEL" | "ADDON";
  levelKey?: LevelKey;
  addOnId?: string;
  withPitom: boolean;
  quantity: number;
  unitPriceCents: number;
  qtyPickedUp: number;
}

export interface ExchangeRecord {
  itemId: string;
  at: string;
  note: string;
}

export interface Order {
  code: string;
  siteSlug: string;
  status: OrderStatus;
  channel: Channel;
  customerName: string;
  phone: string;
  email: string;
  shul: string;
  items: OrderItem[];
  totalCents: number;
  paymentMethod: "CARD" | "CASH" | "CHECK";
  createdAt: string;
  notes: string;
  exchanges: ExchangeRecord[];
  /* ---- server-side fields (absent on the older browser-only records) ---- */
  /** Last server write, ISO. */
  updatedAt?: string;
  /** Stripe PaymentIntent id, or DEMO when no processor is connected yet. */
  paymentRef?: string;
  paidAt?: string;
  /** Seeded sample data, so it can be cleared without touching a real order. */
  isDemo?: boolean;
  /** Which staff member keyed a paper order. */
  enteredBy?: string;
  /** Set when an order was completed inside the post-deadline grace window. */
  grace?: boolean;
}

/* ---------- money & formatting ---------- */

export function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function orderTotal(items: OrderItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
}

export function itemLabel(item: OrderItem): string {
  if (item.kind === "ADDON") {
    return getAddOn(item.addOnId!)?.name ?? "Add-on";
  }
  const level = getLevel(item.levelKey!);
  if (level.key === "MEHUDAR_AA") {
    return `${level.name} ${item.withPitom ? "with pitom" : "without pitom"}`;
  }
  return level.name;
}

export function totalSets(order: Order): number {
  return order.items
    .filter((i) => i.kind === "LEVEL")
    .reduce((sum, i) => sum + i.quantity, 0);
}

export function pickedUpUnits(order: Order): number {
  return order.items.reduce((sum, i) => sum + i.qtyPickedUp, 0);
}

export function totalUnits(order: Order): number {
  return order.items.reduce((sum, i) => sum + i.quantity, 0);
}

/* ---------- codes ---------- */

export function makeCode(rand: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  }
  return out;
}

/* ---------- deadline ---------- */

export function deadlineDate(): Date {
  return new Date(SEASON.deadlineIso);
}

export function isPastDeadline(now: Date = new Date()): boolean {
  return now.getTime() > deadlineDate().getTime();
}

export function msUntilDeadline(now: Date = new Date()): number {
  return deadlineDate().getTime() - now.getTime();
}

/* ---------- deterministic demo seed ---------- */

function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Shimon", "Yaakov", "Moshe", "Dovid", "Avrohom", "Yisroel", "Chaim",
  "Menachem", "Naftoli", "Shloime", "Eliezer", "Yitzchok", "Mordechai",
  "Boruch", "Refoel", "Zvi", "Aryeh", "Simcha", "Yehuda", "Nosson",
  "Shmuel", "Meir", "Ephraim", "Levi", "Yosef", "Chananya",
];

const LAST_NAMES = [
  "Friedman", "Weiss", "Rosenberg", "Kaufman", "Schwartz", "Neuman",
  "Feldman", "Roth", "Braun", "Gruber", "Katz", "Landau", "Stern",
  "Adler", "Herman", "Klein", "Fried", "Bloom", "Perlman", "Wolf",
  "Ackerman", "Guttman", "Berger", "Hirsch", "Weinstock", "Salomon",
];

const SHULS = [
  "Adas Yisrael", "Khal Chassidim", "Bais Medrash Hagadol",
  "Ohel Moshe", "Zichron Yaakov", "Khal Bnei Torah", "",
];

const AREA_CODES: Record<string, string> = {
  baltimore: "410",
  lakewood: "732",
  monsey: "845",
  "five-towns": "516",
};

function levelItem(
  rand: () => number,
  levelKey: LevelKey,
  quantity: number,
  withPitom: boolean,
): OrderItem {
  const level = getLevel(levelKey);
  const unit =
    level.basePriceCents +
    (withPitom && level.pitomSurchargeCents ? level.pitomSurchargeCents : 0);
  return {
    id: `it_${Math.floor(rand() * 1e9).toString(36)}`,
    kind: "LEVEL",
    levelKey,
    withPitom,
    quantity,
    unitPriceCents: unit,
    qtyPickedUp: 0,
  };
}

/**
 * 26 demo orders across all four sites: mixed levels, multi-set families,
 * paper/cash orders, one order already partially picked up, one with an
 * exchange on the record. Deterministic so the demo looks identical on
 * every machine.
 */
export function seedOrders(): Order[] {
  const rand = mulberry32(20260922);
  const orders: Order[] = [];
  const usedCodes = new Set<string>();

  const nextCode = () => {
    let code = makeCode(rand);
    while (usedCodes.has(code)) code = makeCode(rand);
    usedCodes.add(code);
    return code;
  };

  for (let i = 0; i < 26; i += 1) {
    const site = SITES[i % SITES.length];
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const roll = rand();

    const items: OrderItem[] = [];
    if (roll < 0.3) {
      items.push(levelItem(rand, "MEHUDAR_AA", 1, true));
      items.push(levelItem(rand, "CHINUCH", 1 + Math.floor(rand() * 3), false));
    } else if (roll < 0.5) {
      items.push(levelItem(rand, "MEHUDAR_AA", 1, rand() > 0.5));
    } else if (roll < 0.8) {
      items.push(levelItem(rand, "MEHUDAR_A", 1 + (rand() > 0.75 ? 1 : 0), false));
      if (rand() > 0.55) {
        items.push(levelItem(rand, "CHINUCH", 1 + Math.floor(rand() * 2), false));
      }
    } else {
      items.push(levelItem(rand, "CHINUCH", 1 + Math.floor(rand() * 3), false));
    }

    if (rand() > 0.78) {
      const addon = ADDONS[Math.floor(rand() * ADDONS.length)];
      items.push({
        id: `it_${Math.floor(rand() * 1e9).toString(36)}`,
        kind: "ADDON",
        addOnId: addon.id,
        withPitom: false,
        quantity: 1,
        unitPriceCents: addon.priceCents,
        qtyPickedUp: 0,
      });
    }

    const paper = rand() > 0.72;
    const shul = SHULS[Math.floor(rand() * SHULS.length)];
    const phoneTail = 100 + Math.floor(rand() * 899);

    orders.push({
      code: nextCode(),
      siteSlug: site.slug,
      status: "PAID",
      channel: paper ? "PAPER" : "ONLINE",
      customerName: `${first} ${last}`,
      phone: `(${AREA_CODES[site.slug]}) 555-0${phoneTail}`,
      email: paper ? "" : `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      shul,
      items,
      totalCents: orderTotal(items),
      paymentMethod: paper ? (rand() > 0.5 ? "CASH" : "CHECK") : "CARD",
      createdAt: new Date(Date.UTC(2026, 7, 18 + Math.floor(rand() * 7), 12)).toISOString(),
      notes: "",
      exchanges: [],
    });
  }

  const partial = orders.find((o) => totalSets(o) >= 3);
  if (partial) {
    partial.status = "PARTIALLY_PICKED_UP";
    let remaining = 2;
    for (const item of partial.items) {
      if (item.kind !== "LEVEL" || remaining <= 0) continue;
      const take = Math.min(item.quantity, remaining);
      item.qtyPickedUp = take;
      remaining -= take;
    }
  }

  const done = orders.find((o) => o.status === "PAID" && totalSets(o) === 1);
  if (done) {
    done.status = "FULFILLED";
    done.items.forEach((i) => {
      i.qtyPickedUp = i.quantity;
    });
    done.exchanges.push({
      itemId: done.items[0].id,
      at: new Date(Date.UTC(2026, 8, 22, 15, 12)).toISOString(),
      note: "Motz ruled the esrog was not worth the price paid. Exchanged from reserve stock.",
    });
  }

  return orders;
}

/* ---------- packing totals (HQ view) ---------- */

export interface LevelTotals {
  levelKey: LevelKey;
  withPitom: number;
  withoutPitom: number;
  sets: number;
  revenueCents: number;
}

const LIVE_STATUSES: OrderStatus[] = [
  "PAID",
  "PARTIALLY_PICKED_UP",
  "FULFILLED",
  "UNCLAIMED",
];

export function isLive(order: Order): boolean {
  return LIVE_STATUSES.includes(order.status);
}

export function levelTotals(orders: Order[]): LevelTotals[] {
  const live = orders.filter(isLive);
  return (["MEHUDAR_AA", "MEHUDAR_A", "CHINUCH"] as LevelKey[]).map((key) => {
    let withPitom = 0;
    let withoutPitom = 0;
    let revenueCents = 0;
    for (const order of live) {
      for (const item of order.items) {
        if (item.kind !== "LEVEL" || item.levelKey !== key) continue;
        if (item.withPitom) withPitom += item.quantity;
        else withoutPitom += item.quantity;
        revenueCents += item.unitPriceCents * item.quantity;
      }
    }
    return {
      levelKey: key,
      withPitom,
      withoutPitom,
      sets: withPitom + withoutPitom,
      revenueCents,
    };
  });
}

export function grandRevenue(orders: Order[]): number {
  return orders.filter(isLive).reduce((sum, o) => sum + o.totalCents, 0);
}

export function addOnTotals(orders: Order[]): { id: string; name: string; qty: number }[] {
  const live = orders.filter(isLive);
  return ADDONS.map((a) => {
    let qty = 0;
    for (const order of live) {
      for (const item of order.items) {
        if (item.kind === "ADDON" && item.addOnId === a.id) qty += item.quantity;
      }
    }
    return { id: a.id, name: a.name, qty };
  });
}

export const SEASON_DEADLINE_ISO = SEASON.deadlineIso;
export type { Channel, LevelKey, OrderStatus };
