# Customer emails

Shopify's defaults are generic e-commerce. These two carry what this program
actually does. Both are in **Settings → Notifications**.

## How to edit them without breaking anything

Each template is Liquid and HTML. **Replace the prose, keep every `{{ ... }}`
tag the template already has** — those print the order number, the customer's
name, the line items, the pickup address and the rep details. Deleting one
silently empties that part of the email for every customer.

If you break a template, Shopify has *Revert to default* on each one.

## Before you use them

- **The deadline** appears in the order confirmation. One find-and-replace if
  that date changes.
- **The rep's name and number** in the pickup email: use the Liquid tag for the
  location if the template offers one, so each community gets its own. If it
  does not, the pickup instructions you set on each location in
  Settings → Shipping and delivery → Local pickup print automatically, and the
  rep details belong there instead.
- **Send yourself a test of each and read them on a phone.** That is where they
  will be read: standing in a Beis Medrash, one hand free.
