/**
 * Deploy gate. Run against the live site after every production deploy:
 *   BASE=https://4minimset.com node qa/gate.mjs
 * Checks: every hostname resolves as intended, every public page is 200 and styled,
 * no page overflows a 390px phone, no forbidden characters or dark panels in the
 * served HTML, sitemap/robots/OG present, then the golden-path e2e.
 */
import { chromium, webkit } from "playwright";
import { spawnSync } from "node:child_process";

const BASE = process.env.BASE ?? "https://4minimset.com";
const UA = { "user-agent": "Mozilla/5.0 (4minimset gate) AppleWebKit/537.36 Chrome/128 Safari/537.36" };
const _fetch = globalThis.fetch;
// Vercel's edge occasionally answers a burst of non-browser requests with 403; retry before judging.
globalThis.fetch = async (url, init = {}) => {
  let r;
  for (let attempt = 0; attempt < 6; attempt++) {
    r = await _fetch(url, { ...init, headers: { ...UA, ...(init.headers || {}) } });
    if (r.status !== 403) return r;
    await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
  }
  return r;
};
let failures = 0;
const ok = (name, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " " + extra}`);
  if (!cond) failures += 1;
};

// ---------- hostnames ----------
if (BASE.includes("4minimset.com")) {
  const hosts = [
    ["https://4minimset.com/", 200],
    ["https://www.4minimset.com/", 308],
    ["https://fourminimset.com/", 308],
    ["https://www.fourminimset.com/", 308],
    ["https://vsamachta.com/", 308],
    ["https://www.vsamachta.com/", 308],
  ];
  for (const [url, want] of hosts) {
    const r = await fetch(url, { redirect: "manual" });
    const loc = r.headers.get("location") || "";
    ok(`host ${url} -> ${want}`, r.status === want && (want === 200 || loc.startsWith("https://4minimset.com")), `got ${r.status} ${loc}`);
  }
}

// ---------- pages ----------
const PAGES = ["/", "/he", "/sets/mehudar-aa", "/sets/mehudar-a", "/sets/chinuch", "/baltimore", "/lakewood", "/monsey", "/five-towns", "/baltimore/order", "/faq", "/about", "/order", "/staff/distribution", "/staff/totals", "/staff/orders"];
const BAD_CHARS = /[–—‘’“”·•→←×]/;
const HTML = {};
for (const p of PAGES) {
  const r = await fetch(BASE + p);
  const html = await r.text();
  HTML[p] = html;
  ok(`GET ${p} 200`, r.status === 200, `got ${r.status}`);
  ok(`${p} links a stylesheet`, /<link[^>]+\.css/.test(html));
  const cssHref = (html.match(/href="([^"]+\.css[^"]*)"/) || [])[1];
  if (cssHref) {
    const c = await fetch(cssHref.startsWith("http") ? cssHref : BASE + cssHref);
    ok(`${p} stylesheet loads`, c.status === 200, `css ${c.status}`);
  }
  ok(`${p} no placeholder text`, !/lorem ipsum|TODO|\[imageN\]|data:image\/png;base64,iVBOR/i.test(html));
  if (!p.startsWith("/staff") && !p.startsWith("/order") && p !== "/he") {
    // body copy is ASCII by house rule; Hebrew strings and the verbatim spec are exempt
    const body = html
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/[֐-׿]+/g, "")
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"')
      // the partnership paragraph is spec copy and carries its own dash
      .replace(/arrives sealed — kasher v'yashar/g, "arrives sealed - kasher v'yashar");
    const hit = body.match(BAD_CHARS);
    ok(`${p} no typographic exotica`, !hit, hit ? `found ${JSON.stringify(hit[0])} near ${JSON.stringify(body.slice(Math.max(0, hit.index - 40), hit.index + 40))}` : "");
  }
}

// ---------- flyer-typed capitalised paths land ----------
for (const [p, want] of [["/Baltimore", "/baltimore"], ["/HE", "/he"]]) {
  const r = await fetch(BASE + p, { redirect: "manual" });
  const loc = r.headers.get("location") || "";
  ok(`${p} redirects to ${want}`, r.status === 308 && loc.endsWith(want), `got ${r.status} ${loc}`);
}

// ---------- share cards resolve on the pages that get forwarded ----------
for (const p of ["/", "/he", "/sets/mehudar-aa", "/sets/chinuch", "/baltimore", "/five-towns"]) {
  const html = HTML[p] || "";
  const m = html.match(/property="og:image" content="([^"]+)"/);
  const url = m ? m[1] : "";
  let status = 0;
  if (url) status = (await fetch(url)).status;
  ok(`${p} og:image resolves`, /^https:\/\/4minimset\.com\//.test(url) && status === 200, `${url || "missing"} ${status}`);
}

// ---------- SEO files ----------
for (const [p, needle] of [["/sitemap.xml", "<urlset"], ["/robots.txt", "Sitemap:"], ["/og.jpg", null]]) {
  const r = await fetch(BASE + p);
  const t = needle ? await r.text() : "";
  ok(`${p} present`, r.status === 200 && (!needle || t.includes(needle)), `got ${r.status}`);
}
{
  const home = HTML["/"] || "";
  ok("home has og:image", /property="og:image"/.test(home));
  ok("home has hreflang he", /hreflang="he"/i.test(home));
  ok("home has JSON-LD", /application\/ld\+json/.test(home));
}

// ---------- rendered overflow at 390px ----------
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
for (const p of ["/", "/he", "/sets/mehudar-aa", "/baltimore", "/baltimore/order", "/faq", "/about", "/order"]) {
  await page.goto(BASE + p, { waitUntil: "networkidle" });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(`${p} no horizontal overflow at 390px`, ov === 0, `overflow ${ov}px`);
  const fontOk = await page.evaluate(() => getComputedStyle(document.body).fontFamily.length > 0 && getComputedStyle(document.body).backgroundColor !== "rgba(0, 0, 0, 0)");
  ok(`${p} styled body`, fontOk);
}
ok("no page errors", errors.length === 0, errors.join(" | "));
// no visible link or button under 24px tall on the pages buyers touch most
for (const p of ["/", "/he", "/sets/mehudar-aa", "/baltimore", "/faq", "/staff/distribution"]) {
  await page.goto(BASE + p, { waitUntil: "networkidle" });
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("a,button")]
      .filter((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        const b = el.getBoundingClientRect();
        if (!(b.width > 0 && b.height > 0 && (el.innerText || "").trim())) return false;
        // button-styled controls (rounded-lg) must be at least 40px; plain text links at least 24px
        const styled = /rounded-lg/.test(el.className) || (el.tagName === "BUTTON" && !/underline/.test(el.className));
        return b.height < (styled ? 40 : 24);
      })
      .map((el) => `${(el.innerText || "").trim().slice(0, 20)} ${Math.round(el.getBoundingClientRect().height)}px`),
  );
  ok(`${p} touch targets big enough (40px buttons, 24px links)`, small.length === 0, small.join(" | "));
}

// checkout primary buttons must be real touch targets on a phone (a flex-1 in a column once collapsed them to 27px)
{
  await page.goto(BASE + "/baltimore/order?level=MEHUDAR_AA", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Continue/ }).first().click();
  await page.waitForTimeout(300);
  const h1 = (await page.getByRole("button", { name: "Review my order" }).boundingBox())?.height || 0;
  await page.getByLabel(/Full name/).fill("Gate Tester");
  await page.getByLabel(/Phone/).fill("(410) 555-0100");
  await page.getByRole("button", { name: "Review my order" }).click();
  await page.waitForTimeout(300);
  const h2 = (await page.getByRole("button", { name: /Continue to payment/ }).boundingBox())?.height || 0;
  ok("checkout primary buttons are tall enough on a phone", h1 >= 44 && h2 >= 44, `review ${Math.round(h1)}px, payment ${Math.round(h2)}px`);
}

// after the deadline the front door must stop selling (browser clock fixed past the deadline)
{
  const cp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await cp.clock.setFixedTime(new Date("2026-09-07T12:00:00Z"));
  await cp.goto(BASE + "/", { waitUntil: "networkidle" });
  await cp.waitForTimeout(800);
  const closedNotice = await cp.getByText("has closed").count();
  const quickStart = await cp.evaluate(() => !!document.getElementById("start"));
  ok("post-deadline home shows the closed notice", closedNotice > 0);
  ok("post-deadline home hides the quick-start strip", !quickStart);
  await cp.close();
}

// share links must carry the absolute origin once mounted
for (const p of ["/", "/sets/mehudar-aa", "/baltimore"]) {
  await page.goto(BASE + p, { waitUntil: "networkidle" });
  const href = await page.locator('a[href^="https://wa.me/"]').first().getAttribute("href");
  const text = decodeURIComponent((href || "").replace("https://wa.me/?text=", ""));
  ok(`${p} share link carries the absolute URL`, text.includes(BASE + p), text.slice(-60));
}
await browser.close();

// ---------- 360px (small Android) overflow on the money pages ----------
{
  const sp = await chromium.launch();
  for (const w of [360, 320]) {
    const pg = await sp.newPage({ viewport: { width: w, height: 780 } });
    for (const p of ["/", "/he", "/sets/mehudar-aa", "/baltimore/order"]) {
      await pg.goto(BASE + p, { waitUntil: "networkidle" });
      const ov = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(`${w}px ${p} no horizontal overflow`, ov === 0, `overflow ${ov}px`);
    }
    await pg.close();
  }
  await sp.close();
}

// ---------- WebKit (Safari engine) phone check on the money pages ----------
try {
  const wk = await webkit.launch();
  const wp = await wk.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const p of ["/", "/he", "/sets/mehudar-aa", "/baltimore/order"]) {
    await wp.goto(BASE + p, { waitUntil: "networkidle" });
    const ov = await wp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(`webkit ${p} no horizontal overflow`, ov === 0, `overflow ${ov}px`);
  }
  await wk.close();
} catch (e) {
  ok("webkit available", false, String(e.message).slice(0, 120));
}

// ---------- backend battery ----------
const apiRun = spawnSync(process.execPath, ["qa/api.mjs"], { env: { ...process.env, BASE }, encoding: "utf8" });
ok(
  "api battery",
  /ALL API CHECKS PASSED/.test(apiRun.stdout),
  (apiRun.stdout.match(/FAIL.*/g) || []).join(" | ") || String(apiRun.stderr).slice(0, 200),
);

// ---------- golden path ----------
const e2e = spawnSync(process.execPath, ["qa/e2e.mjs"], { env: { ...process.env, BASE }, encoding: "utf8" });
const passed = /ALL CHECKS PASSED/.test(e2e.stdout);
ok("e2e golden path", passed, (e2e.stdout.match(/FAIL.*|PAGEERROR.*/g) || []).join(" | "));

console.log(failures === 0 ? "\nGATE PASSED" : `\nGATE FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
