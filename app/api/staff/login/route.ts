import { cookies } from "next/headers";
import { STAFF_COOKIE, STAFF_LOCKED, STAFF_TTL_MS, mint, resolvePin } from "@/lib/server/auth";
import { bad, clientIp, ok, overLimit, recordHit } from "@/lib/server/http";
import { logAudit } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Only FAILED attempts spend the budget: guessing a PIN is blunted, but a table of
  // volunteers signing in (correctly) all morning never locks itself out.
  const limitKey = `pin:${clientIp(req)}`;
  if (overLimit(limitKey, 8, 10 * 60_000)) return bad("too many attempts", 429);

  let pin = "";
  try {
    pin = String(((await req.json()) as { pin?: string }).pin ?? "");
  } catch {
    return bad("bad request");
  }

  const scope = resolvePin(pin);
  if (!scope) {
    recordHit(limitKey);
    await logAudit({ action: "STAFF_LOGIN_FAILED", ip: clientIp(req) }).catch(() => {});
    return bad("wrong PIN", 401);
  }

  const jar = await cookies();
  jar.set(STAFF_COOKIE, mint({ role: scope.role, site: scope.site }, STAFF_TTL_MS), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_TTL_MS / 1000,
  });
  await logAudit({ action: "STAFF_LOGIN", role: scope.role, site: scope.site ?? "all" }).catch(() => {});
  return ok({ signedIn: true, locked: STAFF_LOCKED, role: scope.role, site: scope.site ?? null });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(STAFF_COOKIE);
  return ok({ signedIn: false });
}
