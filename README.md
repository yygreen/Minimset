# Minimset — V'samachta Arba Minim (4minimset.com)

Repository for the live Arba Minim storefront at **4minimset.com**.

> **Status: awaiting source import.** The Vercel project is linked to this repo
> and needs no further wiring — pushing real source to `main` deploys it to
> production. The source has been traced to `C:\Users\User\vsamachta-arba-minim`;
> see [Where the source is](#where-the-source-is).
>
> ⚠️ **The live site advertises a payment deadline that has passed.** Shipped
> copy reads *"Pay in full before Motzaei Shabbos, September 5"*, the header
> still reads *"Sukkos 5787 pre-order is open"*, and orders are real. See
> [Season dates](#season-dates-need-a-decision).

## The live site

| | |
|---|---|
| Vercel project | `vsamachta-arba-minim` · `prj_ZAzT7PdUhWAXpImYTRTPOYjnRO55` |
| Vercel team | `rmbh` · `team_dR06wgxMphIGn3bAJDS93Sxg` |
| Framework | Next.js **16.3.1**, App Router, Turbopack, `next.config.ts` |
| Node | 24.x |
| Package | `vsamachta-arba-minim@0.1.0` |
| Live deploy | `dpl_Hrcgcxp4eo7Sf3RCD6nZU34gzwHP` (2026-08-26, `source: cli`) |
| Domains | 4minimset.com · vsamachta.com · fourminimset.com (+ www, + *.vercel.app) |

Every deployment to date was a CLI upload (157 files) from a local machine —
none came from git. That is why this repo is empty of application code.

## Runtime configuration, as live right now

From `GET /api/status`:

```json
{"store":true,"payments":"demo","notifications":"off",
 "staffLocked":true,"graceMinutes":15}
```

**Payments are in `demo` mode and notifications are `off`.** Worth confirming
that is intentional before the site takes real pre-orders.

## Where the source is

Established 2026-09-07 from three handover docs the build session left in
Joseph's Drive on 2026-08-26 — transcribed in full to
[`recovery/HANDOVER-2026-08-26.md`](HANDOVER-2026-08-26.md).

```
C:\Users\User\vsamachta-arba-minim        (Windows, NOT a git repo)
```

That folder also holds `DECISIONS.md`, `BUILD-DOC.md`, the 141-check `qa/` gate
and the `research/` studies — none of which exist anywhere else.

It was uploaded by a Claude Code Remote Control session
(`session_01Fay9bpcP3PpeGghocL1suX`, "hey", CLI 2.1.245 — matching the live
deployment's `meta.actor: "claude-code_2-1-245_agent"`). That session bridges to
the machine above and currently reports `connection_status: disconnected`.
A one-shot Routine (`trig_013y4rXdWd9PV6ypobek9ger`) is queued against it and
runs the moment Claude Code is opened there.

### Getting it without that machine

Vercel still stores the 157 uploaded files. `GET /_src` on the deployment host
307s to `vercel.com/deployments/…/source`, confirming they are retained:

<https://vercel.com/rmbh/vsamachta-arba-minim/Hrcgcxp4eo7Sf3RCD6nZU34gzwHP> → **Source** tab

That page is dashboard UI behind a browser login. It needs **any** device signed
in to Vercel — *not* the build machine. An agent session cannot do it: there is
no Vercel API token in the environment and the Vercel MCP server exposes no
file-reading tool. A Vercel API token would make it scriptable via
`GET /v6/deployments/{id}/files`.

## Orders are real

From the handover, and the reason a from-scratch backend rebuild is the wrong
move:

> ORDERS ARE REAL. They are written to a private server-side store, given a
> season-unique code, and visible to staff on any device. NO CARD IS CHARGED.

They live in a Vercel Blob store (`vsamachta-orders-private`) under a specific
path and JSON shape. A reimplementation that guesses either makes existing
orders invisible to staff.

## Season dates are sample data

| | |
|---|---|
| Pay in full before | `SEASON.deadlineIso` = **2026-09-06T00:30:00Z** — Motzaei Shabbos, September 5, 8:30 PM EDT |
| Arrives | Before Yom Tov — `SEASON.deliveryNote`, no fixed date, the carrier's to keep |

The deadline lives in `SEASON` in `lib/data.ts`. `/brief` calls it sample season
data and Joseph confirmed the real date is still to come.

Collection dates used to live here too, in a `SITES` table of four invented
communities. That table is gone. Fulfilment is now two constants beside each
other in `lib/data.ts`, and the customer picks between them in Shopify's
checkout:

- `SHIPPING` — one flat rate per order, anywhere in the US.
- `PICKUP` — the towns with a local pickup location, and what pickup costs.
  Nothing else: the street address, the collection day and the window belong to
  the Shopify location, because that is what Shopify prints in checkout and in
  the Ready for pickup email. The site naming them separately is how they drift.

Emptying `PICKUP.towns` removes every pickup sentence on the site. There is no
second flag to remember.

### The site is already closed, correctly

Verified 2026-09-07, after the deadline passed:

```
POST https://4minimset.com/api/checkout/start  ->  409 {"error":"orders are closed"}
```

`lib/server/pricing.ts` derives `DEADLINE_MS` from `SEASON.deadlineIso`, and
every ordering route refuses past it — `checkout/start`, `orders`,
`orders/[code]`, `orders/[code]/pay`. On the client, `components/OpenOnly.tsx`
swaps in a "registration closed" panel and `OrderFlow.tsx` computes
`isPastDeadline()` on every render. Visitors see a closed site.

What *is* stale is production's prerendered HTML. Those pages were built on
2026-08-26, when the deadline was still ahead, so the open-state markup is baked
into the static output — which is what crawlers, link previews and any
JavaScript-less fetch see. `recovery/snapshot/` captured exactly that.

So a rebuild today legitimately differs from the snapshot on four pages:

```
DIFF  /baltimore/order   /five-towns/order   /lakewood/order   /monsey/order
same  the other 19
```

That is the order pages rendering the closed panel server-side instead of the
order flow — the deadline being respected at build time, not a regression.
Setting a future deadline returns all four to the open flow, and the comparison
should go back to 23/23.

## Site structure

Consolidated 2026-09-07 at Joseph's request: the product and community pages
were folded into the homepage, leaving one selling page plus three standing
documents.

| URL | What it is |
|---|---|
| `/` | Everything that sells: hero, trust strip, the three sets in full (photo, promises, the standard word for word), the compare table, four minim, how it works, guarantee, and how delivery works |
| `/about` · `/faq` · `/policies` | The three standing documents. `/policies` is new |
| `/order/new` | The checkout flow — kept, it is a flow rather than content |
| `/order`, `/order/[code]` | Order lookup and confirmation, `noindex` |
| `/brief` | The operator's page, `noindex`, no PIN |
| `/staff/*` ×3 | Behind `STAFF_PIN`, `noindex` |

Anchors carry the folded content: `/#mehudar-aa`, `/#mehudar-a`, `/#chinuch`,
`/#delivery` and `/#compare`. The four `/#<town>` anchors went with the invented
communities and did not come back when local pickup did — there is one pickup
location and it has no page.

### What was removed, and where it went

`/sets/[slug]` (×3), the four community landing pages and the Hebrew home `/he`
now return 404. **Their source is not deleted — it is in `archive/`**, out of the
`app/` routing tree and excluded from `tsconfig.json` so it cannot break a build:

```
archive/sets/[slug]/        page, Gallery, ProductBar
archive/site-landing-page.tsx
archive/he/                 page + HeLang
```

Restoring any of them is a `git mv` back into `app/`. `lib/he.ts` and the Hebrew
rows in `CompareTable` were left in place, so the Hebrew copy itself is intact.

Removing `/he` makes the site English-only: the עברית switch is gone from the
header, the mobile menu and the footer, and `Chrome.tsx` no longer carries a
Hebrew copy table. `useLocale()` survives as the single place a locale test
would go back.

**SEO cost, stated plainly.** The indexable set went from 11 URLs to 4. The
build's own Semrush study concluded city pages were "wide open" and that
`"lulav and etrog set"` runs 210/mo; seven keyword-targeted URLs are now one
page competing for all of it. That was a deliberate choice, not an oversight.

## What is in this repo today

- `tools/compare-to-snapshot.py` — proves a build renders the same site that is
  live today; run it before promoting anything to `main`
- `tools/check-season-dates.py` — finds every place the season dates surface,
  English and Hebrew, and verifies a date change landed everywhere
- `recovery/HANDOVER-2026-08-26.md` — the build session's own handover: backend
  map, env vars, house rules, gotchas, open items
- `recovery/RESTORE.md` — how to get the real source back in
- `recovery/ARCHITECTURE.md` — the complete route/function map, from the production build log
- `recovery/snapshot/` — a captured copy of live production (23 pages, 11 photos, CSS, fonts)

There is deliberately **no `package.json` at the repo root**, so this branch
cannot produce a successful build and cannot replace the live deployment.

## Verifying a build before it goes to production

`main` is Vercel's production branch, so a push there is a live release. The
check that matters is whether visitors would see a different site:

```bash
python3 tools/compare-to-snapshot.py https://<preview-deploy>.vercel.app
```

It fetches every route in `recovery/snapshot/pages/` and diffs the visible text
against production as captured on 2026-09-07, ignoring build-to-build noise
(chunk hashes, the deployment id stamped into asset URLs, script payloads). It
exits non-zero if any page differs or cannot be fetched, so it can gate a
promotion.

Baseline when captured, against live production on 2026-09-07: **23 unchanged,
0 changed.**

That baseline is now **historical**. After the 2026-09-07 consolidation the same
run reports 15 changed and 8 unreachable — every page differs because the footer
changed on all of them, and the eight removed routes 404 by design. The snapshot
remains useful as a record of what the site said before, and as the reference for
the copy that was folded into the homepage; it is no longer a pass/fail gate.
Re-capture it if a fresh "no unintended change" gate is wanted.
