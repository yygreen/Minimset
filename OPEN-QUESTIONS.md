# What still needs clearing up

Everything on 4minimset.com that is unconfirmed, invented as a placeholder, or
waiting on someone. Numbered so answers can come back as "1, 4, 9…".

Status of the backend as of this writing (`/api/status` on the live site):
`store: true`, `payments: "demo"`, `notifications: "off"`, `staffLocked: true`.
So orders are recorded, **no card is charged**, and **no email is sent**.

---

## A. Blocking — the site cannot take a real order until these are settled

**1. The payment deadline.**
The whole site is built on one value: `SEASON.deadlineIso` =
**Motzaei Shabbos, September 12 2026, 8:30 PM EDT**. That date was an
assumption, never confirmed. It drives the countdown, the server-side cutoff,
the open/closed state of ordering, and every date label on 17 pages. If it is
wrong, everything is wrong.

**2. Distribution day.**
Currently **Tuesday, September 22 2026, 10:00 AM – 5:00 PM** at all four sites.
Confirm the date, and whether every community really runs the same day and the
same hours.

**3. Who takes the money.**
`payments` is `demo`: an order is recorded and marked paid with no card
charged. Either connect the Shopify store (see section D) or put your own
Stripe keys in Vercel. Nothing can go live until one of those is true.

**4. Order confirmations.**
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

**5c. The replacement guarantee wording.** `EXCHANGE_GUARANTEE` in
`lib/data.ts` used to promise a Moreh Hora'ah present at distribution. There is
no distribution, so it now reads: *"If a Moreh Hora'ah would rule that what you
received is not worth what you paid, tell us and it is replaced from reserve
stock at our cost."* That is a promise to customers and needs the operator's
agreement.

**10. A contact for the program itself.** There is none anywhere on the site —
no phone, no email, no address. This mattered before; it is now the *only*
route a customer has, because there is no community rep to call.

**11. Prices.** $110 Mehudar A-A with pitom / $100 without, $65 Mehudar A, $40
Chinuch. Extras: hadassim $12, aravos $6, koishiklach $5. Confirm each.

**12. Reserve stock.** The staff screens track reserve per site per level for
exchanges. Nobody has said how much reserve actually flies in.

## C. Trust — the reason a stranger would or would not buy

**13. The Morei Hora'ah who sort.** The site says "a Rav" and "Morei Hora'ah"
generically, seven times, and names nobody. An empty slot is already wired into
the homepage that renders the moment names are supplied — name, role, city, and
confirmation that each Rav agrees to be published.

**14. Whose esrogim.** The site describes bletlech, shilush and tiyumes in
detail and never says which mesorah — Chazon Ish, Yanover, or another — nor
anything about orlah or the grower's hechsher. To a knowledgeable buyer this is
the most conspicuous gap on the page.

**15. Who V'samachta is.** "V'samachta was established in Eretz Yisrael" — by
whom, in what year, at what address, under what organisation?

**16. The Morei Hora'ah who do the sorting.** Named, not "a Moreh Hora'ah".
This is the whole basis of the offer and it is currently anonymous. It matters
more now than it did: nobody meets a Rav at a table any more, so the names are
the only place that trust can live.

**17. Kiryas Joel.** Claimed twice as the proof that this works in America,
with nothing attached. Who runs it there, how many sets last year, and is there
someone who would take a call from a stranger?

**18. Numbers.** "Seventeen years" is the only figure on the whole site. Sets
per season, communities served, neighbourhoods in Eretz Yisrael.

**19. A letter.** A scanned michtav or haskama, or a photograph of the real
Meah Shearim order sheet, would do more than the entire About page. Does one
exist that may be published?

**20. Your own photographs.** Every photo on the site is a generic Daled Minim
market shot, not V'samachta's operation. The `/brief` page lists exactly what
to shoot — a Rav checking an esrog, the seal going on, the packing, a boxed
set ready to go out. Also wanted: a 20–40 second clip of a Rav checking and
sealing a set; the player is already built and hidden until a file exists.

**21. The hero photograph is too small.** 780×860 pixels, blown up more than
twice its real size on any retina screen. Either send a larger original of that
market shot, or pick a different hero from the ones already in the repo
(several are 2400px wide).

## D. Shopify

**22. The store domain** — `something.myshopify.com` or a custom shop domain.

**23. Four variant IDs** — Mehudar A-A with pitom, Mehudar A-A no pitom,
Mehudar A, Chinuch. The wiring is deployed and inert until these are set;
`SHOPIFY.md` has the full setup.

**24. Do the extras get sold in Shopify** (extra hadassim, extra aravos,
koishiklach), or do they come off the site?

**25. The flat shipping rate in Shopify.** One zone covering the continental
United States, one flat rate per order. Needs the figure from item 5a. Also
decide what happens outside that zone — Alaska, Hawaii and PO boxes — because
an uncovered address stops checkout dead.

**26. "Look up my order"** in the header points at this site's order lookup,
which will not know about a Shopify order. Point it at the Shopify
order-status page, or remove it.

**27. Paper and envelope orders.** Currently entered by a rep through the staff
screens here. In Shopify the equivalent is a draft order the rep creates and
marks paid. Which way is it being run this season?

**28. Closing at the deadline.** Shopify does not close a store on a date by
itself. Someone has to set the products to Draft at the deadline, or an app
has to do it.

## E. Copy that asserts something unverified

**29. "Seventeen years"** — from what year to what year?

**30. "Kiryas Joel already runs the same system"** — see item 17.

**31. "About one day in transit"** — is the shipment actually flown, and to
which airport, and who clears it?

**32. "A whole community is served in two to three hours"** — from Eretz
Yisrael's experience, or measured in America?

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
