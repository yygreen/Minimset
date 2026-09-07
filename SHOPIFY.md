# Connecting the Shopify store to 4minimset.com

The site is the shop window. Shopify is the shop.

Every "Order this set" button on 4minimset.com becomes a **Shopify cart
permalink** — one link that opens your store with the right set already in the
cart. Shopify then owns the cart, the payment, tax, the receipt, refunds,
local pickup and the order admin. No card details ever touch this site, and
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
- **Shipping** → leave *This is a physical product* checked. It is a physical
  item; delivery is handled by local pickup in step 2, not by unchecking this.
- Add the photograph and the sorting standard to the description, so a
  customer who lands in Shopify from a shared link still sees what they are
  buying.

Optionally add the three extras (extra hadassim $12, extra aravos $6,
koishiklach $5) as their own products so they can be added at checkout.

## 2. In Shopify: turn on local pickup for every community

**Settings → Locations** — add one location per host Beis Medrash:

| Location name | Address |
| --- | --- |
| Baltimore — Adas Yisrael | Park Heights, Baltimore, MD 21215 |
| Lakewood — Forest Park Beis Medrash | Forest Avenue, Lakewood, NJ 08701 |
| Monsey — Wesley Hills Beis Medrash | Route 306, Monsey, NY 10952 |
| Five Towns — Central Avenue Beis Medrash | Central Avenue, Cedarhurst, NY 11516 |

Then **Settings → Shipping and delivery → Local pickup**, and for each
location: turn pickup **on**, set the expected pickup time to a custom message
such as *"The day after Yom Kippur, 10:00 AM to 5:00 PM"*, and put the address
and the rep's phone number in the pickup instructions.

Then remove every shipping rate from the shipping profile these products use.
With pickup on and no rates to offer, checkout presents pickup only: the
customer chooses their town there, and Shopify emails a *ready for collection*
notice with the address. Their **order number is the pickup code**. Place one
test order and confirm no shipping option appears before you announce the
store — this is the one step worth checking by hand.

On distribution day the distributors work the **Shopify mobile app**: search a
name or an order number, see what was ordered and what was paid, and mark it
fulfilled. That replaces the `/staff` screens.

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

Redeploy. These are read at **build time**, so a change to any of them needs a
new deployment to take effect.

## 6. Check it

- A set card's "Order this set" goes to
  `https://<store>/cart/<variant>:1` and shows that set in the cart.
- "Order Now" in the header goes to the collection.
- Checkout offers pickup at four locations and no shipping.
- A test order arrives in Shopify with the right location on it.

---

## What happens to the order flow already on this site

`/order/new`, `/[site]/order`, `/order/<code>` and the `/staff` screens all
stay in the repository and keep working. They stop being linked from the
buttons the moment the variables above are set, and they are the fallback if
the variables are ever removed.

Two things they still own that Shopify does not, worth deciding on before the
season:

- **"Look up my order"** in the header still points at this site's order
  lookup, which will not know about a Shopify order. Point it at your Shopify
  order-status page, or remove it.
- **Paper and envelope orders** taken by a community rep are entered through
  the staff screens here. In Shopify the equivalent is a **draft order** the
  rep creates and marks paid.
