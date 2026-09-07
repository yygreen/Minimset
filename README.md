# Minimset — V'samachta Arba Minim (4minimset.com)

Repository for the live Arba Minim storefront at **4minimset.com**.

> **Status: awaiting source import.**
> The Vercel project is linked to this repo, but the application source has
> not been pushed here yet. See [`recovery/RESTORE.md`](recovery/RESTORE.md).

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

## What is in this repo today

- `recovery/RESTORE.md` — how to get the real source back in
- `recovery/ARCHITECTURE.md` — the complete route/function map, from the production build log
- `recovery/snapshot/` — a captured copy of live production (23 pages, 11 photos, CSS, fonts)

There is deliberately **no `package.json` at the repo root**, so this branch
cannot produce a successful build and cannot replace the live deployment.
