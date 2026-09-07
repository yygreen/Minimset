# Restoring the real source

The Vercel project is already linked to this repo. **Nothing else needs wiring —
pushing real source to `main` will deploy it to production automatically.**

## Confirmed by test

Pushing this recovery branch triggered deployment `dpl_BwuMwd218VHKsQgEQDFMnz5i7U4o`,
which came back `target: null` (**preview**, not production) and `state: ERROR`
(no `package.json`, as intended). Live 4minimset.com was never touched.

Two things follow, both verified rather than assumed:

1. **Vercel's production branch is `main`**, which does not exist yet. It is
   free and reserved — push the real source there and it goes straight to
   production.
2. A branch without a root `package.json` cannot displace production, because
   the build fails before anything is promoted.

## Option 1 — from the original machine (lossless, ~30 seconds)

In the project folder on the computer that ran the CLI deploys:

```bash
git init
git add -A
git commit -m "Import V'samachta arba minim site"
git branch -M main
git remote add origin https://github.com/yygreen/Minimset
git push -u origin main
```

`main` is empty on the remote, so this push cannot conflict with the recovery
branch. It will build and deploy to production.

## Option 2 — from Vercel's stored deployment source

Vercel still holds the 157 uploaded source files for the live deployment:

<https://vercel.com/rmbh/vsamachta-arba-minim/Hrcgcxp4eo7Sf3RCD6nZU34gzwHP>
→ **Source** tab. Requires a dashboard login. Download, then push as above.

## After the source is in

- Check the build against `ARCHITECTURE.md`: 28 prerendered routes and 13 API
  functions should appear in the build output.
- Set the environment variables in Vercel. None of them are in git — Stripe
  keys, staff credentials and the order store connection all live only in the
  project settings, and `GET /api/status` currently reports
  `payments: "demo"` and `notifications: "off"`.

## Housekeeping

GitHub made `claude/session-recovery-a72409` the repository default branch,
because it was the first branch pushed to an empty repo. Once `main` exists,
switch the default to `main` in **Settings → Branches**. This is cosmetic —
Vercel already targets `main` for production regardless.

## Safety note

Do not deploy `recovery/snapshot/` to production. It is rendered HTML, not the
application: no checkout, no order storage, no staff tooling.
