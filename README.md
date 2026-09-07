# Minimset — V'samachta Arba Minim (4minimset.com)

Repository for the live Arba Minim storefront at **4minimset.com**.

> **Status: awaiting source import.** The Vercel project is linked to this repo
> and needs no further wiring — pushing real source to `main` deploys it to
> production. The application source has been traced to a specific machine;
> see [Where the source is](#where-the-source-is) below.

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

Traced on 2026-09-07. The live deployment records
`meta.actor: "claude-code_2-1-245_agent"`, so it was uploaded by a Claude Code
agent running CLI version 2.1.245. Exactly one session matches:

| | |
|---|---|
| Session | `session_01Fay9bpcP3PpeGghocL1suX`, titled "hey" |
| Created | 2026-08-25, last active 2026-09-07 |
| Origin | `claude_code_cli`, `environment_kind: bridge`, tagged `remote-control-repl` |
| Its own summary | *"Sukkos site built: 4 products, checkout, community, Hebrew home, Lighthouse 96-98"* |

`environment_kind: bridge` is the decisive part: that session is **Claude Code
running on Joseph's own computer**, bridged to the web through Remote Control —
not an ephemeral cloud container. So the project folder is still on that
machine's disk. Its bridge currently reports `connection_status: disconnected`
(`last_init_error: computer_unreachable`), which is why the source cannot be
pulled from here.

A one-shot Routine (`trig_013y4rXdWd9PV6ypobek9ger`) is queued against that
session. It asks it to find the project, verify no secrets are staged, and push
to `claude/4minimset-source-import`. **It runs the moment Claude Code is opened
on that computer.** Nothing else is required.

Failing that, the source can also be downloaded from Vercel, which still holds
the 157 uploaded files:
<https://vercel.com/rmbh/vsamachta-arba-minim/Hrcgcxp4eo7Sf3RCD6nZU34gzwHP>
→ **Source** tab.

## What is in this repo today

- `tools/compare-to-snapshot.py` — proves a build renders the same site that is
  live today; run it before promoting anything to `main`
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

Baseline, run against live production on 2026-09-07: **23 unchanged, 0 changed.**
