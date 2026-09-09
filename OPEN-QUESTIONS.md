# What still needs clearing up

Everything on 4minimset.com that is unconfirmed, invented as a placeholder, or
waiting on someone. Numbered so answers can come back as "1, 4, 9…".

Status of the backend as of this writing (`/api/status` on the live site):
`store: true`, `payments: "demo"`, `notifications: "off"`, `staffLocked: true`.
So orders taken *on this site* are recorded, **no card is charged**, and **no
email is sent**. Shopify is a separate story — see item 1.

---

## Settled on 2026-09-09, after Joseph described the framework

Raised, reviewed and closed. Kept here only so nobody re-opens them:

- **The deadline.** Motzaei Shabbos, September 12, 8:30 PM EDT stands.
- **The replacement guarantee.** `EXCHANGE_GUARANTEE` in `lib/data.ts` is a
  sentence I wrote when pickup was removed, because the old one promised a
  Moreh Hora'ah standing at a distribution table. Accepted as it reads: *"If a
  Moreh Hora'ah would rule that what you received is not worth what you paid,
  tell us and it is replaced from reserve stock at our cost."* It is a
  customer-facing promise, live on the homepage, `/faq`, the payment step and
  the Shopify refund policy.
- **"Seventeen years."** Stands, in four places.
- **Kiryas Joel**, claimed twice with nothing attached. Stands as it is.
- **The photographs.** Generic Daled Minim market shots rather than the
  program's own. Accepted; `/brief` still lists what to shoot if that changes.
- **Paper and envelope orders.** How most people order in Meah Shearim, and not
  being built for America.
- **"About one day in transit."** Confirmed by Joseph.

Numbering below keeps its gaps on purpose, so an answer sent earlier as
"11, 16" still points at the same thing.

---

## A. Blocking — the site cannot take a real order until these are settled

**1. Who takes the money.**
Half done. **Shopify Payments is connected and verified** — accepting payments,
payouts to Shopify Balance — and all four cart permalinks reach a live
checkout. What is left is the switch: `NEXT_PUBLIC_SHOPIFY_LIVE=1` in Vercel
(Production) and a redeploy, which is what moves all eleven CTAs off the
on-site flow. Until then this site's own `/api/status` still reports
`payments: "demo"`: an order placed here is recorded and marked paid with no
card charged. Do not send traffic in between.

**2. Order confirmations.**
`notifications` is `off`. Confirmation emails are written to a log and never
sent. Needs a sending domain and a Resend key before a buyer gets anything in
writing.

## B. Placeholder data currently on the live site

All of this is invented and visible to the public right now.

**5–9. RESOLVED by removal, 2026-09-09.** The four communities, their host
institutions, rep names, rep phone numbers and addresses were all invented, and
all of it is gone: the program ships to the door, so there are no pickup sites
to describe. Nothing invented remains on the public site in their place.

**5a. The flat shipping rate.** The one number the new model needs and does not
have. `SHIPPING.flatRateCents` in `lib/data.ts` is `null`, so the site says
"flat-rate shipping added at checkout" and names no figure. It has to match the
rate set in Shopify. Work it from a real carrier quote: a sealed lulav is long
and light, which is the awkward shape for parcel pricing.

**5b. The origin address.** Settings → Locations still holds the placeholder
"123 Highgrove Cres, Lakewood". It is where Shopify thinks parcels ship from
and it feeds tax calculation, so it has to be the real place the boxes go out
from.

**10. A contact for the program itself.** There is none anywhere on the site —
no phone, no email, no address. This mattered before; it is now the *only*
route a customer has, because there is no community rep to call.

**11. Prices.** $110 Mehudar A-A with pitom / $100 without, $65 Mehudar A, $40
Chinuch. Extras: hadassim $12, aravos $6, koishiklach $5. Confirm each.

## C. Trust — the reason a stranger would or would not buy

**14. Whose esrogim.** The site describes bletlech, shilush and tiyumes in
detail and never says which mesorah — Chazon Ish, Yanover, or another — nor
anything about orlah or the grower's hechsher. To a knowledgeable buyer this is
the most conspicuous gap on the page.

**15. The legal entity behind the store.** Who V'samachta is as an operation is
settled — Joseph runs it, it began in his own neighbourhood in Meah Shearim and
spread from there. What is still open is the entity the money belongs to: the
name on the IRS letter, the tax ID and the bank account behind Shopify
Payments. Nothing about the program's story; everything about who receives
$110 from a stranger in Baltimore.

**16. The Morei Hora'ah who do the sorting.** Named, not "a Moreh Hora'ah".
This is the whole basis of the offer and it is currently anonymous. It matters
more now than it did: nobody meets a Rav at a table any more, so the names are
the only place that trust can live.

## D. Shopify

**22. RESOLVED.** The store domain is `4minimset.myshopify.com`, committed as
the default in `lib/shopify.ts`.

**23. RESOLVED.** All four variant IDs were read from the store's own
`products.json` and committed in `lib/shopify.ts`: `45801595633799` (A-A with
pitom, $110), `45801595666567` (A-A no pitom, $100), `45801595732103`
(Mehudar A, $65), `45801595797639` (Chinuch, $40). Each was tested against the
live store and returns a real checkout. They are public values, not secrets.

**24. Do the extras get sold in Shopify** (extra hadassim, extra aravos,
koishiklach), or do they come off the site?

**25. The flat shipping rate in Shopify.** One zone covering the continental
United States, one flat rate per order. Needs the figure from item 5a. Also
decide what happens outside that zone — Alaska, Hawaii and PO boxes — because
an uncovered address stops checkout dead.

**26. "Look up my order"** in the header points at this site's order lookup,
which will not know about a Shopify order. Point it at the Shopify
order-status page, or remove it.

**28. Closing at the deadline.** Shopify does not close a store on a date by
itself. Someone has to set the products to Draft at the deadline, or an app
has to do it.

## E. Copy that asserts something unverified

**33. The sorting standards** in LEVELS are marked in the code as verbatim from
the operator's spec. Confirm they are still current for this season.

## F. Policy gaps

**34. Refunds in money terms.** The replacement guarantee covers quality.
Nothing says what happens if a buyer cancels after the deadline. The damaged-on-
arrival case now has an answer in the Shopify refund policy — tell us within two
days, with a photograph — and that window needs confirming.

**35. Undeliverable packages.** The shipping policy now says a returned package
can be sent again but the second shipping charge is the customer's. Confirm
that, and decide what happens when it is too late to resend before Yom Tov.

**36. Data retention.** "Kept for the season and the reconciliation that
follows it" — how long is that in practice, and who may ask for a record to be
deleted?

## G. Technical loose ends

**37. `public/img/LICENSES.md` does not exist** although the image manifest
says every photo's provenance is recorded there. The photos are described as
Commons/CC but nothing on disk proves it.

**38. `/brief` publishes joseph@rankfriendly.com.** The page is set to noindex
but is reachable by anyone with the URL.

**39. The repository default branch** is still `claude/session-recovery-a72409`
rather than `main`. Cosmetic, but confusing to anyone new.

**40. The Windows machine.** `DECISIONS.md`, `BUILD-DOC.md`, `research/` and
`scripts/` from `C:\Users\User\vsamachta-arba-minim` were never recovered — the
157 application files came back from Vercel, those did not.
