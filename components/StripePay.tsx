"use client";

/**
 * The real card step. Rendered ONLY when the server says payments are live; until then the
 * checkout keeps its preview fields and this file contributes nothing to the bundle beyond
 * its own definition (Stripe.js is loaded from Stripe's CDN on demand, no npm package).
 *
 * Flow: the order already exists as PENDING_PAYMENT and this component holds its
 * PaymentIntent clientSecret. Stripe's Payment Element collects the card; on confirm, Stripe
 * redirects to /order/CODE?new=1, and the WEBHOOK - never the browser - flips the order to
 * PAID. A closed tab or failed card leaves a payable order behind, retried from the order page.
 */
import { useEffect, useRef, useState } from "react";

interface StripeGlobal {
  (pk: string): StripeInstance;
}
interface StripeInstance {
  elements(opts: { clientSecret: string; appearance?: unknown }): StripeElements;
  confirmPayment(opts: {
    elements: StripeElements;
    confirmParams: { return_url: string };
  }): Promise<{ error?: { message?: string; type?: string } }>;
}
interface StripeElements {
  create(kind: "payment", opts?: unknown): { mount(el: HTMLElement): void; unmount(): void };
}

declare global {
  interface Window {
    Stripe?: StripeGlobal;
  }
}

let stripeJs: Promise<StripeGlobal> | null = null;
function loadStripeJs(): Promise<StripeGlobal> {
  if (!stripeJs) {
    stripeJs = new Promise((resolve, reject) => {
      if (window.Stripe) return resolve(window.Stripe);
      const s = document.createElement("script");
      s.src = "https://js.stripe.com/v3/";
      s.async = true;
      s.onload = () => (window.Stripe ? resolve(window.Stripe) : reject(new Error("Stripe.js empty")));
      s.onerror = () => reject(new Error("Stripe.js failed to load"));
      document.head.appendChild(s);
    });
    // A failed load should be retryable, not cached forever.
    stripeJs.catch(() => {
      stripeJs = null;
    });
  }
  return stripeJs;
}

/** Matches the site: light, sand ground, leaf action color, Frank Ruhl headings not needed here. */
const APPEARANCE = {
  theme: "stripe",
  variables: {
    colorPrimary: "#1D5A3A",
    colorText: "#17150F",
    colorBackground: "#FFFFFF",
    colorDanger: "#B42318",
    borderRadius: "8px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

export function StripePay({
  publishableKey,
  clientSecret,
  returnUrl,
  payLabel,
}: {
  publishableKey: string;
  clientSecret: string;
  returnUrl: string;
  payLabel: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<StripeInstance | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "confirming" | "failed">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    let mounted: { unmount(): void } | null = null;
    loadStripeJs()
      .then((Stripe) => {
        if (!live || !holder.current) return;
        const stripe = Stripe(publishableKey);
        const elements = stripe.elements({ clientSecret, appearance: APPEARANCE });
        stripeRef.current = stripe;
        elementsRef.current = elements;
        const el = elements.create("payment");
        el.mount(holder.current);
        mounted = el;
        setState("ready");
      })
      .catch(() => {
        if (!live) return;
        setState("failed");
        setError("The payment form could not load. Check your connection and try again; your order is saved.");
      });
    return () => {
      live = false;
      mounted?.unmount();
    };
  }, [publishableKey, clientSecret]);

  const confirm = async () => {
    if (!stripeRef.current || !elementsRef.current) return;
    setState("confirming");
    setError("");
    const { error: err } = await stripeRef.current.confirmPayment({
      elements: elementsRef.current,
      confirmParams: { return_url: returnUrl },
    });
    // Only reached when confirmation failed; success redirects to returnUrl.
    setState("ready");
    setError(err?.message || "The card was not accepted. Try another card; your order is saved.");
  };

  return (
    <div>
      <div ref={holder} className={state === "loading" ? "min-h-[220px] animate-pulse rounded-lg bg-sand-100" : ""} />
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-alert-100 px-4 py-3 text-[14px] text-alert-800">
          {error}
        </p>
      )}
      {state !== "failed" && (
        <button
          type="button"
          disabled={state !== "ready"}
          onClick={confirm}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-lg bg-leaf-800 px-8 text-[17px] font-semibold text-white transition hover:bg-leaf-900 disabled:opacity-60"
        >
          {state === "confirming" ? "Confirming your payment..." : payLabel}
        </button>
      )}
    </div>
  );
}
