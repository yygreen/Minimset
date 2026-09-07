"use client";

import { useState } from "react";
import { LEVELS, SITES } from "@/lib/data";
import { EMPTY_RESERVE, useStore } from "@/lib/staff-store";

/**
 * Admin strip: how much reserve stock flew in per site per level, and the sample data used to
 * review the screens before real orders exist. Clearing samples only ever touches orders that
 * were seeded; a real order is never in reach of this button.
 */
export function StaffTools() {
  const { orders, reserveBySite, setShipped, seedDemo, clearDemo, signOut, locked, reload } =
    useStore();
  const [busy, setBusy] = useState("");
  const demoCount = orders.filter((o) => o.isDemo).length;
  const realCount = orders.length - demoCount;

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    await fn();
    setBusy("");
  };

  return (
    <div className="mt-12 grid gap-5 lg:grid-cols-2">
      {/* reserve */}
      <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-xl font-bold text-ink-950">Reserve stock</h2>
        <p className="mt-1 text-sm text-ink-700">
          Spare sets flown in per site, for exchanges at the table. Used counts up as the Motz
          swaps an item.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-[12px] uppercase tracking-wide text-ink-500">
                <th className="pb-2 pr-3 font-semibold">Site</th>
                {LEVELS.map((l) => (
                  <th key={l.key} className="pb-2 pr-3 font-semibold">
                    {l.tier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SITES.map((s) => {
                const r = reserveBySite[s.slug] ?? EMPTY_RESERVE;
                return (
                  <tr key={s.slug} className="border-t border-sand-200">
                    <td className="py-2.5 pr-3 font-semibold text-ink-900">{s.name}</td>
                    {LEVELS.map((l) => (
                      <td key={l.key} className="py-2.5 pr-3">
                        <label className="flex items-center gap-2">
                          <span className="sr-only">{`${s.name} ${l.name} shipped`}</span>
                          <input
                            type="number"
                            min={0}
                            defaultValue={r[l.key].shipped}
                            onBlur={(e) => {
                              const n = Number(e.target.value);
                              if (Number.isFinite(n) && n !== r[l.key].shipped) {
                                void setShipped(s.slug, l.key, n);
                              }
                            }}
                            className="tnum h-10 w-16 rounded-lg border border-sand-300 bg-white px-2 text-center text-ink-950 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
                          />
                          <span className="tnum text-[12px] text-ink-500">used {r[l.key].used}</span>
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

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
