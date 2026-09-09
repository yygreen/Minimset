"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/Ui";
import { itemLabel, money, type Order } from "@/lib/orders";
import { useStore } from "@/lib/staff-store";

/**
 * The packing screen. It replaced the distribution-day card system when the program moved
 * from four Beis Medrash tables to shipping: the job is no longer "find the man in front of
 * you", it is "pack this box, write the address, record the tracking number".
 *
 * Optimistic on purpose. The person packing is holding a box, not watching a spinner.
 */
const TABS = ["To pack", "Shipped", "All"] as const;
type Tab = (typeof TABS)[number];

const CARRIERS = ["UPS", "FedEx", "USPS", "DHL"];

export default function FulfillmentPage() {
  const { orders, ready, error, markShipped, markDelivered, undoShipment } = useStore();
  const [tab, setTab] = useState<Tab>("To pack");
  const [query, setQuery] = useState("");
  const [openCode, setOpenCode] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return orders
      .filter((o) => o.status !== "CANCELLED_REFUNDED" && o.status !== "PENDING_PAYMENT")
      .filter((o) => {
        if (tab === "To pack") return o.status === "PAID";
        if (tab === "Shipped") return o.status === "SHIPPED" || o.status === "DELIVERED";
        return true;
      })
      .filter((o) => {
        if (!q) return true;
        return (
          o.code.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.address.city.toLowerCase().includes(q) ||
          o.address.zip.startsWith(q) ||
          (o.trackingNumber ?? "").toLowerCase().includes(q) ||
          (digits.length >= 3 && o.phone.replace(/\D/g, "").includes(digits))
        );
      });
  }, [orders, tab, query]);

  const toPack = orders.filter((o) => o.status === "PAID").length;

  if (!ready) {
    return <div className="mx-auto max-w-5xl px-4 py-24 text-ink-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-ink-950">Fulfilment</h1>
      <p className="mt-1 text-sm text-ink-700">
        {toPack} {toPack === 1 ? "order" : "orders"} still to pack.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-alert-100 px-4 py-3 text-[14px] text-alert-800">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Code, name, phone, town, ZIP or tracking"
          className="h-13 min-w-[240px] flex-1 rounded-lg border border-sand-300 bg-white px-4 text-[17px] text-ink-950 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
        />
        <div className="flex flex-wrap gap-1 rounded-lg border border-sand-300 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                tab === t ? "bg-leaf-800 text-white" : "text-ink-700 hover:bg-sand-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {rows.length === 0 && (
          <li className="rounded-2xl border border-sand-200 bg-white px-5 py-10 text-center text-ink-500 shadow-card">
            Nothing here.
          </li>
        )}
        {rows.map((order) => (
          <OrderCard
            key={order.code}
            order={order}
            open={openCode === order.code}
            onToggle={() => setOpenCode(openCode === order.code ? null : order.code)}
            onShip={(carrier, tracking) => {
              markShipped(order.code, carrier, tracking);
              setOpenCode(null);
            }}
            onDelivered={() => markDelivered(order.code)}
            onUndo={() => undoShipment(order.code)}
          />
        ))}
      </ul>
    </div>
  );
}

function OrderCard({
  order,
  open,
  onToggle,
  onShip,
  onDelivered,
  onUndo,
}: {
  order: Order;
  open: boolean;
  onToggle: () => void;
  onShip: (carrier: string, tracking: string) => void;
  onDelivered: () => void;
  onUndo: () => void;
}) {
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [tracking, setTracking] = useState("");
  const a = order.address;
  const sets = order.items
    .filter((i) => i.kind === "LEVEL")
    .reduce((n, i) => n + i.quantity, 0);
  const canShip = tracking.trim().length >= 4;

  /* The whole address as one block, so it can be selected and pasted into a label
     tool in one go rather than field by field. */
  const addressBlock = [
    order.customerName,
    a.line1,
    a.line2,
    `${a.city}, ${a.state} ${a.zip}`,
    order.phone,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <li className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 text-left hover:bg-sand-50"
      >
        <span className="tnum font-display text-xl font-bold text-ink-950">{order.code}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink-900">{order.customerName}</span>
          <span className="block text-[13px] text-ink-500">
            {a.city}, {a.state} {a.zip} &middot; {sets} {sets === 1 ? "set" : "sets"}
          </span>
        </span>
        {order.trackingNumber && (
          <span className="tnum text-[12px] text-ink-500">
            {order.carrier} {order.trackingNumber}
          </span>
        )}
        <StatusBadge status={order.status} />
      </button>

      {open && (
        <div className="border-t border-sand-200 bg-sand-50 px-5 py-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
                Ship to
              </p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-ink-950">
                {addressBlock}
              </pre>
              {order.email && <p className="mt-1 text-[13px] text-ink-500">{order.email}</p>}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
                In the box
              </p>
              <ul className="mt-2 space-y-1 text-[15px] text-ink-900">
                {order.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>
                      {i.quantity} x {itemLabel(i)}
                    </span>
                    <span className="tnum text-ink-500">
                      {money(i.unitPriceCents * i.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-sand-200 pt-2 text-[14px] text-ink-700">
                Paid {money(order.totalCents)}
                {order.shippingCents > 0 && ` (incl. ${money(order.shippingCents)} shipping)`}
              </p>
            </div>
          </div>

          {order.notes && (
            <p className="mt-4 rounded-lg bg-esrog-100 px-4 py-3 text-[14px] text-ink-900">
              Note: {order.notes}
            </p>
          )}

          {order.status === "PAID" ? (
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="text-[13px] font-semibold text-ink-900">Carrier</span>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="mt-1 block h-12 rounded-lg border border-sand-300 bg-white px-3 font-semibold text-ink-900 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
                >
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-[200px] flex-1">
                <span className="text-[13px] font-semibold text-ink-900">Tracking number</span>
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="1Z999AA10123456784"
                  className="mt-1 h-12 w-full rounded-lg border border-sand-300 bg-white px-3 text-[16px] text-ink-950 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
                />
              </label>
              <button
                type="button"
                disabled={!canShip}
                onClick={() => onShip(carrier, tracking.trim())}
                className="flex h-12 items-center justify-center rounded-lg bg-leaf-800 px-6 text-[15px] font-semibold text-white transition hover:bg-leaf-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Mark shipped
              </button>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-3">
              {order.status === "SHIPPED" && (
                <button
                  type="button"
                  onClick={onDelivered}
                  className="flex h-12 items-center justify-center rounded-lg bg-leaf-800 px-6 text-[15px] font-semibold text-white transition hover:bg-leaf-900"
                >
                  Mark delivered
                </button>
              )}
              <button
                type="button"
                onClick={onUndo}
                className="flex h-12 items-center justify-center rounded-lg border-2 border-sand-300 px-5 text-[15px] font-semibold text-ink-700 transition hover:border-ink-500"
              >
                Undo shipment
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
