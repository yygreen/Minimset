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

## Phase 2 — the four pickup locations

**Blocked on the four real Beis Medrash addresses.** Everything else in this
phase is quick once you have them. "Beis Medrash Hall, Park Heights" is a
neighbourhood; the address you enter prints on the customer's collection notice
and feeds tax calculation.

**2.1 Add four locations.** Settings → Locations → Add location. One per host
Beis Medrash. **The location name is what the customer picks at checkout**, so
name it as a place:

```
Baltimore — Adas Yisrael
Lakewood — Forest Park Beis Medrash
Monsey — Wesley Hills Beis Medrash
Five Towns — Central Avenue Beis Medrash
```

not "Shop location", and not "Warehouse 2".

**2.2 Make one of the four the default.** Until you do, the existing default
location holds the fulfilment setting hostage — that is what the greyed toggle
and the *"select another default location first"* notice mean.

**2.3 Delete the placeholder.** The original "Shop location" at 123 Highgrove
Cres is not a real place and should not be able to receive an order.

**2.4 Turn on local pickup.** Settings → Shipping and delivery → Local pickup.
For each of the four: pickup **on**, and in the pickup instructions put the
street address, the rep's name and phone, and what to bring. Set the expected
pickup time to a custom message:

> The day after Yom Kippur, 10:00 AM to 5:00 PM. Bring your order number. If
> you cannot come, send anyone with it.

**2.5 Remove the shipping rates.** Same section, the shipping profile these
products use. With rates present, checkout offers delivery; with none and
pickup on, it offers pickup only. **This is the step that decides whether the
whole model works at checkout.**

**check** — fulfilment is now toggleable on the four real locations, and the
placeholder is gone.

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

**4.2 Phone number required.** Same page. The reps need it on distribution day,
and it is the only way to reach somebody whose set is uncollected at 4:30.

**4.3 Taxes.** Settings → Taxes and duties. Whether Arba Minim are taxable in
NJ, NY and MD, and whether the program has nexus in each. That is an
accountant's answer, not mine, but it has to exist before money moves.

**4.4 Payments.** Yours to connect, in your own name. Everything else here can
be done first.

---

## Phase 5 — the emails people actually read

**5.1 Order confirmation.** Settings → Notifications. The default is generic
e-commerce. This one should say what happens next: nothing ships, collection is
the day after Yom Kippur, your order number is your pickup code.

**5.2 Ready for pickup.** The most important email of the season. It should
carry the address, the hours, the rep's phone, bring your order number, and
send someone else if you cannot come.

**5.3 Who gets notified of new orders.** Same section — make sure a person
actually receives them, not just the dashboard.

**check** — send yourself a test of each and read them on a phone.

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

**6.2 I commit them and verify.** Every "Order this set" on 4minimset.com then
opens a Shopify cart holding that exact set. Until then all eleven CTAs keep
using the on-site flow, which is why nothing has broken so far.

---

## Phase 7 — the test that settles it

Place one real order, with a real card, start to finish.

- No shipping option appears at any point
- All four towns appear as pickup choices
- The money lands in the right account
- The confirmation email reads correctly on a phone
- Refund it, and check the refund lands too

Anything wrong here is worth finding now rather than on erev Yom Tov.

---

## Phase 8 — distribution day

**8.1 Staff accounts.** Settings → Users. One per rep, scoped so each sees
their own community's orders and can mark them collected.

**8.2 The Shopify app on their phones.** That is the card system: search a name
or an order number, see what was ordered and what was paid, mark it fulfilled.
It replaces the `/staff` screens on this site.

**8.3 Who closes the store at the deadline**, and how. Shopify will not do it on
a date by itself — someone sets the products to Draft, or an app does.

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
- The **four rep phone numbers**, still `555` placeholders on the live site.
- The **four real addresses** — phase 2 cannot start without them.

All three are in `OPEN-QUESTIONS.md` as items 1, 5 and 8.
