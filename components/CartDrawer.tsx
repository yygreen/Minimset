"use client";

import { useEffect } from "react";
import { SEASON, SHIPPING, shippingAmount } from "@/lib/data";
import { money } from "@/lib/orders";
import { cartUrl } from "@/lib/shopify";
import { useCart } from "@/lib/cart";
import { Stepper } from "./Ui";

/**
 * The cart, as a slide-over.
 *
 * A panel rather than a page so adding a Chinuch set for each boy never loses
 * the customer's place in the sets. "Checkout" builds one Shopify cart
 * permalink carrying every line, so the whole order arrives in checkout at
 * once -- Shopify's only job.
 */
export function CartDrawer() {
  const { lines, count, subtotalCents, open, setOpen, setQty, setPitom, remove } = useCart();

  // Escape closes it, and the page behind must not scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, setOpen]);

  if (!open) return null;

  const ship = shippingAmount();
  const checkoutHref = cartUrl(
    lines
      .filter((l) => l.variantId)
      .map((l) => ({ variantId: l.variantId as string, qty: l.qty })),
  );

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your cart">
      <button
        type="button"
        aria-label="Close cart"
        onClick={() => setOpen(false)}
        className="absolute inset-0 h-full w-full cursor-default bg-ink-950/40"
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-sand-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
          <p className="font-display text-xl font-bold text-ink-950">
            Your order{count > 0 && <span className="ml-2 text-[15px] font-normal text-ink-500">{count} {count === 1 ? "set" : "sets"}</span>}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-200"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-[15px] text-ink-700">Nothing in your order yet.</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center rounded-lg border-2 border-leaf-800 px-6 text-[15px] font-semibold text-leaf-900"
            >
              Choose a set
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-sand-200 overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.key} className="py-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-lg font-bold text-ink-950">{l.name}</p>
                    <p className="tnum shrink-0 font-semibold text-ink-950">{money(l.lineTotalCents)}</p>
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-500">{money(l.unitPriceCents)} per set</p>

                  {l.levelKey === "MEHUDAR_AA" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[true, false].map((on) => (
                        <button
                          key={String(on)}
                          type="button"
                          onClick={() => setPitom(l.key, on)}
                          aria-pressed={l.withPitom === on}
                          className={`h-10 rounded-lg border-2 text-[13px] font-semibold transition ${
                            l.withPitom === on
                              ? "border-leaf-800 bg-leaf-50 text-leaf-900"
                              : "border-sand-300 bg-white text-ink-700 hover:border-sand-400"
                          }`}
                        >
                          {on ? "With pitom" : "No pitom"}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Stepper value={l.qty} onChange={(n) => setQty(l.key, n)} label={l.name} />
                    <button
                      type="button"
                      onClick={() => remove(l.key)}
                      className="py-1 text-[13px] font-semibold text-ink-500 underline underline-offset-4 hover:text-alert-800"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-sand-200 bg-white px-5 py-5">
              <div className="flex items-baseline justify-between text-[15px]">
                <span className="text-ink-700">Sets</span>
                <span className="tnum font-semibold text-ink-950">{money(subtotalCents)}</span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between text-[15px]">
                <span className="text-ink-700">Shipping</span>
                <span className="tnum font-semibold text-ink-950">{ship ?? "At checkout"}</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-sand-200 pt-3">
                <span className="font-display text-lg font-bold text-ink-950">Total</span>
                <span className="tnum font-display text-2xl font-bold text-ink-950">
                  {money(subtotalCents + (SHIPPING.flatRateCents ?? 0))}
                </span>
              </div>

              {checkoutHref ? (
                <a
                  href={checkoutHref}
                  rel="noopener"
                  className="mt-4 flex h-14 items-center justify-center rounded-lg bg-leaf-800 px-6 text-[17px] font-semibold text-white transition hover:bg-leaf-900"
                >
                  Checkout
                </a>
              ) : (
                <p className="mt-4 rounded-lg bg-alert-100 px-4 py-3 text-[14px] text-alert-800">
                  Checkout is not available just now. Please try again shortly.
                </p>
              )}

              <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-500">
                Payment, address and receipt are handled by Shopify. {SEASON.deliveryNote}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
