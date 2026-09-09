import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderFlow } from "./OrderFlow";
import { SHOPIFY_LIVE } from "@/lib/shopify";

export const metadata: Metadata = {
  title: "Start your order",
  // Every order URL is noindex: a checkout has no business in a search result.
  robots: { index: false, follow: false },
};

/**
 * The order, end to end, and the fallback for every "start an order" button.
 *
 * This page used to ask which community you would collect from, and the flow
 * itself lived under /[site]/order. The program ships to the door now, so there
 * is no community to choose and no reason for a route per town: one flow, four
 * steps, the chosen level carried in on ?level=.
 *
 * Once Shopify is live this page must not be reachable. It records an order and
 * shows the customer "Paid in full - paid by card" with no card charged, which
 * was honest while it was the only route and there was no processor, and is a
 * lie the moment a real checkout exists beside it. Nothing links here any more;
 * this redirect catches a bookmark, a shared link, or a browser autocomplete.
 *
 * It goes to the sets on this site rather than to Shopify: the customer should
 * choose here, where the sorting standard and the reasons are, and meet Shopify
 * only at checkout.
 */
export default function StartOrderPage() {
  if (SHOPIFY_LIVE) redirect("/#levels");
  return <OrderFlow />;
}
