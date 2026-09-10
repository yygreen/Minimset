# Customer emails

Shopify's defaults are generic e-commerce. These three carry what this program
actually does. All are in **Settings → Notifications**.

| File | Shopify notification | Goes to |
| --- | --- | --- |
| `order-confirmation.txt` | Order confirmation | every order |
| `shipping-confirmation.txt` | Shipping confirmation | orders being shipped |
| `ready-for-pickup.txt` | Ready for pickup | orders collected locally |

The last one only fires once local pickup is switched on for the location, and
Shopify prints that location's address and hours itself — which is why the copy
names neither. Keep the address and hours right on the location and the email
stays right.

## How to edit them without breaking anything

Each template is Liquid and HTML. **Replace the prose, keep every `{{ ... }}`
tag the template already has** — those print the order number, the customer's
name, the line items, the delivery address and the tracking number. Deleting
one silently empties that part of the email for every customer.

If you break a template, Shopify has *Revert to default* on each one.

## Before you use them

- **The tracking block** in the shipping confirmation is Shopify's own, and so
  is the pickup-details block in the ready-for-pickup email. Leave both alone;
  the copy here goes around them, not instead of them.
- **No template names a date.** They say "before ordering closes" so that a
  moved deadline is one change in Shopify, not three find-and-replaces.
- **Send yourself a test of each and read them on a phone.** That is where they
  will be read, with one hand free.
