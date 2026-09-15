"use client";

import { useState } from "react";
import type { LevelKey } from "@/lib/data";
import { SHOPIFY_LIVE } from "@/lib/shopify";
import { useCart } from "@/lib/cart";
import { track } from "@vercel/analytics";
import { OrderLink } from "./OrderLink";

/**
 * "Add to cart" on a set.
 *
 * Falls back to OrderLink when Shopify is switched off, so the kill switch
 * still lands somewhere that works rather than filling a cart with nowhere to
 * take it.
 *
 * Mehudar A-A defaults to WITH a pitom, which is the set most people mean.
 * The front page no longer relies on that default -- it shows the two A-A
 * variants as their own cards and each passes its own withPitom -- but the
 * default still covers every other caller, and the choice stays changeable in
 * the cart where the two prices sit side by side.
 */
export function AddToCart({
  level,
  withPitom = true,
  className,
  children = "Add to cart",
}: {
  level: LevelKey;
  /** Only meaningful for Mehudar A-A; harmless on the others. */
  withPitom?: boolean;
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
        add(level, withPitom);
        /* The middle of the funnel. Landing -> add_to_cart -> checkout is the
           whole of what this side can see, and the drop between any two of
           them is the only thing that says which set people balk at. */
        track("add_to_cart", { level, pitom: withPitom });
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
