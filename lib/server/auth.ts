/**
 * Two small pieces of server-side trust, both HMAC-SHA256 over AUTH_SECRET.
 *
 * 1. Staff sessions. Staff screens show customer names and phone numbers, so they are behind
 *    a PIN (STAFF_PIN). The cookie is httpOnly, signed, and carries only an expiry.
 *
 * 2. Checkout tickets. The spec asks for a grace period: "a cart that reached the payment step
 *    before the deadline may complete within the grace window". A ticket is issued when the
 *    customer reaches the payment step; the server trusts its issued-at, not the browser clock,
 *    so the grace window cannot be forged by changing a phone's time.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.AUTH_SECRET || process.env.BLOB_READ_WRITE_TOKEN || "dev-only-secret";

export const STAFF_COOKIE = "vsam_staff";
/** When no PIN is configured the staff screens stay open, exactly as the prototype was. */
export const STAFF_PIN = process.env.STAFF_PIN || "";
export const STAFF_LOCKED = STAFF_PIN.length > 0;

/**
 * Per-rep scoping, the spec's permission matrix. SITE_PINS is
 * "baltimore:1234,lakewood:5678,...": each PIN signs a rep in for exactly one site. STAFF_PIN
 * stays the admin PIN and sees everything. A rep's scope is enforced SERVER-side on every
 * staff endpoint - hiding a tab is a courtesy, the query check is the control.
 */
export interface StaffScope {
  role: "admin" | "rep";
  site?: string;
}

function sitePins(): Map<string, string> {
  const out = new Map<string, string>();
  for (const part of (process.env.SITE_PINS || "").split(",")) {
    const i = part.indexOf(":");
    if (i > 0) out.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return out;
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** `payload.signature`, where payload is base64url JSON. */
export function mint(data: Record<string, unknown>, ttlMs: number): string {
  const body = { ...data, exp: Date.now() + ttlMs };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verify<T = Record<string, unknown>>(token: string | undefined | null): T | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T & { exp: number };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/** Which door this PIN opens: admin, one site, or none. */
export function resolvePin(pin: string): StaffScope | null {
  const clean = pin.trim();
  if (!STAFF_LOCKED) return { role: "admin" };
  if (safeEqual(clean, STAFF_PIN)) return { role: "admin" };
  for (const [site, sitePin] of sitePins()) {
    if (safeEqual(clean, sitePin)) return { role: "rep", site };
  }
  return null;
}

/** 12 hours: one distribution day, without asking a volunteer to re-enter the PIN all morning. */
export const STAFF_TTL_MS = 12 * 60 * 60 * 1000;
/** A checkout ticket is good for an hour of filling in a form. */
export const TICKET_TTL_MS = 60 * 60 * 1000;
