"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/staff-store";

/**
 * The PIN wall. Staff screens carry customer names and phone numbers, so when STAFF_PIN is
 * set on the server nothing behind here renders until the PIN is right. With no PIN
 * configured the screens stay open, exactly as the prototype was, and say so.
 */
export function StaffGate({ children }: { children: React.ReactNode }) {
  const { ready, signedIn, locked, signIn, configured } = useStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return <div className="mx-auto max-w-md px-4 py-24 text-center text-ink-500">Loading...</div>;
  }

  if (locked && !signedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 sm:py-28">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Staff</p>
        <h1 className="mt-2 font-display text-[2rem] font-bold text-ink-950">Enter your PIN</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
          These screens show customer names and phone numbers. Ask the office for the PIN.
        </p>
        <form
          className="mt-7 rounded-2xl border border-sand-200 bg-white p-5 shadow-card"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const okNow = await signIn(pin);
            setBusy(false);
            if (!okNow) setError("That PIN was not right.");
          }}
        >
          <label className="block">
            <span className="text-[13px] font-semibold text-ink-900">PIN</span>
            <input
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 8));
                setError("");
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="mt-2 h-13 w-full rounded-lg border border-sand-300 bg-white px-4 text-center font-display text-[22px] font-bold tracking-[0.4em] text-ink-950 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
            />
          </label>
          {error && (
            <p role="alert" className="mt-3 text-[14px] text-alert-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || pin.length < 3}
            className="mt-5 flex h-14 w-full items-center justify-center rounded-lg bg-leaf-800 px-6 text-[16px] font-semibold text-white transition hover:bg-leaf-900 disabled:opacity-50"
          >
            {busy ? "Checking..." : "Sign in"}
          </button>
        </form>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center text-[14px] font-semibold text-ink-700 underline underline-offset-4"
        >
          Back to the site
        </Link>
      </div>
    );
  }

  return (
    <>
      {!configured && (
        <p className="bg-esrog-100 px-4 py-2 text-center text-[13px] text-ink-900">
          No order store is connected, so these screens are empty.
        </p>
      )}
      {!locked && (
        <p className="bg-sand-100 px-4 py-2 text-center text-[13px] text-ink-700">
          No staff PIN is set on the server, so these screens are open to anyone with the link.
        </p>
      )}
      {children}
    </>
  );
}
