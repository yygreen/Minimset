/**
 * V'samachta Arba Minim — catalog, shipping and season.
 * Halachic product copy in LEVELS is verbatim from the operator's spec (§3).
 * Do not paraphrase it.
 */

export type LevelKey = "MEHUDAR_AA" | "MEHUDAR_A" | "CHINUCH";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED_REFUNDED";

export interface Level {
  key: LevelKey;
  /** URL slug for the product page: /sets/[slug] */
  slug: string;
  name: string;
  tier: string;
  headline: string;
  basePriceCents: number;
  /** Only Mehudar A-A offers a pitom choice at checkout. */
  pitomSurchargeCents: number | null;
  spec: { esrog: string; lulav: string; hadassim: string };
}

export interface AddOn {
  id: string;
  name: string;
  note: string;
  priceCents: number;
}

export const SEASON = {
  name: "Sukkos 5787",
  year: 2026,
  /** Motzaei Shabbos, September 12, 2026 — 8:30 PM EDT / 3:30 AM IST.
      Every deadline on the site derives from this one value: the countdown, the
      server-side cutoff in lib/server/pricing.ts, the open/closed state of the
      order flow, and the labels below. Change it here and nowhere else. */
  deadlineIso: "2026-09-13T00:30:00.000Z",
  deadlineLabelEt: "Motzaei Shabbos, September 12, 8:30 PM EDT",
  deadlineLabelIl: "3:30 AM IST, Sunday September 13",
  /** What the customer is promised about arrival, in one sentence, everywhere. */
  deliveryNote: "Every set ships in time to arrive before Yom Tov.",
} as const;

/**
 * Shipping.
 *
 * Shopify's rate is the one that charges the customer; this constant only decides
 * what the site SAYS and what the fallback order flow totals. Keep the two equal.
 *
 * flatRateCents may be null, and null is not a placeholder price -- it is a
 * different sentence: the page says shipping is added at checkout and names no
 * figure, rather than printing a number nobody has agreed to. With a figure set,
 * every "+ $X shipping" on the site fills itself in.
 *
 * $7.99 matches the "Standard" rate in Shopify, verified against the live store
 * on 2026-09-09: one flat charge per ORDER (a five-item cart quotes the same
 * $7.99 as a single set), quoted in all fifty states including Alaska and
 * Hawaii. If the Shopify rate changes, change it here in the same minute --
 * a site that names one figure while checkout charges another is worse than a
 * site that names none.
 */
export const SHIPPING = {
  flatRateCents: 799,
  carrierNote: "Tracked shipping to anywhere in the United States, 3 to 5 business days.",
} as const;

/**
 * Two renderings of the same fact, because a sentence that already says "flat
 * rate" should not have "flat-rate shipping" dropped into the middle of it.
 *
 * shippingLabel() stands on its own. shippingAmount() is the bare figure for a
 * sentence that has already set the context, and is null while no rate is set.
 */
export function shippingLabel(): string {
  return SHIPPING.flatRateCents === null
    ? "Flat-rate shipping added at checkout"
    : `${moneyCents(SHIPPING.flatRateCents)} flat-rate shipping`;
}

export function shippingAmount(): string | null {
  return SHIPPING.flatRateCents === null ? null : moneyCents(SHIPPING.flatRateCents);
}

/** Local money formatter so this module stays free of order-layer imports. */
function moneyCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export const LEVELS: Level[] = [
  {
    key: "MEHUDAR_AA",
    slug: "mehudar-aa",
    name: "Mehudar A-A",
    tier: "Highest Level",
    headline: "The finest set in the program: shape, cleanliness and shilush at their best.",
    basePriceCents: 10000,
    pitomSurchargeCents: 1000,
    spec: {
      esrog:
        "Clean of black dots (even those not easily visible, which are technically permitted according to all Poskim). The upper third is clean of bletlech (scabs) unless they are very small; the lower section may occasionally have bletlech, but not overly large ones. Emphasis is placed on a beautiful shape (gidul na'eh).",
      lulav:
        "Closed to the top, with the two upper leaves at the same height and a beautiful tiyumes.",
      hadassim:
        "High-level shilush (beyond what is typically provided in standard Mehudar A-A hadassim).",
    },
  },
  {
    key: "MEHUDAR_A",
    slug: "mehudar-a",
    name: "Mehudar A",
    tier: "Intermediate Level",
    headline: "A full mehudar set, the level most balabatim take for themselves.",
    basePriceCents: 6500,
    pitomSurchargeCents: null,
    spec: {
      esrog:
        "Clean of black dots (as above). The upper section may occasionally have bletlech, but they are not too large or prominent; the lower section may have small ones. Effort is also made to ensure a gidul na'eh.",
      lulav: "Closed to the end, though there may be height differences between the leaves.",
      hadassim:
        "The entire hadas is meshulash as is customary for A-A hadassim. Within this category there are many levels of hechsherim; we strive to bring the highest quality available.",
    },
  },
  {
    key: "CHINUCH",
    slug: "chinuch",
    name: "Kosher L'Bracha (Chinuch)",
    tier: "For the children",
    headline: "A kosher, dignified set for a child, so every boy holds his own minim.",
    basePriceCents: 4000,
    pitomSurchargeCents: null,
    spec: {
      esrog: "Clean of black dots as mentioned above, with more bletlech.",
      lulav: "An open lulav, though certainly mostly closed.",
      hadassim: "Mostly meshulash.",
    },
  },
];

/**
 * The price a customer meets first.
 *
 * Mehudar A-A is two variants, and the one WITH a pitom is the default in the
 * store -- so $110 is the headline and $100 is the alternative. The site and the
 * store have to agree here, or the first click contradicts the page.
 *
 * basePriceCents stays the untouched catalog value that pricing and the order
 * flow calculate from; only the display convention lives in these two.
 */
export function headlinePriceCents(level: Level): number {
  return level.basePriceCents + (level.pitomSurchargeCents ?? 0);
}

/** The other side of a pitom choice, or null for a level that has none. */
export function altPriceCents(level: Level): number | null {
  return level.pitomSurchargeCents ? level.basePriceCents : null;
}

export const ADDONS: AddOn[] = [
  {
    id: "extra-hadassim",
    name: "Extra hadassim",
    note: "An additional bundle of three hadassim, same sorting standard.",
    priceCents: 1200,
  },
  {
    id: "extra-aravos",
    name: "Extra aravos",
    note: "A fresh replacement bundle for Chol HaMoed.",
    priceCents: 600,
  },
  {
    id: "koishiklach",
    name: "Koishiklach (lulav rings)",
    note: "Set of woven lulav rings for binding.",
    priceCents: 500,
  },
];

export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const PARTNERSHIP_PARAGRAPH =
  "Your order and payment make you a full partner in the Arba Minim being acquired for this community. Every set is selected and inspected by Morei Hora'ah who are experts in hilchos Daled Minim, and arrives sealed — kasher v'yashar, one hundred percent.";

/**
 * What the program stands behind, stated as a fact rather than a remedy.
 *
 * Under pickup this was a real guarantee: a Moreh Hora'ah stood at the table
 * with reserve stock and swapped a set in front of you, three days before Yom
 * Tov. Shipping breaks the mechanism, not just the wording -- a replacement
 * posted after a complaint takes the same 3 to 5 days as the original, so on a
 * box that arrived close to Yom Tov it can arrive too late to be worth
 * anything. A promise that cannot be kept in the case that matters is worse
 * than none.
 *
 * So this says what is true and commits to nothing: the sorting standard, that
 * reserve stock travels, and an invitation to get in touch. Any actual remedy
 * is the operator's to offer case by case, not the site's to promise.
 */
export const STANDARD_NOTE =
  "Every item is inspected and approved by Morei Hora'ah in Eretz Yisrael before the box is sealed, and reserve stock travels with the shipment. If something is not right with what arrives, tell us as soon as it does.";

export function getLevel(key: LevelKey): Level {
  const level = LEVELS.find((l) => l.key === key);
  if (!level) throw new Error(`Unknown level: ${key}`);
  return level;
}

export function getLevelBySlug(slug: string): Level | undefined {
  return LEVELS.find((l) => l.slug === slug);
}

export function getAddOn(id: string): AddOn | undefined {
  return ADDONS.find((a) => a.id === id);
}
