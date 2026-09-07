/**
 * Backend battery. Runs against the live site, writes real orders, and purges every one of
 * them before it exits. Wired into qa/gate.mjs, so no deploy passes without it.
 *
 *   BASE=https://4minimset.com node qa/api.mjs
 *
 * Needs the staff PIN: QA_STAFF_PIN, or STAFF_PIN in .env.local (vercel env pull).
 * Vercel's edge answers Node fetch bursts with 403 challenges, so every call retries.
 */
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const envLocal = (() => {
  try {
    return fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return "";
  }
})();
const PIN = process.env.QA_STAFF_PIN || envLocal.match(/^STAFF_PIN="?([^"\n\r]+)"?/m)?.[1] || "";
/** One rep PIN for scoping checks: the baltimore entry of SITE_PINS. */
const SITE_PINS = envLocal.match(/^SITE_PINS="?([^"\n\r]+)"?/m)?.[1] || "";
const REP_PIN = (SITE_PINS.split(",").find((p) => p.startsWith("baltimore:")) || "").split(":")[1] || "";

const UA = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  accept: "application/json",
};

let pass = 0;
let fail = 0;
const created = new Set();

const check = (name, cond, extra = "") => {
  if (cond) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`FAIL  ${name} ${extra}`);
  }
};

async function raw(path, opts = {}) {
  for (let i = 0; i < 6; i += 1) {
    const res = await fetch(BASE + path, { ...opts, headers: { ...UA, ...(opts.headers ?? {}) } });
    // Our own 403s ("admin only", "outside your site") are JSON and are REAL answers. Only the
    // edge's bot challenge - an HTML page - gets retried.
    if (res.status !== 403 || (res.headers.get("content-type") ?? "").includes("json")) return res;
    await new Promise((r) => setTimeout(r, 1200 + i * 600));
  }
  throw new Error(`edge kept answering 403 for ${path}`);
}

async function api(path, opts = {}) {
  const res = await raw(path, opts);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, headers: res.headers };
}

const post = (path, body, headers = {}) =>
  api(path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

const order = (lines, extra = {}) =>
  post("/api/orders", {
    siteSlug: "baltimore",
    customerName: "QA Automated Check",
    phone: "410-555-0000",
    shul: "QA",
    lines,
    ...extra,
  }).then((r) => {
    if (r.data?.code) created.add(r.data.code);
    return r;
  });

/* ---------------- status ---------------- */
const status = await api("/api/status");
check("status endpoint answers", status.status === 200 && status.data.store === true, JSON.stringify(status.data).slice(0, 120));

/* ---------------- ordering ---------------- */
const a = await order([{ kind: "LEVEL", levelKey: "MEHUDAR_AA", withPitom: true, quantity: 2 }]);
const code = a.data.code;
check("order created with a server code", a.status === 200 && /^[A-Z0-9]{7,8}$/.test(code ?? ""), JSON.stringify(a.data).slice(0, 120));

const read = await api(`/api/orders/${code}`);
check("order reads back", read.status === 200 && read.data.order?.code === code);
check("server prices it (2 x A-A with pitom = $220)", read.data.order?.totalCents === 22000, `got ${read.data.order?.totalCents}`);
check("order data is never cached", (read.headers.get("cache-control") ?? "").includes("no-store"));

const tampered = await order([{ kind: "LEVEL", levelKey: "MEHUDAR_AA", withPitom: true, quantity: 1, unitPriceCents: 1 }], {
  totalCents: 1,
  customerName: "QA Tamper Check",
});
const tamperedRead = tampered.data.code ? await api(`/api/orders/${tampered.data.code}`) : null;
check("prices sent by the browser are ignored", tamperedRead?.data.order?.totalCents === 11000, `got ${tamperedRead?.data.order?.totalCents}`);

check("empty cart rejected", (await order([])).status === 400);
check("unknown level rejected", (await order([{ kind: "LEVEL", levelKey: "GOLD", quantity: 1 }])).status === 400);
check("quantity 0 rejected", (await order([{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 0 }])).status === 400);
check("absurd quantity rejected", (await order([{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 9999 }])).status === 400);
check("add-ons alone rejected", (await order([{ kind: "ADDON", addOnId: "ring", quantity: 1 }])).status === 400);
check("missing name rejected", (await order([{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 1 }], { customerName: "" })).status === 400);
check("missing phone rejected", (await order([{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 1 }], { phone: "" })).status === 400);
check("unknown community rejected", (await order([{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 1 }], { siteSlug: "narnia" })).status === 400);
check("bad email rejected", (await order([{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 1 }], { email: "not-an-email" })).status === 400);

const edited = await api(`/api/orders/${code}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ lines: [{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 3 }] }),
});
check("self-service edit reprices (3 x Chinuch = $120)", edited.status === 200 && edited.data.order?.totalCents === 12000, `got ${edited.data.order?.totalCents}`);
check("unknown code is 404, never a leak", (await api("/api/orders/ZZZZZZZ")).status === 404);

const ticket = await post("/api/checkout/start", {});
check("checkout ticket issued for the grace window", ticket.status === 200 && typeof ticket.data.ticket === "string");

/* ---------------- the staff wall ---------------- */
check("staff orders need a session", (await api("/api/staff/orders")).status === 401);
check("staff totals need a session", (await api("/api/staff/totals")).status === 401);
check("staff reserve needs a session", (await api("/api/staff/reserve")).status === 401);
check("staff actions need a session", (await post(`/api/staff/orders/${code}`, { action: "unclaimed" })).status === 401);
check("wrong PIN refused", (await post("/api/staff/login", { pin: "0000" })).status === 401);

const login = await raw("/api/staff/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ pin: PIN }),
});
const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
check("right PIN signs in", login.status === 200 && cookie.includes("vsam_staff"), PIN ? "" : "no PIN available");
const AUTH = { cookie };

/* ---------------- staff reads ---------------- */
const list = await api("/api/staff/orders?full=1", { headers: AUTH });
check("staff order list loads", list.status === 200 && Array.isArray(list.data.orders));
check("the new order is in the book", (list.data.orders ?? []).some((o) => o.code === code));

/**
 * Regression, 2026-08-26: once a site index passed ~1 KB its responses were compressed and
 * `get` started returning a WEAK ETag, so every compare-and-swap failed and this endpoint
 * answered 500. Keep an index comfortably over 1 KB and the listing must still be fine.
 */
const bulk = [];
for (let i = 0; i < 4; i += 1) {
  bulk.push(await order([{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 1 }], { customerName: `QA Index Growth ${i}` }));
}
// 429 is a pass here: the rate limit doing its job is not a failure of the index.
check(
  "bulk orders either written or rate-limited",
  bulk.every((r) => (r.status === 200 && r.data.code) || r.status === 429),
  bulk.map((r) => r.status).join(","),
);
const afterBulk = await api("/api/staff/orders?full=1", { headers: AUTH });
const indexBytes = JSON.stringify((afterBulk.data.rows ?? []).filter((r) => r.siteSlug === "baltimore")).length;
check(
  "listing survives an index over 1 KB (weak-ETag regression)",
  afterBulk.status === 200 && indexBytes > 1024,
  `status ${afterBulk.status}, baltimore index ~${indexBytes} bytes`,
);

const totals = await api("/api/staff/totals", { headers: AUTH });
check("totals compute", totals.status === 200 && typeof totals.data.all?.revenueCents === "number", `status ${totals.status}`);

/* ---------------- paper channel ---------------- */
// Remember the reserve before the exchange test spends from it, so it can be put back.
const reserveBefore = (await api("/api/staff/reserve", { headers: AUTH })).data.reserve ?? {};
const paper = await post(
  "/api/staff/orders",
  {
    siteSlug: "lakewood",
    customerName: "QA Paper Check",
    phone: "7325550000",
    paymentMethod: "CHECK",
    enteredBy: "QA",
    lines: [{ kind: "LEVEL", levelKey: "MEHUDAR_A", quantity: 1 }],
  },
  AUTH,
);
const paperCode = paper.data.order?.code;
if (paperCode) created.add(paperCode);
check(
  "paper order saved as paid by check",
  paper.status === 200 && paper.data.order?.channel === "PAPER" && paper.data.order?.status === "PAID" && paper.data.order?.paymentMethod === "CHECK",
);

/* ---------------- distribution day ---------------- */
const paperItem = paper.data.order?.items?.[0];
const pick = await post(`/api/staff/orders/${paperCode}`, { action: "pickup", itemId: paperItem?.id, quantity: 1 }, AUTH);
check("handing over the last item marks it fulfilled", pick.status === 200 && pick.data.order?.status === "FULFILLED", pick.data.order?.status);
const undo = await post(`/api/staff/orders/${paperCode}`, { action: "undo" }, AUTH);
check("undo puts it back to paid", undo.status === 200 && undo.data.order?.status === "PAID", undo.data.order?.status);
const exchange = await post(`/api/staff/orders/${paperCode}`, { action: "exchange", itemId: paperItem?.id, note: "QA" }, AUTH);
check("exchange recorded and drawn from reserve", exchange.status === 200 && exchange.data.order?.exchanges?.length === 1 && exchange.data.reserve?.MEHUDAR_A?.used >= 1);
check("exhausted reserve is flagged, not blocked", exchange.data.reserveShort === true);
const unclaimed = await post(`/api/staff/orders/${paperCode}`, { action: "unclaimed" }, AUTH);
check("unclaimed can be marked", unclaimed.status === 200 && unclaimed.data.order?.status === "UNCLAIMED");

/* ---------------- cancellation ---------------- */
const cancelled = await api(`/api/orders/${tampered.data.code}`, { method: "DELETE" });
check("customer can cancel", cancelled.status === 200 && cancelled.data.order?.status === "CANCELLED_REFUNDED");
const editCancelled = await api(`/api/orders/${tampered.data.code}`, {
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ lines: [{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 1 }] }),
});
check("a cancelled order cannot be edited", editCancelled.status === 409);

/* ---------------- payments ---------------- */
check("stripe webhook refuses an unsigned call", [400, 503].includes((await api("/api/webhooks/stripe", { method: "POST", body: "{}" })).status));

/* ---------------- clean up ---------------- */
let purged = 0;
for (const c of created) {
  const res = await post(`/api/staff/orders/${c}`, { action: "purge" }, AUTH);
  if (res.status === 200) purged += 1;
}
check("every test order purged from the live book", purged === created.size, `${purged} of ${created.size}`);

// Sweep any QA row an earlier interrupted run left behind. Every test customer is named
// "QA ..."; nothing else is ever touched.
const leftovers = await api("/api/staff/orders", { headers: AUTH });
for (const row of (leftovers.data.rows ?? []).filter((r) => /^QA /.test(r.customerName))) {
  await post(`/api/staff/orders/${row.code}`, { action: "purge" }, AUTH);
}
const finalRows = await api("/api/staff/orders", { headers: AUTH });
const stragglers = (finalRows.data.rows ?? []).filter((r) => /^QA /.test(r.customerName));
check("no QA rows left in the order book", stragglers.length === 0, stragglers.map((r) => r.code).join(", "));

// Put back exactly what the exchange test spent, so a gate run leaves the reserve as it found it.
for (const [siteSlug, levels] of Object.entries(reserveBefore)) {
  for (const [level, before] of Object.entries(levels)) {
    await post("/api/staff/reserve", { siteSlug, level, shipped: before.shipped, used: before.used }, AUTH);
  }
}
const reserveAfter = (await api("/api/staff/reserve", { headers: AUTH })).data.reserve ?? {};
check(
  "reserve restored to what the run found",
  JSON.stringify(reserveAfter) === JSON.stringify(reserveBefore),
  "reserve drifted",
);

/* ---------------- per-rep scoping ---------------- */
// The baltimore rep PIN must see baltimore only, never touch lakewood, and never reach the
// admin surfaces. This is the spec's permission matrix, asserted against the live site.
if (REP_PIN) {
  const repLogin = await raw("/api/staff/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pin: REP_PIN }),
  });
  const repCookie = (repLogin.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  check("rep PIN signs in as a rep", repLogin.status === 200);
  const REP = { cookie: repCookie };

  // A lakewood order to probe with (admin creates it, purges it after).
  const other = await post(
    "/api/staff/orders",
    { siteSlug: "lakewood", customerName: "QA Scope Probe", phone: "7325550001", paymentMethod: "CASH", lines: [{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 1 }] },
    AUTH,
  );
  const otherCode = other.data.order?.code;
  if (otherCode) created.add(otherCode);

  const repRows = await api("/api/staff/orders", { headers: REP });
  check(
    "rep sees only his own site",
    repRows.status === 200 && (repRows.data.rows ?? []).every((r) => r.siteSlug === "baltimore"),
    (repRows.data.rows ?? []).map((r) => r.siteSlug).join(","),
  );
  check("rep cannot read another site's order", (await api(`/api/staff/orders/${otherCode}`, { headers: REP })).status === 404);
  check(
    "rep cannot act on another site's order",
    (await post(`/api/staff/orders/${otherCode}`, { action: "unclaimed" }, REP)).status === 404,
  );
  check(
    "rep cannot key a paper order for another site",
    (await post("/api/staff/orders", { siteSlug: "lakewood", customerName: "QA Scope Paper", phone: "7325550002", lines: [{ kind: "LEVEL", levelKey: "CHINUCH", quantity: 1 }] }, REP)).status === 403,
  );
  check("rep cannot open HQ totals", (await api("/api/staff/totals", { headers: REP })).status === 403);
  check("rep cannot set reserve stock", (await post("/api/staff/reserve", { siteSlug: "baltimore", level: "CHINUCH", shipped: 5 }, REP)).status === 403);
  { const rp = await post(`/api/staff/orders/${code}`, { action: "purge" }, REP); check("rep cannot purge", rp.status === 403, `status ${rp.status} ${JSON.stringify(rp.data).slice(0,60)}`); }
  check("rep cannot seed sample data", (await api("/api/staff/demo", { method: "POST", headers: REP })).status === 403);
} else {
  check("rep scoping checks ran", false, "no SITE_PINS in .env.local - pull envs first");
}

/* ---------------- customer data is not readable without the token ---------------- */
// The order store is a PRIVATE blob store: a request to a blob URL with no token must be
// refused. This is the check that matters - names and phone numbers live in there.
const storeProbe = await fetch(
  "https://nyzrw8h8xjizxfa0.private.blob.vercel-storage.com/index/baltimore.json",
).catch(() => null);
check("order store is not readable from the open web", !storeProbe || [401, 403, 404].includes(storeProbe.status), `status ${storeProbe?.status}`);

// The rate limiter is deliberately NOT asserted: it is per function instance (see
// lib/server/http.ts), so it blunts one client hammering an endpoint but a spread of
// requests across instances is expected to get through. Asserting otherwise asserts a
// fiction. Payment is the real gate against junk orders once Stripe is connected.

console.log(`\n${pass} passed, ${fail} failed`);
console.log(fail === 0 ? "ALL API CHECKS PASSED" : `${fail} API CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
