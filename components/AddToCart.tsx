"use client";

import { useState } from "react";
import type { LevelKey } from "@/lib/data";
import { SHOPIFY_LIVE } from "@/lib/shopify";
import { useCart } from "@/lib/cart";
import { OrderLink } from "./OrderLink";

/**
 * "Add to cart" on a set.
 *
 * Falls back to OrderLink when Shopify is switched off, so the kill switch
 * still lands somewhere that works rather than filling a cart with nowhere to
 * take it.
 *
 * Mehudar A-A adds with a pitom, which is the set most people mean and the
 * price the page leads with; the choice is changeable in the cart, where the
 * two prices sit side by side.
 */
export function AddToCart({
  level,
  className,
  children = "Add to cart",
}: {
  level: LevelKey;
  className?: string;
  children?: React.ReactNode;
}) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  if (!SHOPIFY_LIVE) {
    return (
      <OrderLink level={level} className={className}>
        {children}
      </OrderLink>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        add(level);
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1400);
      }}
      className={className}
      aria-live="polite"
    >
      {justAdded ? "Added" : children}
    </button>
  );
}
