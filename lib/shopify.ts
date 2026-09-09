/**
 * Shopify, wired through cart permalinks.
 *
 * The site stays the shop window: every "Order this set" button hands the
 * visitor to Shopify with the right variant already in the cart, and Shopify
 * owns cart, payment, tax, shipping rates, receipts, refunds and the order admin.
 * Nothing on this side touches a card.
 *
 * Everything here is inert until the store is configured. With no domain set,
 * `orderHref` returns the on-site order flow exactly as before, so a half-done
 * Shopify setup can never strand a customer on a broken link. Set the domain
 * and the variant ids in Vercel and the CTAs switch over on the next deploy.
 *
 * Variant ids are numeric and public -- they appear in the page source of any
 * Shopify storefront -- so NEXT_PUBLIC_ is correct here. There is no API key
 * and no secret in this file, by design.
 *
 * Each env var is read as a literal member access: Next.js only inlines
 * NEXT_PUBLIC_* into the browser bundle when it can see the full name at build
 * time, so this map cannot be built from a loop.
 */
import type { LevelKey } from "./data";

/**
 * The store's primary domain, confirmed in Shopify's Domains settings. The
 * custom domain 4minimset.com stays pointed at this site; only the checkout
 * lives on Shopify. An env var still overrides it, for a staging store.
 *
 * Setting this alone changes nothing: SHOPIFY_LIVE also needs a variant id, so
 * the CTAs keep using the on-site flow until the products exist.
 */
const DEFAULT_DOMAIN = "4minimset.myshopify.com";

export const SHOPIFY_DOMAIN = (process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || DEFAULT_DOMAIN)
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

/** Where a plain "Order Now" lands when no single set has been chosen. */
const CATALOG_PATH = (process.env.NEXT_PUBLIC_SHOPIFY_CATALOG_PATH ?? "/collections/all").trim();

/**
 * One numeric variant id per thing that can be bought. Mehudar A-A is sold as
 * two variants because the pitom carries a different price; the others have one
 * each.
 */
const VARIANT = {
  MEHUDAR_AA_PITOM: process.env.NEXT_PUBLIC_SHOPIFY_VARIANT_MEHUDAR_AA_PITOM || "45801595633799",
  MEHUDAR_AA_NO_PITOM: process.env.NEXT_PUBLIC_SHOPIFY_VARIANT_MEHUDAR_AA_NO_PITOM || "45801595666567",
  MEHUDAR_A: process.env.NEXT_PUBLIC_SHOPIFY_VARIANT_MEHUDAR_A || "45801595732103",
  CHINUCH: process.env.NEXT_PUBLIC_SHOPIFY_VARIANT_CHINUCH || "45801595797639",
} as const;

function clean(id: string | undefined): string | null {
  const v = (id ?? "").trim();
  return /^\d{6,}$/.test(v) ? v : null;
}

/** The default variant for a level: with a pitom for A-A, since that is the set most people mean. */
function variantFor(level: LevelKey | undefined): string | null {
  if (level === "MEHUDAR_AA") return clean(VARIANT.MEHUDAR_AA_PITOM) ?? clean(VARIANT.MEHUDAR_AA_NO_PITOM);
  if (level === "MEHUDAR_A") return clean(VARIANT.MEHUDAR_A);
  if (level === "CHINUCH") return clean(VARIANT.CHINUCH);
  return null;
}

/**
 * The go-live switch, deliberately separate from the ids.
 *
 * Knowing a variant id is not the same as the store being ready to take money.
 * While the store was half-built this defaulted OFF and had to be opted into,
 * because a live CTA pointing at a checkout that cannot quote shipping is worse
 * than no CTA at all.
 *
 * As of 2026-09-09 the store is ready, verified against it directly rather than
 * from the admin UI: Shopify Payments accepting and paying out, all three
 * products Active and published, all four variants returning a real checkout,
 * a $7.99 flat rate quoting in all fifty states, and the policies replaced.
 * So the default flips: live unless explicitly switched off.
 *
 * NEXT_PUBLIC_SHOPIFY_LIVE=0 in Vercel is now the kill switch. It is read at
 * build time like any NEXT_PUBLIC_ value, so setting it needs a redeploy --
 * which is the same minute either way, and the reason the escape hatch is a
 * variable rather than a code change.
 */
const ENABLED = process.env.NEXT_PUBLIC_SHOPIFY_LIVE !== "0";

/** True once the store is switched on AND can take an order for at least one set. */
export const SHOPIFY_LIVE =
  ENABLED &&
  SHOPIFY_DOMAIN.length > 0 &&
  Boolean(
    clean(VARIANT.MEHUDAR_AA_PITOM) ??
      clean(VARIANT.MEHUDAR_AA_NO_PITOM) ??
      clean(VARIANT.MEHUDAR_A) ??
      clean(VARIANT.CHINUCH),
  );

export interface CartLine {
  variantId: string;
  qty: number;
}

/**
 * A Shopify cart permalink: /cart/<variant>:<qty>,<variant>:<qty>
 * Anything in `attributes` rides along as a cart attribute and shows on the
 * order in the Shopify admin -- useful for noting which page or campaign a
 * buyer came in from.
 */
export function cartUrl(lines: CartLine[], attributes?: Record<string, string>): string | null {
  if (!SHOPIFY_DOMAIN) return null;
  const parts = lines.filter((l) => l.variantId && l.qty > 0).map((l) => `${l.variantId}:${l.qty}`);
  if (parts.length === 0) return null;

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(attributes ?? {})) {
    if (v) qs.set(`attributes[${k}]`, v);
  }
  const query = qs.toString();
  return `https://${SHOPIFY_DOMAIN}/cart/${parts.join(",")}${query ? `?${query}` : ""}`;
}

/**
 * Where an order CTA should point.
 *
 * With Shopify configured: straight into a Shopify cart holding that set (or
 * the catalog, when the CTA is not tied to one set). Without it: the on-site
 * order flow, unchanged.
 */
export function orderHref(level?: LevelKey): string {
  if (!SHOPIFY_LIVE) return level ? `/order/new?level=${level}` : "/order/new";
  const variant = variantFor(level);
  if (variant) return cartUrl([{ variantId: variant, qty: 1 }]) ?? `https://${SHOPIFY_DOMAIN}${CATALOG_PATH}`;
  return `https://${SHOPIFY_DOMAIN}${CATALOG_PATH}`;
}

/** The storefront's own catalog page. Where a retired on-site route now sends people. */
export function catalogUrl(): string {
  return `https://${SHOPIFY_DOMAIN}${CATALOG_PATH}`;
}

/**
 * Where "My Order" belongs once Shopify owns the orders.
 *
 * This site's own lookup answers by order CODE and reads its own store, so a
 * Shopify order number returns "not found" -- verified against the live site:
 * a pre-switch code resolves, 1001 and #1001 both 404. Pointing a customer at
 * it would tell them their order does not exist.
 *
 * Shopify redirects /account to its hosted customer accounts. The store runs
 * NEW customer accounts (legacyCustomerAccounts: false), so somebody who
 * checked out as a guest can still sign in with the email they used and see
 * the order. No password, no account made at checkout.
 */
export function accountUrl(): string {
  return `https://${SHOPIFY_DOMAIN}/account`;
}

/** An href that leaves the site, so it needs a plain anchor rather than next/link. */
export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
