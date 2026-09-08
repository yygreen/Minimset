/**
 * V'samachta Arba Minim — catalog, sites and season.
 * Halachic product copy in LEVELS is verbatim from the operator's spec (§3).
 * Do not paraphrase it.
 */

export type LevelKey = "MEHUDAR_AA" | "MEHUDAR_A" | "CHINUCH";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PARTIALLY_PICKED_UP"
  | "FULFILLED"
  | "CANCELLED_REFUNDED"
  | "UNCLAIMED";

export type Channel = "ONLINE" | "PAPER";

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

export interface Site {
  slug: string;
  name: string;
  hostInstitution: string;
  addressLines: string[];
  city: string;
  state: string;
  zip: string;
  distributionDateIso: string;
  windowStart: string;
  windowEnd: string;
  repName: string;
  repPhone: string;
  status: "OPEN" | "CLOSED";
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
  distributionNote: "Distribution is the day after Yom Kippur at each host Beis Medrash.",
} as const;

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

export const SITES: Site[] = [
  {
    slug: "baltimore",
    name: "Baltimore",
    hostInstitution: "Adas Yisrael",
    addressLines: ["Beis Medrash Hall", "Park Heights"],
    city: "Baltimore",
    state: "MD",
    zip: "21215",
    distributionDateIso: "2026-09-22",
    windowStart: "10:00 AM",
    windowEnd: "5:00 PM",
    repName: "R' Shimon Friedman",
    repPhone: "(410) 555-0142",
    status: "OPEN",
  },
  {
    slug: "lakewood",
    name: "Lakewood",
    hostInstitution: "Forest Park Beis Medrash",
    addressLines: ["Main Beis Medrash", "Forest Avenue"],
    city: "Lakewood",
    state: "NJ",
    zip: "08701",
    distributionDateIso: "2026-09-22",
    windowStart: "10:00 AM",
    windowEnd: "5:00 PM",
    repName: "R' Yaakov Weiss",
    repPhone: "(732) 555-0118",
    status: "OPEN",
  },
  {
    slug: "monsey",
    name: "Monsey",
    hostInstitution: "Wesley Hills Beis Medrash",
    addressLines: ["Simcha Hall", "Route 306"],
    city: "Monsey",
    state: "NY",
    zip: "10952",
    distributionDateIso: "2026-09-22",
    windowStart: "10:00 AM",
    windowEnd: "5:00 PM",
    repName: "R' Menachem Roth",
    repPhone: "(845) 555-0167",
    status: "OPEN",
  },
  {
    slug: "five-towns",
    name: "Five Towns",
    hostInstitution: "Central Avenue Beis Medrash",
    addressLines: ["Lower Level Hall", "Central Avenue"],
    city: "Cedarhurst",
    state: "NY",
    zip: "11516",
    distributionDateIso: "2026-09-22",
    windowStart: "10:00 AM",
    windowEnd: "5:00 PM",
    repName: "R' Eliezer Katz",
    repPhone: "(516) 555-0193",
    status: "OPEN",
  },
];

export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const PARTNERSHIP_PARAGRAPH =
  "Your order and payment make you a full partner in the Arba Minim being acquired for this community. Every set is selected and inspected by Morei Hora'ah who are experts in hilchos Daled Minim, and arrives sealed — kasher v'yashar, one hundred percent.";

export const EXCHANGE_GUARANTEE =
  "A Moreh Hora'ah will be present at distribution. If he determines an item is not worth what you paid, it will be exchanged on the spot.";

export function getLevel(key: LevelKey): Level {
  const level = LEVELS.find((l) => l.key === key);
  if (!level) throw new Error(`Unknown level: ${key}`);
  return level;
}

export function getLevelBySlug(slug: string): Level | undefined {
  return LEVELS.find((l) => l.slug === slug);
}

export function getSite(slug: string): Site | undefined {
  return SITES.find((s) => s.slug === slug);
}

export function getAddOn(id: string): AddOn | undefined {
  return ADDONS.find((a) => a.id === id);
}
