/**
 * Walk the buying flow on a phone viewport and screenshot every step.
 * BASE=https://4minimset.com OUT=./shots node qa/flow-shots.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3480";
const OUT = process.env.OUT ?? "./flow-shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const W = Number(process.env.W || 390), H = Number(process.env.H || 844);
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: W > 600 ? 1 : 2 });
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
const full = (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });

await page.goto(`${BASE}/sets/mehudar-aa`, { waitUntil: "networkidle" });
await full("01-product");
await page.goto(`${BASE}/baltimore/order?level=MEHUDAR_AA`, { waitUntil: "networkidle" });
await shot("02-sets-top");
await full("02-sets-full");
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(300);
await full("03-details");
await page.getByLabel(/Full name/).fill("Yisroel Testman");
await page.getByLabel(/Phone/).fill("(410) 555-0199");
await page.getByRole("button", { name: "Review my order" }).click();
await page.waitForTimeout(300);
await full("04-review");
await page.getByRole("button", { name: /Continue to payment/ }).click();
await page.waitForTimeout(300);
await full("05-payment");
await page.getByRole("button", { name: "Fill a demo card" }).click();
await page.getByRole("button", { name: /^Pay \$/ }).click();
await page.waitForURL(/\/order\/[A-Z0-9]+/, { timeout: 15000 });
await page.waitForTimeout(800);
await full("06-confirmation");
console.log("confirmation url:", page.url());
await browser.close();
console.log("ok");
