# Connecting the Shopify store to 4minimset.com

The site is the shop window. Shopify is the shop.

Every "Order this set" button on 4minimset.com becomes a **Shopify cart
permalink** — one link that opens your store with the right set already in the
cart. Shopify then owns the cart, the payment, tax, shipping rates, the
receipt, refunds and the order admin. No card details ever touch this site, and
there is no payment code here to maintain.

Nothing switches over until the environment variables below are set. Until
then every button behaves exactly as it does today, so a half-finished setup
cannot strand a customer on a broken link.

---

## 1. In Shopify: create the products

Three products, one per level. Prices are per set and match the site.

| Product | Variants | Price |
| --- | --- | --- |
| Mehudar A-A | `With pitom` | $110 |
| | `No pitom` | $100 |
| Mehudar A | (single variant) | $65 |
| Kosher L'Bracha (Chinuch) | (single variant) | $40 |

For each product:

- **Inventory** → uncheck *Track quantity*, or set the quantity to what is
  actually being flown in. Anything tracked and left at zero will refuse
  orders.
- **Shipping** → leave *This is a physical product* checked. It is posted, so
  the flat rate set in step 2 has to apply to it.
- Add the photograph and the sorting standard to the description, so a
  customer who lands in Shopify from a shared link still sees what they are
  buying.

Optionally add the three extras (extra hadassim $12, extra aravos $6,
koishiklach $5) as their own products so they can be added at checkout.

## 2. In Shopify: set the flat shipping rate

**Settings → Locations** — there should be exactly one, and its address is the
real place the boxes go out from. It is where Shopify thinks parcels ship from
and it feeds tax calculation, so the default "Shop location" placeholder has to
be corrected and any other location deleted.

Then **Settings → Shipping and delivery** → the shipping profile these products
use → the zone covering the continental United States. Delete whatever rate
came with the store and add one:

```
Name   Flat rate shipping
Price  $[the agreed figure]
```

Shopify's flat rate is **per order**, not per item, and it should stay that
way: a man buying a Mehudar A-A for himself and three Chinuch sets for the boys
pays one shipping charge, and the site says so.

Put the same figure in `SHIPPING.flatRateCents` in `lib/data.ts`, in cents.
Until it is set the site says "flat-rate shipping added at checkout" and names
no number — honest, but weaker than a figure.

Decide what happens outside that zone. If a customer's address is not covered,
checkout tells them so and stops, so Alaska, Hawaii and PO boxes are a decision
to make now rather than discover.

Place one test order and confirm exactly one shipping option appears, at
exactly that price, and that it does not change when a second set goes in the
cart.

Fulfilment runs through the **Shopify admin**: buy the label against the order
so the tracking number is written back to it, which fires the shipping
confirmation automatically. That replaces the `/staff` screens for Shopify
orders.

## 3. In Shopify: close ordering at the deadline

The site's countdown is cosmetic once Shopify is taking the money. To make the
deadline real, on **Motzaei Shabbos, September 12, 8:30 PM EDT** either set
every product to *Draft*, or install a scheduled-publishing app to do it for
you. Ordering has to stop when the shipment is packed.

## 4. Get the four variant IDs

In Shopify admin, open a product and click a variant. The URL ends in the
variant ID:

```
admin.shopify.com/store/<you>/products/1234567890/variants/44444444444444
                                                            ^^^^^^^^^^^^^^
```

Collect one ID per row of the table in step 1. These IDs are public — they
appear in the page source of any Shopify storefront — so it is fine that they
end up in the site's JavaScript.

## 5. In Vercel: set the environment variables

**Project → Settings → Environment Variables**, Production (and Preview):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SHOPIFY_DOMAIN` | `your-store.myshopify.com`, or your custom shop domain |
| `NEXT_PUBLIC_SHOPIFY_VARIANT_MEHUDAR_AA_PITOM` | variant ID for Mehudar A-A, with pitom |
| `NEXT_PUBLIC_SHOPIFY_VARIANT_MEHUDAR_AA_NO_PITOM` | variant ID for Mehudar A-A, no pitom |
| `NEXT_PUBLIC_SHOPIFY_VARIANT_MEHUDAR_A` | variant ID for Mehudar A |
| `NEXT_PUBLIC_SHOPIFY_VARIANT_CHINUCH` | variant ID for Chinuch |
| `NEXT_PUBLIC_SHOPIFY_CATALOG_PATH` | optional, default `/collections/all` — where a plain "Order Now" lands |
| `NEXT_PUBLIC_SHOPIFY_LIVE` | **`1` to switch the CTAs over.** Anything else, or unset, and they keep using the on-site flow |

The switch is separate from the ids on purpose. Knowing a variant id is not the
same as the store being ready to take money: the products have to be published,
a payment provider connected and the flat shipping rate configured. So the ids
can be committed and verified while the buttons stay put,
and going live is one variable and a redeploy — reversible in the same minute
if the test order finds something wrong.

Redeploy. These are read at **build time**, so a change to any of them needs a
new deployment to take effect.

## 6. Check it

- A set card's "Order this set" goes to
  `https://<store>/cart/<variant>:1` and shows that set in the cart.
- "Order Now" in the header goes to the collection.
- Checkout offers exactly one shipping option at the agreed flat rate.
- The figure on the site matches the figure Shopify charges.
- A test order arrives in Shopify with the delivery address on it.

---

## What happens to the order flow already on this site

`/order/new`, `/order/<code>` and the `/staff` screens all stay in the
repository and keep working. They stop being linked from the buttons the moment
the variables above are set, and they are the fallback if the variables are
ever removed.

Two things they still own that Shopify does not, worth deciding on before the
season:

- **"Look up my order"** in the header still points at this site's order
  lookup, which will not know about a Shopify order. Point it at your Shopify
  order-status page, or remove it.
- **Phone orders.** There is no longer a screen here for keying one in — that
  went with the community reps. In Shopify the equivalent is a **draft order**
  created in the admin and marked paid, which is the better tool anyway.
