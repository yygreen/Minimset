"use client";

import { useState } from "react";
import { useStore } from "@/lib/staff-store";

/**
 * Admin strip: the sample data used to review the screens before real orders exist.
 * Clearing samples only ever touches orders that were seeded; a real order is never in
 * reach of this button.
 */
export function StaffTools() {
  const { orders, seedDemo, clearDemo, signOut, locked, reload } = useStore();
  const [busy, setBusy] = useState("");
  const demoCount = orders.filter((o) => o.isDemo).length;
  const realCount = orders.length - demoCount;

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    await fn();
    setBusy("");
  };

  return (
    <div className="mt-12 grid gap-5">
      {/* sample data + session */}
      <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-xl font-bold text-ink-950">Sample data</h2>
        <p className="mt-1 text-sm text-ink-700">
          {realCount} real {realCount === 1 ? "order" : "orders"}, {demoCount} sample.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy !== ""}
            onClick={() => run("seed", seedDemo)}
            className="flex h-12 items-center justify-center rounded-lg border-2 border-sand-300 px-5 text-[14px] font-semibold text-ink-700 transition hover:border-ink-500 disabled:opacity-50"
          >
            {busy === "seed" ? "Adding..." : "Add sample orders"}
          </button>
          <button
            type="button"
            disabled={busy !== "" || demoCount === 0}
            onClick={() => run("clear", clearDemo)}
            className="flex h-12 items-center justify-center rounded-lg border-2 border-alert-800 px-5 text-[14px] font-semibold text-alert-800 transition hover:bg-alert-800 hover:text-white disabled:opacity-40"
          >
            {busy === "clear" ? "Clearing..." : "Clear sample orders"}
          </button>
          <button
            type="button"
            onClick={() => void reload()}
            className="flex h-12 items-center justify-center px-2 text-[14px] font-semibold text-ink-700 underline underline-offset-4"
          >
            Refresh
          </button>
        </div>
        <p className="mt-3 text-[13px] leading-snug text-ink-500">
          Clear the samples before the season opens so the totals are only real orders.
        </p>
        {locked && (
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-6 inline-block text-[14px] font-semibold text-ink-700 underline underline-offset-4"
          >
            Sign out of these screens
          </button>
        )}
      </section>
    </div>
  );
}
