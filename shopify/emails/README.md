# Customer emails

Shopify's defaults are generic e-commerce. These two carry what this program
actually does. Both are in **Settings → Notifications**.

## How to edit them without breaking anything

Each template is Liquid and HTML. **Replace the prose, keep every `{{ ... }}`
tag the template already has** — those print the order number, the customer's
name, the line items, the delivery address and the tracking number. Deleting
one silently empties that part of the email for every customer.

If you break a template, Shopify has *Revert to default* on each one.

## Before you use them

- **The deadline** appears in the order confirmation. One find-and-replace if
  that date changes.
- **The tracking block** in the shipping confirmation is Shopify's own. Leave
  it alone; the copy here goes around it, not instead of it.
- **Send yourself a test of each and read them on a phone.** That is where they
  will be read, with one hand free.
