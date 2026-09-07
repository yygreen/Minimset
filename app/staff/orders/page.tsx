"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/Ui";
import { SITES } from "@/lib/data";
import { itemLabel, money } from "@/lib/orders";
import { useStore } from "@/lib/staff-store";

const FILTERS = ["All", "Online", "Paper", "Outstanding", "Cancelled"] as const;

export default function OrdersPage() {
  const { orders, ready } = useStore();
  const [query, setQuery] = useState("");
  const [site, setSite] = useState("all");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return orders.filter((o) => {
      if (site !== "all" && o.siteSlug !== site) return false;
      if (filter === "Online" && o.channel !== "ONLINE") return false;
      if (filter === "Paper" && o.channel !== "PAPER") return false;
      if (filter === "Cancelled" && o.status !== "CANCELLED_REFUNDED") return false;
      if (
        filter === "Outstanding" &&
        !(o.status === "PAID" || o.status === "PARTIALLY_PICKED_UP")
      ) {
        return false;
      }
      if (filter !== "Cancelled" && o.status === "CANCELLED_REFUNDED" && filter !== "All") {
        return false;
      }
      if (!q) return true;
      return (
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (digits.length >= 3 && o.phone.replace(/\D/g, "").includes(digits))
      );
    });
  }, [orders, query, site, filter]);

  if (!ready) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-ink-950">Order Search</h1>
      <p className="mt-1 text-sm text-ink-700">
        {orders.length} orders across {SITES.length} sites, online and paper.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Code, name or phone"
          className="h-13 min-w-[240px] flex-1 rounded-lg border border-sand-300 bg-white px-4 text-[17px] text-ink-950 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
        />
        <select
          value={site}
          onChange={(e) => setSite(e.target.value)}
          className="h-13 rounded-lg border border-sand-300 bg-white px-4 font-semibold text-ink-900 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
        >
          <option value="all">All sites</option>
          {SITES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1 rounded-lg border border-sand-300 bg-white p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                filter === f ? "bg-leaf-800 text-white" : "text-ink-700 hover:bg-sand-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-sand-200 bg-white shadow-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-sand-100">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Site</th>
              <th className="px-5 py-3">Contents</th>
              <th className="px-5 py-3">Channel</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-ink-500">
                  Nothing matches that search.
                </td>
              </tr>
            )}
            {rows.map((o) => (
              <tr key={o.code} className="hover:bg-sand-50">
                <td className="px-5 py-4">
                  <Link
                    href={`/order/${o.code}`}
                    className="font-display text-base font-bold text-ink-950 underline underline-offset-4"
                  >
                    {o.code}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <span className="font-semibold text-ink-900">{o.customerName}</span>
                  <span className="block text-xs text-ink-500">{o.phone}</span>
                </td>
                <td className="px-5 py-4 capitalize text-ink-700">
                  {o.siteSlug.replace("-", " ")}
                </td>
                <td className="px-5 py-4 text-ink-700">
                  {o.items.map((i) => `${i.quantity} x ${itemLabel(i)}`).join(", ")}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      o.channel === "PAPER"
                        ? "bg-esrog-100 text-esrog-800"
                        : "bg-leaf-100 text-leaf-800"
                    }`}
                  >
                    {o.channel === "PAPER" ? `Paper, ${o.paymentMethod.toLowerCase()}` : "Online"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={o.status} />
                </td>
                <td className="tnum px-5 py-4 text-right font-semibold text-ink-950">
                  {money(o.totalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
