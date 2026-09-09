import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LookupForm } from "./LookupForm";
import { SHOPIFY_LIVE, accountUrl } from "@/lib/shopify";

export const metadata: Metadata = {
  title: "Find your order",
  robots: { index: false, follow: false },
};

/**
 * Order lookup by code, against this site's own order store.
 *
 * That store is a closed set now: it holds only what was ordered here before
 * Shopify took over, which is a handful of test orders. A real customer's code
 * is a Shopify order number and returns "not found" -- so sending one here
 * would tell them their order does not exist. Nothing links here any more;
 * this catches a bookmark and hands them to Shopify, where they can sign in
 * with the email they checked out with, guest or not.
 *
 * /order/<code> still resolves directly, so the older records stay reachable.
 */
export default function OrderLookupPage() {
  if (SHOPIFY_LIVE) redirect(accountUrl());
  return <LookupForm />;
}
