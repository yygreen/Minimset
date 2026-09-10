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

**0.2 The real deadline.** `SEASON.deadlineIso` in `lib/data.ts` is
`2026-09-13T00:30Z` — Motzaei Shabbos, September 12, 8:30 PM EDT. That was an
assumption and nothing has confirmed it. It no longer appears anywhere a
customer can read, but it is still the moment the site stops selling, and it is
still the moment you have to put the three products back to Draft by hand.

The season flyer says the pre-order deadline is **Erev Rosh Hashanah, Friday 29
Elul** — September 11, 2026. That is a day and a half *earlier* than what is in
the code, and it means the site as it stands would keep selling right through
Rosh Hashanah. Settle which one is real and change `deadlineIso`.

**0.3 Which Mehudar A-A variant is the default.** With pitom ($120) or without
($110). Whichever is default is the price a customer sees first, and it should
match what the homepage says.

**0.4 URGENT — the prices in Shopify are the old ones.** The site now shows
$120 / $110 / $70 / $45. The four live variants still cost $110 / $100 / $65 /
$40, and Shopify is what actually charges the card. Until they are changed, a
customer reads $120 on the page and is billed $110 at checkout.

Products → each product → Variant → Price:

| Product | Variant | New price |
| --- | --- | --- |
| Mehudar A-A | With pitom | **120.00** |
| Mehudar A-A | No pitom | **110.00** |
| Mehudar A | (single) | **70.00** |
| Kosher L'Bracha (Chinuch) | (single) | **45.00** |

Four fields by hand is faster and safer than a CSV re-import. `shopify/products-sets.csv`
carries the same figures if you would rather import.

**check** — add one of each to the cart on 4minimset.com, click through to
Shopify checkout, and confirm the subtotal is $235 and not $215.

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

## Phase 2 — shipping and local pickup

Two ways to take an order, chosen by the customer in checkout: shipped at one
flat rate, or collected free in Airmont, NY.

**2.1 The origin address is done.** Settings → Locations holds one active
location, "Shop location" at 123 Highgrove Crescent, Lakewood NJ 08701, and
Joseph has confirmed that is the real address. It is where Shopify thinks
parcels ship from, it feeds tax calculation, and it is the return address on
any label bought through Shopify Shipping. Nothing to change.

**2.2 There is exactly one location**, which is what you want. A second one
could receive an order and quietly split the shipment.

**2.2a Re-paste the policies whenever the model changes.** `shipping.txt`,
`terms.txt` and `refund.txt` in `shopify/policies/` were all rewritten when
local pickup came back, and the versions live on the store predate that: they
describe shipping as the only option. Settings → Policies, paste all three.
`contact-information` and the Shopify-generated `privacy-policy` are unaffected.

**2.2b Local pickup.** The site tells customers there is free pickup in
Airmont, NY, and that the address and the collection window reach them in the
Ready for pickup email rather than being printed on the site — so the Shopify
location is the single source of truth for both, and it has to be right.

- Settings → Locations → add the Airmont location, with the address customers
  will actually drive to and the hours they can actually collect.
- Settings → Shipping and delivery → Local pickup → enable it for that location.
  Set the cost to free, and write the pickup instructions and the expected
  time — Shopify prints those verbatim in checkout and in the email.
- Leave Lakewood as the shipping origin. A location that can receive orders but
  is not meant to fulfil them can quietly split a shipment.
- Settings → Notifications → Ready for pickup, from
  `shopify/emails/ready-for-pickup.txt`.

**check** — put a set in the cart and confirm checkout offers both *Ship* and
*Pick up*, that pickup shows $0 and not $7.99, and that the address and window
in checkout are the ones you would want a customer to drive to.

*If pickup is ever switched off, empty `PICKUP.towns` in `lib/data.ts`. Every
pickup sentence on the site disappears with it; there is no second flag.*

**2.3 Set the flat rate.** Settings → Shipping and delivery → the shipping
profile these products use → the zone covering the United States.
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

**4.3 Taxes. New Jersey only, and it is already live.** Settings → Taxes and
duties shows *New Jersey - Action required - Physical presence threshold met in
September 2026*. That is the Lakewood location creating nexus in NJ. Nowhere
else: economic nexus needs roughly $100k of sales or 200 transactions into one
state in a year, which a single Sukkos season will not approach.

- **Registered in NJ** → *Set up tax collection*, enter the tax ID. It charges
  NJ-bound orders only. Do it before the phase 7 test order so the tax line is
  visible in a real checkout.
- **Not registered** → do not tick the box. Collecting tax you cannot remit is
  worse than not collecting. Registration is the blocker, and it is not
  instant.
- **Never switch on all fifty states.** Every state registered is a state that
  must be filed in, quarterly, including the quarters with no sales.

**Why this cannot be a "later" item here.** A normal shop fixes tax next month
and a handful of orders were affected. This program's entire season lands in
the days before the deadline; later is after all of it. Uncollected NJ tax at
6.625% is about $7.82 on a $117.99 Mehudar A-A -- more than the $7.99 shipping
charged on it -- and it cannot be recovered from the customer afterwards.

Whether Arba Minim are taxable in NJ at all is the accountant's answer, not
mine. They are neither food nor clothing, so taxable tangible property is the
default assumption, but a qualifying religious non-profit may sit differently.

Leave alone on that page: every non-US region (the shipping zone is US-only, so
nobody else can check out), tax-inclusive pricing (off -- Shopify itself says US
stores should not include tax in the price), duties and import taxes (off --
domestic only, and it carries a 0.5% fee), and the country-of-origin and HS-code
fields (customs data for international orders). "Charge sales tax on shipping"
is automatic for the US and correct: NJ taxes delivery on taxable goods.

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
