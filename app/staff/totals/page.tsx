"use client";

import { useMemo } from "react";
import { SEASON, getLevel } from "@/lib/data";
import { addOnTotals, grandRevenue, isLive, itemLabel, levelTotals, money } from "@/lib/orders";
import { useStore } from "@/lib/staff-store";

export default function TotalsPage() {
  const { orders, ready } = useStore();

  const live = useMemo(() => orders.filter(isLive), [orders]);
  const totals = useMemo(() => levelTotals(orders), [orders]);
  const addons = useMemo(() => addOnTotals(orders), [orders]);

  const totalSets = totals.reduce((s, t) => s + t.sets, 0);
  const extraHadassim = addons.find((a) => a.id === "extra-hadassim")?.qty ?? 0;
  const extraAravos = addons.find((a) => a.id === "extra-aravos")?.qty ?? 0;

  /* Where the boxes go. Not a business unit any more, just the shape of the shipment. */
  const byState = useMemo(() => {
    const map = new Map<string, { state: string; orders: number; sets: number; revenue: number }>();
    for (const o of live) {
      const key = o.address?.state || "??";
      const row = map.get(key) ?? { state: key, orders: 0, sets: 0, revenue: 0 };
      row.orders += 1;
      row.revenue += o.totalCents;
      row.sets += o.items
        .filter((i) => i.kind === "LEVEL")
        .reduce((n, i) => n + i.quantity, 0);
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => b.sets - a.sets);
  }, [live]);

  const exportCsv = () => {
    const rows: string[][] = [
      [
        "Code", "Name", "Phone", "Email",
        "Address 1", "Address 2", "City", "State", "ZIP",
        "Status", "Carrier", "Tracking",
        "Contents", "Shipping USD", "Total USD",
      ],
    ];
    for (const o of live) {
      rows.push([
        o.code,
        o.customerName,
        o.phone,
        o.email,
        o.address.line1,
        o.address.line2,
        o.address.city,
        o.address.state,
        o.address.zip,
        o.status,
        o.carrier ?? "",
        o.trackingNumber ?? "",
        o.items.map((i) => `${i.quantity} x ${itemLabel(i)}`).join("; "),
        ((o.shippingCents ?? 0) / 100).toFixed(2),
        (o.totalCents / 100).toFixed(2),
      ]);
    }
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vsamachta-packing-${SEASON.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!ready) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">HQ Totals</h1>
          <p className="mt-1 text-sm text-ink-700">
            {SEASON.name}, the sheet you pull the moment the deadline passes.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="flex h-12 items-center justify-center rounded-lg bg-leaf-800 px-6 text-sm font-semibold text-white transition hover:bg-leaf-900"
        >
          Export packing and address sheet (CSV)
        </button>
      </div>

      {/* headline numbers */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Big label="Orders" value={String(live.length)} />
        <Big label="Complete sets" value={String(totalSets)} tone="dark" />
        <Big label="Esrogim" value={String(totalSets)} />
        <Big label="Revenue" value={money(grandRevenue(orders))} tone="gold" />
      </div>

      {/* packing counts */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-ink-950">Packing counts</h2>
        <p className="mt-1 text-sm text-ink-700">
          What HQ hands to the packers. Every set is one esrog, one lulav, one hadassim bundle and
          one aravos bundle; add-ons stack on top.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Count label="Lulavim" value={totalSets} note="one per set" />
          <Count
            label="Hadassim bundles"
            value={totalSets + extraHadassim}
            note={`${totalSets} in sets + ${extraHadassim} extra`}
          />
          <Count
            label="Aravos bundles"
            value={totalSets + extraAravos}
            note={`${totalSets} in sets + ${extraAravos} extra`}
          />
          <Count
            label="Koishiklach"
            value={addons.find((a) => a.id === "koishiklach")?.qty ?? 0}
            note="add-on only"
          />
        </div>
      </section>

      {/* per level */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-ink-950">By level</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-sand-200 bg-white shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-sand-100 text-left">
              <tr className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3 text-right">With pitom</th>
                <th className="px-5 py-3 text-right">Without pitom</th>
                <th className="px-5 py-3 text-right">Sets</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {totals.map((t) => {
                const level = getLevel(t.levelKey);
                return (
                  <tr key={t.levelKey}>
                    <td className="px-5 py-4">
                      <span className="font-display text-lg font-bold text-ink-950">
                        {level.name}
                      </span>
                      <span className="ml-2 text-xs text-ink-500">
                        {money(level.basePriceCents)}
                        {level.pitomSurchargeCents
                          ? ` / ${money(level.basePriceCents + level.pitomSurchargeCents)}`
                          : ""}
                      </span>
                    </td>
                    <td className="tnum px-5 py-4 text-right">
                      {level.pitomSurchargeCents ? t.withPitom : "-"}
                    </td>
                    <td className="tnum px-5 py-4 text-right">{t.withoutPitom}</td>
                    <td className="tnum px-5 py-4 text-right font-display text-lg font-bold text-ink-950">
                      {t.sets}
                    </td>
                    <td className="tnum px-5 py-4 text-right">{money(t.revenueCents)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-ink-950 bg-sand-100 text-ink-950">
              <tr>
                <td className="px-5 py-4 font-display text-lg font-bold">Total</td>
                <td className="tnum px-5 py-4 text-right">
                  {totals.reduce((s, t) => s + t.withPitom, 0)}
                </td>
                <td className="tnum px-5 py-4 text-right">
                  {totals.reduce((s, t) => s + t.withoutPitom, 0)}
                </td>
                <td className="tnum px-5 py-4 text-right font-display text-lg font-bold">
                  {totalSets}
                </td>
                <td className="tnum px-5 py-4 text-right">
                  {money(totals.reduce((s, t) => s + t.revenueCents, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* where it ships */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-ink-950">Where it ships</h2>
        <p className="mt-1 text-sm text-ink-700">
          Orders and sets by state, heaviest first. Useful for sanity-checking postage before the
          labels are bought.
        </p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-sand-200 bg-white shadow-card">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-sand-100 text-left">
              <tr className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                <th className="px-5 py-3">State</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Sets</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {byState.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-ink-500">
                    No orders yet.
                  </td>
                </tr>
              )}
              {byState.map((row) => (
                <tr key={row.state}>
                  <td className="px-5 py-3.5 font-display text-lg font-bold text-ink-950">
                    {row.state}
                  </td>
                  <td className="tnum px-5 py-3.5 text-right">{row.orders}</td>
                  <td className="tnum px-5 py-3.5 text-right font-semibold text-ink-950">
                    {row.sets}
                  </td>
                  <td className="tnum px-5 py-3.5 text-right">{money(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* add-ons */}
      <section className="mt-10 rounded-2xl border border-sand-200 bg-sand-100 p-6">
        <h2 className="font-display text-xl font-bold text-ink-950">Add-ons ordered</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {addons.map((a) => (
            <li key={a.id} className="flex items-baseline justify-between rounded-lg border border-sand-200 bg-white px-4 py-3">
              <span className="text-sm text-ink-700">{a.name}</span>
              <span className="tnum font-display text-xl font-bold text-ink-950">
                {a.qty}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Big({
  label,
  value,
  tone = "light",
}: {
  label: string;
  value: string;
  tone?: "light" | "dark" | "gold";
}) {
  const cls =
    tone === "dark"
      ? "border border-leaf-200 bg-leaf-50 text-ink-950"
      : tone === "gold"
        ? "border border-esrog-300 bg-esrog-100 text-ink-950"
        : "border border-sand-200 bg-white text-ink-950";
  const labelCls =
    tone === "dark" ? "text-leaf-800" : tone === "gold" ? "text-esrog-900" : "text-esrog-800";
  return (
    <div className={`rounded-xl px-6 py-5 shadow-card ${cls}`}>
      <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${labelCls}`}>{label}</p>
      <p className="tnum mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function Count({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-xl border border-sand-200 bg-white px-6 py-5 shadow-card">
      <p className="tnum font-display text-3xl font-bold text-ink-950">{value}</p>
      <p className="mt-1 font-semibold text-ink-900">{label}</p>
      <p className="text-[13px] text-ink-500">{note}</p>
    </div>
  );
}
