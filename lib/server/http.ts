/** Small helpers every route shares: JSON replies, the staff guard, and a crude rate limit. */
import { cookies } from "next/headers";
import { STAFF_COOKIE, STAFF_LOCKED, verify, type StaffScope } from "./auth";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Order data must never sit in a shared cache.
      "cache-control": "no-store, private",
    },
  });
}

export const ok = (data: unknown = { ok: true }) => json(data);
export const bad = (message: string, status = 400) => json({ error: message }, status);

/** The caller's scope, or null when they are not signed in. */
export async function staffScope(): Promise<StaffScope | null> {
  if (!STAFF_LOCKED) return { role: "admin" };
  const jar = await cookies();
  const data = verify<{ role?: string }>(jar.get(STAFF_COOKIE)?.value);
  if (!data) return null;
  return { role: "admin" };
}

export async function isStaff(): Promise<boolean> {
  return (await staffScope()) !== null;
}

/** Returns a response when the caller is not staff, otherwise null. */
export async function guardStaff(): Promise<Response | null> {
  return (await isStaff()) ? null : bad("not signed in", 401);
}

/** Admin only: totals, sample data, purges. */
export async function guardAdmin(): Promise<Response | null> {
  const scope = await staffScope();
  if (!scope) return bad("not signed in", 401);
  if (scope.role !== "admin") return bad("admin only", 403);
  return null;
}

/**
 * In-memory sliding window. It resets whenever the function instance recycles, which is
 * fine: it exists to blunt code-guessing and double-submits, not to be a security control.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length <= limit;
}

/** Is the window already spent? Does NOT record a hit; pair with recordHit. */
export function overLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  return (hits.get(key) ?? []).filter((t) => now - t < windowMs).length >= limit;
}

export function recordHit(key: string): void {
  const arr = hits.get(key) ?? [];
  arr.push(Date.now());
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Trim, collapse whitespace and cap length. Everything a customer types goes through this. */
export function clean(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
