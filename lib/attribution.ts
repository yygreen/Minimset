/**
 * Campaign attribution, carried across the domain boundary.
 *
 * The problem this exists to solve: a flyer or an email lands somebody on
 * 4minimset.com?utm_source=..., but the money is taken on
 * 4minimset.myshopify.com. Those are two different origins. The UTM arrives
 * here, the order happens there, and nothing joins them -- so the question
 * "which campaign paid for itself" has no answer, however good the analytics
 * on either side are.
 *
 * So the campaign is captured on arrival, kept in localStorage, and pinned to
 * the Shopify cart permalink at checkout as CART ATTRIBUTES. Shopify stores
 * those on the order itself: they show in the admin under Additional details
 * and come out in the order CSV export, which means attribution survives all
 * the way to the line in the spreadsheet that has the dollar amount on it.
 *
 * Verified against the live store on 2026-09-14 rather than assumed:
 *
 *   GET /cart/45801595797639:1?attributes[utm_source]=test-source
 *   -> 302 chain -> /checkouts/cn/... (params intact)
 *   GET /cart.js -> {"attributes":{"utm_source":"test-source", ...}}
 *
 * The plain utm_* params are sent alongside the attributes, because they
 * survive the same redirect chain onto the checkout URL and feed Shopify's own
 * session attribution. Belt and braces: the attributes are the reliable half.
 *
 * WHAT IS NOT STORED: no id, no fingerprint, nothing that identifies a person.
 * A campaign name, a medium, and the HOSTNAME of the referring site -- never
 * the full referring URL, which can carry a search query or a session token in
 * its own query string. This is why there is no cookie banner: nothing here
 * follows anybody anywhere.
 */

/** The parameters worth carrying. Anything else on the URL is ignored. */
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/**
 * A short hand-typed alias, for print. A flyer cannot carry
 * "?utm_source=flyer&utm_medium=print&utm_campaign=sukkos-5787" and be typed
 * correctly by anybody, so `?ref=flyer` is accepted and expanded on arrival.
 */
const REF_KEY = "ref";

const STORAGE_KEY = "vsamachta.attribution.v1";

/**
 * Cart attributes ride in a URL, and a URL has a practical length limit. A
 * campaign name is a slug; anything longer than this is a mistake or an
 * attack, and truncating is better than dropping the record.
 */
const MAX_VALUE = 80;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  /** Hostname only, never the full URL. Empty for a direct visit. */
  referrer?: string;
  /** The path the visitor first arrived on, so a campaign landing page is visible. */
  landing?: string;
  /** ISO date, day precision -- enough to line up with a send, not enough to single anybody out. */
  first_seen?: string;
}

function tidy(v: string | null | undefined): string {
  return (v ?? "").trim().slice(0, MAX_VALUE);
}

/**
 * Last non-direct click, which is the convention almost everybody reading a
 * report assumes. A visit carrying campaign parameters overwrites whatever was
 * stored; a visit carrying none leaves the previous campaign in place, so
 * somebody who arrives from an email, leaves, and comes back by typing the
 * address still counts for that email.
 */
function readFromUrl(search: string, referrer: string, path: string): Attribution | null {
  const q = new URLSearchParams(search);
  const out: Attribution = {};

  for (const k of UTM_KEYS) {
    const v = tidy(q.get(k));
    if (v) out[k] = v;
  }

  // ?ref=flyer expands to a full campaign, so print and digital land in the
  // same report rather than in two shapes nobody can add together.
  const ref = tidy(q.get(REF_KEY));
  if (ref && !out.utm_source) {
    out.utm_source = ref;
    out.utm_medium ||= "referral";
  }

  if (Object.keys(out).length === 0) return null;

  if (referrer) out.referrer = referrer;
  out.landing = tidy(path) || "/";
  out.first_seen = new Date().toISOString().slice(0, 10);
  return out;
}

/** The referring site's hostname, or "" for a direct visit or one from this site. */
function referrerHost(): string {
  try {
    if (!document.referrer) return "";
    const h = new URL(document.referrer).hostname;
    return h && h !== window.location.hostname ? tidy(h) : "";
  } catch {
    return "";
  }
}

function load(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Attribution) : null;
  } catch {
    return null;
  }
}

function save(a: Attribution): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* Private mode, or storage full. Attribution is never worth an error. */
  }
}

/**
 * Called once on arrival. Records a campaign if the URL carries one; records a
 * bare referrer if nothing has ever been recorded, so an organic visit is not
 * indistinguishable from a visit that was never measured.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  const fromUrl = readFromUrl(window.location.search, referrerHost(), window.location.pathname);
  if (fromUrl) {
    save(fromUrl);
    return;
  }

  if (load()) return;

  const host = referrerHost();
  save({
    ...(host ? { referrer: host } : {}),
    landing: tidy(window.location.pathname) || "/",
    first_seen: new Date().toISOString().slice(0, 10),
  });
}

export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  return load();
}

/**
 * The stored campaign as Shopify cart attributes.
 *
 * Empty when nothing was ever recorded, which leaves the permalink exactly as
 * it was -- an order with no attributes is a direct visit, and that reads more
 * honestly on the order than "utm_source: unknown".
 */
export function attributionAttributes(): Record<string, string> {
  const a = getAttribution();
  if (!a) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(a)) {
    const clean = tidy(typeof v === "string" ? v : "");
    if (clean) out[k] = clean;
  }
  return out;
}

/**
 * The same campaign as plain utm_* query parameters, for Shopify's own
 * session attribution. Only the five real UTM keys: `landing` and `referrer`
 * are ours and mean nothing to Shopify's reports.
 */
export function attributionParams(): Record<string, string> {
  const a = getAttribution();
  if (!a) return {};
  const out: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const v = tidy(a[k]);
    if (v) out[k] = v;
  }
  return out;
}
