"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function OrderLookupPage() {
  const router = useRouter();
  const { orders, ready } = useStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const mine = orders.slice(0, 3);

  const [busy, setBusy] = useState(false);

  /**
   * The code is looked up on the server, so it works on any phone, not only the one that
   * placed the order. A local copy still counts, for when the network is against us.
   */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError("Enter the code from your confirmation.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(clean)}`);
      if (res.ok) {
        router.push(`/order/${clean}`);
        return;
      }
    } catch {
      /* fall through to the local copy */
    }

    const found = orders.find((o) => o.code === clean);
    setBusy(false);
    if (found) {
      router.push(`/order/${found.code}`);
      return;
    }
    setError(`No order found for code ${clean}. Check the code on your confirmation email.`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Order lookup</p>
      <h1 className="mt-2 font-display text-[2.5rem] font-bold leading-[1.05] text-ink-950 sm:text-[3rem]">
        Find your order
      </h1>
      <p className="mt-3 text-[17px] leading-relaxed text-ink-700">
        Enter the code from your confirmation email.
      </p>

      <form onSubmit={submit} className="mt-8 rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-6">
        <label className="block">
          <span className="text-[13px] font-semibold text-ink-900">Order code</span>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="e.g. K4TR9M"
            maxLength={8}
            className="mt-2 h-13 w-full rounded-lg border border-sand-300 bg-white px-4 text-center text-[17px] font-display font-bold uppercase tracking-[0.3em] text-ink-950 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
          />
        </label>
        {error && <p className="mt-3 text-[14px] text-alert-800">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 flex h-14 w-full items-center justify-center rounded-lg bg-leaf-800 px-8 text-[17px] font-semibold text-white transition hover:bg-leaf-900 disabled:opacity-60"
        >
          {busy ? "Looking..." : "Find my order"}
        </button>
      </form>

      {ready && mine.length > 0 && (
        <div className="mt-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
            Recent orders on this device
          </p>
          <ul className="mt-3 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white shadow-card">
            {mine.map((o) => (
              <li key={o.code}>
                <Link
                  href={`/order/${o.code}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-sand-50"
                >
                  <span>
                    <span className="font-display text-lg font-bold text-ink-950">{o.code}</span>
                    <span className="ml-3 text-[14px] text-ink-700">{o.customerName}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[14px] font-semibold text-leaf-800">
                    Open
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
