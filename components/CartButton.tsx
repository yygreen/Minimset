"use client";

import { SHOPIFY_LIVE } from "@/lib/shopify";
import { useCart } from "@/lib/cart";

/**
 * The way back to a cart already started. Renders nothing until there is
 * something in it, so a first-time visitor is not shown an empty basket, and
 * nothing at all when Shopify is switched off and there is no cart to keep.
 */
export function CartButton({ className = "" }: { className?: string }) {
  const { count, setOpen, ready } = useCart();
  if (!SHOPIFY_LIVE || !ready || count === 0) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`relative flex h-11 items-center gap-2 rounded-lg border-2 border-leaf-800 px-4 text-[15px] font-semibold text-leaf-900 transition hover:bg-leaf-800 hover:text-white ${className}`}
      aria-label={`Your order, ${count} ${count === 1 ? "set" : "sets"}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
      <span className="tnum">{count}</span>
    </button>
  );
}
