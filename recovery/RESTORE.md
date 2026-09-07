# Restoring the real source

The Vercel project is already linked to this repo, so **once real source lands
on the production branch, deploys resume automatically.** Nothing else to wire.

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

## Option 2 — from Vercel's stored deployment source

Vercel still holds the 157 uploaded source files for the live deployment:

<https://vercel.com/rmbh/vsamachta-arba-minim/Hrcgcxp4eo7Sf3RCD6nZU34gzwHP>
→ **Source** tab. Requires a dashboard login. Download, then push as above.

## After the source is in

Verify against `ARCHITECTURE.md`: 28 prerendered routes and 13 API functions
should be present. Then confirm the env vars are set in Vercel — none of them
live in git, and `payments` is currently `demo`.

## Safety note

Do not deploy `recovery/snapshot/` to production. It is rendered HTML, not the
application: no checkout, no order storage, no staff tooling.
