import type { Metadata } from "next";
import { OrderFlow } from "./OrderFlow";

export const metadata: Metadata = {
  title: "Start your order",
  // Every order URL is noindex: a checkout has no business in a search result.
  robots: { index: false, follow: false },
};

/**
 * The order, end to end, and the destination for every "order" call to action
 * on the site.
 *
 * This page used to ask which community you would collect from, and the flow
 * itself lived under /[site]/order. The program ships to the door now, so there
 * is no community to choose and no reason for a route per town: one flow, four
 * steps, the chosen level carried in on ?level=.
 */
export default function StartOrderPage() {
  return <OrderFlow />;
}
