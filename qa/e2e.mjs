import fs from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3477";
const log = (...a) => console.log(...a);

/**
 * The staff screens are behind a PIN, and the golden path writes a REAL order to the live
 * order book, so it must clean up after itself. Both need the PIN: env first, then the
 * .env.local that `vercel env pull` writes (gitignored).
 */
const STAFF_PIN =
  process.env.QA_STAFF_PIN ||
  (() => {
    try {
      return (
        fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/^STAFF_PIN="?([^"\n\r]+)"?/m)?.[1] ?? ""
      );
    } catch {
      return "";
    }
  })();

/** Sign in if the PIN wall is showing. Returns true when the screens are reachable. */
async function staffSignIn(p) {
  const pinField = p.locator('input[autocomplete="one-time-code"]');
  if ((await pinField.count()) === 0) return true;
  if (!STAFF_PIN) return false;
  await pinField.fill(STAFF_PIN);
  await p.getByRole("button", { name: "Sign in" }).click();
  await p.waitForTimeout(900);
  return (await pinField.count()) === 0;
}
let failures = 0;
const check = (name, cond, extra = "") => {
  if (cond) log(`PASS  ${name}`);
  else {
    failures += 1;
    log(`FAIL  ${name} ${extra}`);
  }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => {
  failures += 1;
  log("PAGEERROR", e.message);
});

// ---------- landing ----------
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
check("landing shows headline", (await page.locator("h1").first().innerText()).includes("chosen by a Rav"));
check("landing lists three levels", (await page.locator("h3", { hasText: "Mehudar A-A" }).count()) > 0);
check("countdown renders", (await page.locator("text=Orders close in").count()) > 0);

// ---------- order flow ----------
await page.goto(`${BASE}/baltimore/order`, { waitUntil: "networkidle" });

// 1 x Mehudar A-A with pitom
const aaCard = page.locator("article", { hasText: "Mehudar A-A" }).first();
await aaCard.getByRole("button", { name: /With pitom/ }).click();
await aaCard.getByRole("button", { name: "Add one Mehudar A-A" }).click();

// 2 x Chinuch
const chCard = page.locator("article", { hasText: "Kosher L" }).first();
await chCard.getByRole("button", { name: /Add one Kosher L/ }).click();
await chCard.getByRole("button", { name: /Add one Kosher L/ }).click();

const railTotal = await page.locator("aside").getByText(/^\$\d/).last().innerText();
check("running total is $190", railTotal.trim() === "$190", `got ${railTotal}`);

await page.getByRole("button", { name: /^Continue/ }).click();
await page.getByPlaceholder("Yaakov Friedman").fill("Yisroel Testman");
await page.getByPlaceholder("(410) 555-0142").fill("4105550199");
await page.getByPlaceholder("you@example.com").fill("test@example.com");
await page.getByRole("button", { name: "Review my order" }).click();

check("review shows total", (await page.locator("text=$190").count()) > 0);
await page.getByRole("button", { name: /Continue to payment/ }).click();
await page.getByRole("button", { name: "Fill a demo card" }).click();
await page.getByRole("button", { name: /Pay \$190/ }).click();

// Codes are allocated by the server now: 7 characters, 8 if the first draws collide.
await page.waitForURL(/\/order\/[A-Z0-9]{6,8}\?new=1/, { timeout: 15000 });
const code = page.url().match(/\/order\/([A-Z0-9]{6,8})/)[1];
log(`      order code = ${code}`);
check("confirmation shows partnership paragraph", (await page.locator("text=full partner in the Arba Minim").count()) > 0);
check("confirmation shows the code", (await page.locator(`text=${code}`).first().count()) > 0);
const qr = page.locator(`img[alt="QR code for order ${code}"]`);
await qr.waitFor({ timeout: 5000 });
check("QR code rendered", await qr.isVisible());
check("exchange guarantee present", (await page.locator("text=exchanged on the spot").count()) > 0);

// ---------- self-service edit ----------
await page.getByRole("button", { name: "Change" }).click();
await page.getByRole("button", { name: /Remove one Kosher L/ }).click();
check("edit shows refund line", (await page.locator("text=/\\$40 will be refunded/").count()) > 0);
await page.getByRole("button", { name: "Save changes" }).click();
await page.waitForTimeout(400);
check("total after refund is $150", (await page.locator("text=$150").count()) > 0);

// ---------- lookup by code ----------
await page.goto(`${BASE}/order`, { waitUntil: "networkidle" });
await page.locator('input[placeholder="e.g. K4TR9M"]').fill(code);
await page.getByRole("button", { name: "Find my order" }).click();
await page.waitForURL(new RegExp(`/order/${code}$`), { timeout: 8000 });
check("lookup by code resolves", page.url().endsWith(`/order/${code}`));

// ---------- distribution day ----------
await page.goto(`${BASE}/staff/distribution`, { waitUntil: "networkidle" });
check("staff PIN accepted", await staffSignIn(page), "set QA_STAFF_PIN or pull .env.local");
await page.waitForTimeout(600);
await page.locator('input[placeholder*="Scan QR"]').fill(code);
await page.waitForTimeout(300);
await page.locator("li button", { hasText: "Yisroel Testman" }).first().click();
check("entitlement screen shows name", (await page.locator("h2", { hasText: "Yisroel Testman" }).count()) > 0);
check("entitlement shows A-A with pitom", (await page.locator("text=1 x Mehudar A-A with pitom").count()) > 0);

// partial pickup: hand over just the A-A
await page.getByRole("button", { name: "Hand over 1" }).first().click();
await page.waitForTimeout(400);
check("status becomes partially picked up", (await page.locator("text=Partially picked up").count()) > 0);

// exchange from reserve
await page.getByRole("button", { name: "Exchange" }).first().click();
await page.getByRole("button", { name: "Confirm exchange" }).click();
await page.waitForTimeout(500);
check("exchange recorded", (await page.locator("text=Exchange history").count()) > 0);

// finish
await page.getByRole("button", { name: "Mark as Picked Up" }).click();
await page.waitForTimeout(400);
check("order fulfilled", (await page.locator("text=Already picked up").count()) > 0);

// ---------- totals ----------
await page.goto(`${BASE}/staff/totals`, { waitUntil: "networkidle" });
const setsTile = await page.locator("div", { hasText: /^Complete sets/ }).last().innerText();
log(`      totals tile: ${setsTile.replace(/\n/g, " | ")}`);
check("totals page renders sets", /\d/.test(setsTile));
check("packing counts render", (await page.locator("text=Hadassim bundles").count()) > 0);

// ---------- orders search ----------
await page.goto(`${BASE}/staff/orders`, { waitUntil: "networkidle" });
await page.locator('input[placeholder="Code, name or phone"]').fill("Testman");
await page.waitForTimeout(300);
check("order search finds the new order", (await page.locator("td", { hasText: "Yisroel Testman" }).count()) > 0);

// ---------- mobile pass ----------
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(`${BASE}/baltimore/order`, { waitUntil: "networkidle" });
const overflow = await mobile.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
check("no horizontal overflow on mobile order page", overflow <= 1, `overflow=${overflow}px`);
await mobile.goto(`${BASE}/`, { waitUntil: "networkidle" });
const overflow2 = await mobile.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
check("no horizontal overflow on mobile landing", overflow2 <= 1, `overflow=${overflow2}px`);

// ---------- clean up after ourselves ----------
// The golden path writes a real order to the live book. Leave it there and the operator's
// totals slowly fill with Yisroel Testman.
const purged = await page.evaluate(async (c) => {
  const r = await fetch(`/api/staff/orders/${c}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "purge" }),
  });
  return r.ok;
}, code);
check("test order purged from the live book", purged, `code ${code} still present`);

await browser.close();
log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
