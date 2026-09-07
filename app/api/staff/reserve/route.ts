import { SITES, type LevelKey } from "@/lib/data";
import { bad, guardAdmin, guardStaff, json } from "@/lib/server/http";
import { getReserve, logAudit, setReserveShipped } from "@/lib/server/repo";
import { HAS_STORE } from "@/lib/server/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEYS: LevelKey[] = ["MEHUDAR_AA", "MEHUDAR_A", "CHINUCH"];

export async function GET() {
  const denied = await guardStaff();
  if (denied) return denied;
  if (!HAS_STORE) return json({ configured: false, reserve: {} });
  const reserve = Object.fromEntries(
    await Promise.all(SITES.map(async (s) => [s.slug, await getReserve(s.slug)] as const)),
  );
  return json({ configured: true, reserve });
}

/** Reserve stock is per site per level, as the spec models it. Setting it is the admin's move. */
export async function POST(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  if (!HAS_STORE) return bad("not configured", 503);

  let body: { siteSlug?: string; level?: string; shipped?: number; used?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return bad("bad request");
  }
  const site = SITES.find((s) => s.slug === body.siteSlug);
  const level = KEYS.find((k) => k === body.level);
  const shipped = Number(body.shipped);
  if (!site || !level || !Number.isFinite(shipped) || shipped < 0) return bad("bad reserve update");
  const used = body.used === undefined ? undefined : Number(body.used);
  if (used !== undefined && (!Number.isFinite(used) || used < 0)) return bad("bad reserve update");

  const reserve = await setReserveShipped(site.slug, level, shipped, used);
  await logAudit({ action: "RESERVE_SET", site: site.slug, level, shipped, used });
  return json({ reserve });
}
