# Go-live walkthrough

Every step, in the order it has to happen. Phases 2 and 3 depend on decisions in
phase 0; phase 6 depends on everything before it.

Where a step says **check**, that is the thing that quietly goes wrong if you
skip it.

---

## Phase 0 — three decisions, no clicking

**0.1 Whose business is this.** The tax ID and bank account on Shopify Payments
decide who receives the money and who reports the income. Community funds for
Arba Minim should sit with the operator or an entity, not with a contractor.
An EIN is free and issued in minutes at irs.gov; a personal SSN on a store
handling community money is the worse of the two.

**0.2 The real deadline.** The site currently says Motzaei Shabbos, September
12, 8:30 PM EDT. That was an assumption. It decides when the products go back
to Draft, and it is printed on every product description that just imported.

**0.3 Which Mehudar A-A variant is the default.** With pitom ($110) or without
($100). Whichever is default is the price a customer sees first, and it should
match what the homepage says.

---

## Phase 1 — store identity

**1.1 Store name.** Settings → Store details. It reads *4minimset*, which is a
handle, not a name. It appears at checkout and on every customer email. Set it
to **V'samachta Arba Minim**.

**1.2 Emails.** Same page: the store contact email (where customer replies go)
and the sender address on outgoing mail. Right now both are whatever the
account was opened with. A `@4minimset.com` address reads better than a
personal one, and Shopify will ask you to verify the domain before it sends
from it — start that early, it is not instant.

**1.3 Logo and favicon.** Online Store → Themes → Customize, and Settings →
Brand. They appear at checkout and on emails.

**1.4 Policies.** Settings → Policies. Refund, privacy, terms, and shipping.
Shopify links these from checkout, and blank ones look careless at exactly the
moment somebody is deciding whether to trust you. Paste from
`4minimset.com/policies` — that page was written from what the code actually
does, so it is accurate rather than boilerplate.

**check** — open the store's own checkout later and confirm the policy links
resolve rather than 404.

---

## Phase 2 — shipping

The pickup model is gone: no locations to add, no rep instructions, no
collection window. One origin, one flat rate.

**Blocked on the flat rate itself.** Everything else in this phase takes ten
minutes once you have the figure. Work it out from what a boxed set actually
costs to post — an esrog box plus a sealed lulav is long and light, which is the
awkward shape for carrier pricing, so check a real quote rather than guessing.

**2.1 Fix the origin address.** Settings → Locations. The default "Shop
location" at 123 Highgrove Cres is a placeholder. It is where Shopify thinks
parcels ship from, and it feeds tax calculation, so it has to be the real
address the boxes go out from.

**2.2 Delete every other location.** There should be exactly one. Any leftover
location can receive an order and quietly split the shipment.

**2.3 Set the flat rate.** Settings → Shipping and delivery → the shipping
profile these products use → the zone covering the continental United States.
Delete any rate that came with the store and add one:

```
Name   Flat rate shipping
Price  $[the figure]
```

Per **order**, not per item — Shopify's flat rate is per order by default;
leave it that way. A man buying a Mehudar A-A for himself and three Chinuch
sets for the boys pays one charge, and the site says so.

**2.4 Check what a customer with no rate sees.** If the zone does not cover
their address, checkout tells them so and stops. Decide now whether Alaska,
Hawaii and PO boxes are in or out, and either add a zone or say so on the
shipping policy.

**2.5 Put the same figure in the site.** `SHIPPING.flatRateCents` in
`lib/data.ts`, in cents. Until it is set, the site says "flat-rate shipping
added at checkout" and names no number, which is honest but weaker. With it
set, every "+ $X shipping" on the site fills itself in and matches Shopify.

**check** — a test order quotes exactly one shipping option at exactly the
figure above, and the site prints the same number.

---

## Phase 3 — products

**3.1 Delete the koishiklach image.** It imported with the esrog market photo,
because no photograph of lulav rings exists. A picture of the wrong item on a
product somebody is paying for is worse than no picture — Shopify shows a
neutral placeholder instead. (The generator no longer produces it, so a
re-import will not bring it back.)

**3.2 Set the A-A default variant**, per decision 0.3.

**3.3 Read one product page as a customer would.** Check the image arrived, the
sorting standard reads correctly, and the deadline in the description matches
decision 0.2.

**3.4 Publish.** The three sets, once the prices and the deadline are settled.
Decide separately whether the extras (hadassim $12, aravos $6, koishiklach $5)
are sold through Shopify at all — if not, delete them rather than leaving
drafts around.

Publishing only makes them visible on `4minimset.myshopify.com`, which nothing
links to yet. The site's buttons still use the on-site flow until phase 6.

---

## Phase 4 — checkout and tax

**4.1 Guest checkout on.** Settings → Checkout. Nobody wants an account to buy
an esrog, and forcing one costs orders.

**4.2 Phone number required.** Same page. Carriers ask for it, and it is the
only way to reach somebody whose address turns out to be wrong.

**4.3 Taxes.** Settings → Taxes and duties. Whether Arba Minim are taxable in
each state you ship to, and where the program has nexus. Shipping to the whole
country makes this bigger than it was with four towns, not smaller. That is an
accountant's answer, not mine, but it has to exist before money moves.

**4.4 Payments.** Yours to connect, in your own name. Everything else here can
be done first.

**4.5 If Shopify Payments says it cannot verify your information.** That
message is a KYC mismatch against IRS and bank records, and it is the same
sentence for every cause -- resubmitting the same details fails again. The four
usual causes:

- *Entity type against tax ID.* Sole proprietor expects an SSN; LLC,
  corporation and non-profit expect an EIN. Either one under the wrong
  selection fails.
- *Legal business name.* Must match the IRS confirmation letter (CP 575)
  exactly, not the trade name. Apostrophes, `Inc`, and a leading `The` all
  count.
- *Business address.* The registered address, not a pickup location and not a
  PO box.
- *The individual section.* Legal name, date of birth and SSN of the listed
  owner, as that person's own records read. A nickname fails.

A newly issued EIN is the other common cause: it takes roughly two weeks to
appear in the database Shopify queries, so correct details can still bounce.

Rather than a third attempt, open Settings -> Payments -> Shopify Payments ->
**View account details**; the banner there is usually more specific than the
tile. If it is not, contact Shopify support from inside the admin -- they can
read the actual rejection reason, which the UI does not show. Repeated failed
submissions can push the account into manual review, which is slower.

**Fallback if it stays blocked.** The site can take card payments through the
operator's own Stripe account instead: set `STRIPE_SECRET_KEY`,
`STRIPE_PUBLISHABLE_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel project settings
-- never in the repo, which is public. Shopify accepts third-party gateways
too, at an extra transaction fee on every order.

---

## Phase 5 — the emails people actually read

**Decided: leave Shopify's templates alone.** The defaults are accurate for a
shipped order rather than merely tolerable -- the confirmation prints the
delivery address, and the shipping confirmation prints the carrier, the
tracking number and a Track button, all automatically. Editing them means
working inside a thousand lines of Liquid.

**5.1 Turn the shipping confirmation on and read it.** Settings →
Notifications → Shipping confirmation. This is now the most-read email of the
season: it is what replaces a person standing at a table telling somebody their
set is ready.

**5.2 Who gets notified of new orders.** Settings → Notifications — make sure a
person actually receives them, not just the dashboard.

**check** — read the real confirmation and the real shipping confirmation on a
phone during the phase 7 test order. If either feels thin, the copy is drafted
in `shopify/emails/` and takes five minutes to paste in. Deciding that after
seeing a real one beats deciding it against a wall of Liquid.

---

## Phase 6 — connect the site

**6.1 Send me the four variant IDs.** Open a variant; the ID is the last number
in the URL:

```
…/products/1234567890/variants/44444444444444
                               ^^^^^^^^^^^^^^
```

Mehudar A-A with pitom, Mehudar A-A no pitom, Mehudar A, Chinuch. They are
public values, not secrets — they appear in the source of every Shopify
storefront.

**6.2 I commit them and verify.** The ids go in, and the buttons stay on the
on-site flow — committing an id does not switch anything over.

**6.3 Flip the switch, after phase 7.** Set `NEXT_PUBLIC_SHOPIFY_LIVE=1` in
Vercel and redeploy. Every "Order this set" then opens a Shopify cart holding
that exact set. Set it back to `0` and the site returns to the on-site flow in
one redeploy, so a bad surprise costs a minute rather than a season.

---

## Phase 7 — the test that settles it

Place one real order, with a real card, start to finish.

- Exactly one shipping option appears, at exactly the flat rate
- The rate does not change when you add a second set to the cart
- The site's stated shipping figure matches what checkout charges
- The money lands in the right account
- The confirmation email reads correctly on a phone
- The shipping confirmation, once you mark it fulfilled, carries the tracking
  number and reads correctly
- Refund it, and check the refund lands too

Anything wrong here is worth finding now rather than on erev Yom Tov.

---

## Phase 8 — packing and shipping

**8.1 Staff accounts.** Settings → Users. One per person who will be packing,
so fulfilment is attributable.

**8.2 Buy labels in Shopify.** Shopify Shipping prints a label against the
order and writes the tracking number back to it, which fires the shipping
confirmation automatically. Doing it in a separate carrier tool means keying
every tracking number back in by hand.

**8.3 Fulfil in batches.** Orders → select → Fulfil. One label per order; the
customer gets their email as each is marked.

**8.4 Who closes the store at the deadline**, and how. Shopify will not do it on
a date by itself — someone sets the products to Draft, or an app does.

The `/staff/fulfillment` screen on this site does the same job for orders that
came through the on-site flow rather than Shopify: address as one pasteable
block, carrier and tracking recorded per order.

---

## Optional, and worth it

**Put checkout on your own domain.** `shop.4minimset.com` pointed at Shopify
means a buyer never sees `myshopify.com` at the moment he types his card. For
an audience whose first question is whether this is legitimate, that is a real
gain for about ten minutes of DNS. Settings → Domains → Connect existing
domain.

---

## Still open, outside Shopify

- The **real deadline** (0.2) — my September 12 is an assumption.
- The **flat shipping rate** — phase 2 cannot finish without the figure.
- The **origin address** the boxes actually ship from, for Settings → Locations.
- A **program phone number and a store contact email**, now the only routes a
  customer has; there is no community rep to call any more.
- The **replacement guarantee wording** in `lib/data.ts`. It used to promise a
  Moreh Hora'ah present at distribution, which is no longer true. The new
  wording promises replacement from reserve stock at the program's cost — that
  is a promise to customers and the operator has to agree it.
