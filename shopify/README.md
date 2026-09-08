# Product import

Two CSVs, generated from `lib/data.ts` so every price and every word of the
sorting standard matches the site exactly. Regenerate with
`python3 tools/shopify-csv.py` from the repository root if the catalog changes.

| File | Products | Variants |
| --- | --- | --- |
| `products-sets.csv` | Mehudar A-A, Mehudar A, Kosher L'Bracha (Chinuch) | 4 |
| `products-extras.csv` | Extra hadassim, extra aravos, koishiklach | 3 |

Everything imports as **draft**. Nothing appears in the store, and nothing can be
bought, until you publish it by hand. That is deliberate: the season deadline and
the A-A headline price are both still unconfirmed.

## Import

**Products → Import → Add file →** choose `products-sets.csv` **→ Upload and
continue → Import products.** Then the same for `products-extras.csv`, if the
extras are being sold through Shopify at all.

Product images are pulled from `https://4minimset.com/img/...` during the
import — they are already public, so nothing needs uploading. Shopify fetches
each one once and keeps its own copy.

## What the CSV already settled

- **The A-A pitom question is two variants**, not one ambiguous price: with
  pitom `$110`, no pitom `$100`. Whichever you make the default is the price a
  customer sees first.
- **Inventory tracking is off** on every variant. A tracked product sitting at
  zero silently refuses orders, and that failure looks like a broken site.
- **Requires shipping is TRUE.** These are physical items; delivery is removed
  by turning on local pickup and stripping the shipping rates, not by
  misdescribing the product.
- **SKUs** are `VS-5787-<LEVEL>-<VARIANT>`, so a packing list sorts sensibly.
- Body copy carries the headline, the sorting standard word for word, the
  sealing description, the exchange guarantee and the deadline.

## After importing

1. **Rename the store.** It is still called *My Store 2*, and that name appears
   at checkout and on every customer email. Settings → Store details.
2. Check each product's image arrived and the description reads correctly.
3. Decide which A-A variant is the default.
4. **Send the four variant IDs.** Open a variant; the ID is the last number in
   the URL: `…/products/1234567890/variants/`**`44444444444444`**. With those,
   every CTA on 4minimset.com opens a Shopify cart holding the right set. They
   are public values, not secrets.
5. Local pickup per Beis Medrash — blocked on the four real addresses.
6. Publish the products once the prices and the deadline are confirmed.
