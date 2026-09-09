/**
 * Confirmations. Every notification is WRITTEN to the log always, and SENT only when the
 * operator has switched sending on:
 *
 *   RESEND_API_KEY   the operator's Resend key
 *   NOTIFY_FROM      e.g. "V'samachta Arba Minim <orders@their-domain.com>"
 *   NOTIFY_ENABLED   must literally be "1" before a single message leaves the building
 *
 * Deliberately off. Nothing here has ever sent mail, and it will not until the operator
 * says so with their own verified domain. Until then the log is the record, and the staff
 * screens can show what would have gone out.
 *
 * The SMS/WhatsApp seam is the same shape: add a sender here, call it from notifyPaid.
 */
import { PARTNERSHIP_PARAGRAPH, STANDARD_NOTE, SEASON } from "@/lib/data";
import { itemLabel, money, type Order } from "@/lib/orders";
import { logNotification } from "./repo";

export const NOTIFY_ENABLED = process.env.NOTIFY_ENABLED === "1" && Boolean(process.env.RESEND_API_KEY);

export function confirmationText(order: Order): { subject: string; text: string } {
  const a = order.address;
  const lines = order.items.map((i) => `  ${i.quantity} x ${itemLabel(i)}  ${money(i.unitPriceCents * i.quantity)}`);
  const text = [
    `Your order code is ${order.code}.`,
    "",
    "Your order",
    ...lines,
    order.shippingCents > 0 ? `  Shipping  ${money(order.shippingCents)}` : "",
    `  Total  ${money(order.totalCents)}`,
    "",
    PARTNERSHIP_PARAGRAPH,
    "",
    "Shipping to",
    `  ${order.customerName}`,
    `  ${a.line1}`,
    a.line2 ? `  ${a.line2}` : "",
    `  ${a.city}, ${a.state} ${a.zip}`,
    "",
    `  ${SEASON.deliveryNote} You will get a tracking number the day your box leaves.`,
    "",
    STANDARD_NOTE,
    "",
    `Find your order any time: https://4minimset.com/order/${order.code}`,
  ]
    .filter(Boolean)
    .join("\n");
  return { subject: `Your Arba Minim order ${order.code}`, text };
}

/** Log always; send only when explicitly switched on. Never throws into the order path. */
export async function notifyPaid(order: Order): Promise<void> {
  const { subject, text } = confirmationText(order);
  try {
    await logNotification(order.code, "PAID", {
      channel: "EMAIL",
      to: order.email || null,
      subject,
      sent: NOTIFY_ENABLED && Boolean(order.email),
    });
  } catch {
    /* the log is not worth failing a paid order over */
  }
  if (!NOTIFY_ENABLED || !order.email) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "orders@4minimset.com",
        to: [order.email],
        subject,
        text,
      }),
    });
  } catch {
    /* a confirmation that did not send must never lose the order */
  }
}
