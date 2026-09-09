# Product import

Two CSVs, generated from `lib/data.ts` so every price and every word of the
sorting standard matches the site exactly. Regenerate with
`python3 tools/shopify-csv.py` from the repository root if the catalog changes.

| File | Products | Variants |
| --- | --- | --- |
| `products-sets.csv` | Mehudar A-A, Mehudar A, Kosher L'Bracha (Chinuch) | 4 |
| `products-extras.csv` | Extra hadassim, extra aravos, koishiklach | 3 |

The CSVs carry `Published=TRUE` and `Status=active`, which **preserves** the
state of the products already in the store. A re-import matches on `Handle` and
updates in place, so importing these does not knock the live products off the
Online Store channel or take them off sale.

Importing into a *fresh* store is the opposite case: set `Status` to `"draft"`
in `tools/shopify-csv.py`, import, then publish deliberately.

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
- **Requires shipping is TRUE.** These are physical items and they are posted,
  so the flat rate in Settings → Shipping and delivery applies to all of them.
- **SKUs** are `VS-5787-<LEVEL>-<VARIANT>`, so a packing list sorts sensibly.
- Body copy carries the headline, the sorting standard word for word, the
  sealing description, the delivery promise, the replacement guarantee and the
  deadline.

## After importing

1. **Rename the store.** It is still called *My Store 2*, and that name appears
   at checkout and on every customer email. Settings → Store details.
2. Check each product's image arrived and the description reads correctly.
3. Decide which A-A variant is the default.
4. **Send the four variant IDs.** Open a variant; the ID is the last number in
   the URL: `…/products/1234567890/variants/`**`44444444444444`**. With those,
   every CTA on 4minimset.com opens a Shopify cart holding the right set. They
   are public values, not secrets.
5. Set the flat shipping rate — blocked on the figure.
6. Publish the products once the prices and the deadline are confirmed.
