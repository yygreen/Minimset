"use client";

import { SHOPIFY_LIVE } from "@/lib/shopify";
import { useCart } from "@/lib/cart";

/**
 * The way into the cart, always present so somebody who has added nothing yet
 * can still see where an order would collect. The count rides as a badge and
 * only appears once there is something to count -- a "0" beside a basket reads
 * as an error rather than an empty cart.
 *
 * Hidden entirely when Shopify is switched off, because then there is no cart.
 */
export function CartButton({ className = "" }: { className?: string }) {
  const { count, setOpen } = useCart();
  if (!SHOPIFY_LIVE) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`relative flex h-11 w-11 items-center justify-center rounded-lg border-2 border-leaf-800 text-leaf-900 transition hover:bg-leaf-800 hover:text-white ${className}`}
      aria-label={count === 0 ? "Your order, empty" : `Your order, ${count} ${count === 1 ? "set" : "sets"}`}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 6h2l1.6 9.2a2 2 0 0 0 2 1.8h6.9a2 2 0 0 0 2-1.6L20 9H6.2"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1.4" fill="currentColor" />
        <circle cx="17" cy="20" r="1.4" fill="currentColor" />
      </svg>
      {count > 0 && (
        <span className="tnum absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-esrog-800 px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
