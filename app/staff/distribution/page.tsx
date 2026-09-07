"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/Ui";
import { LEVELS, SITES, getLevel } from "@/lib/data";
import { Order, itemLabel, money } from "@/lib/orders";
import { EMPTY_RESERVE, useStore } from "@/lib/staff-store";

export default function DistributionPage() {
  const { orders, ready, pickUp, undoPickup, recordExchange, markUnclaimed, reserveBySite, role, repSite } =
    useStore();
  const [chosenSite, setChosenSite] = useState<string>("baltimore");
  // A rep IS his site; the selector only exists for the admin. The server enforces this
  // regardless - a rep's requests are filtered by his cookie, not by this variable.
  const siteSlug = role === "rep" && repSite ? repSite : chosenSite;
  const setSiteSlug = setChosenSite;
  /** Reserve stock is held per site, as the spec models it: this table's own buffer. */
  const reserve = reserveBySite[siteSlug] ?? EMPTY_RESERVE;
  const [query, setQuery] = useState("");
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [exchangeFor, setExchangeFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  const siteOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.siteSlug === siteSlug && o.status !== "CANCELLED_REFUNDED",
      ),
    [orders, siteSlug],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return siteOrders;
    const digits = q.replace(/\D/g, "");
    return siteOrders.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (digits.length >= 3 && o.phone.replace(/\D/g, "").includes(digits)),
    );
  }, [siteOrders, query]);

  const active = activeCode ? orders.find((o) => o.code === activeCode) : undefined;

  const totalUnits = siteOrders.reduce(
    (s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0),
    0,
  );
  const pickedUnits = siteOrders.reduce(
    (s, o) => s + o.items.reduce((n, i) => n + i.qtyPickedUp, 0),
    0,
  );
  const outstanding = siteOrders.filter(
    (o) => o.status === "PAID" || o.status === "PARTIALLY_PICKED_UP",
  );

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  };

  if (!ready) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">Distribution Day</h1>
          <p className="mt-1 text-sm text-ink-700">
            Look up the person, confirm what he is entitled to, hand it over.
          </p>
        </div>
        {role === "rep" ? (
          <p className="rounded-lg bg-leaf-100 px-4 py-2.5 text-sm font-semibold text-leaf-900">
            {SITES.find((s) => s.slug === siteSlug)?.name ?? siteSlug}
          </p>
        ) : (
          <label className="text-sm">
            <span className="mr-2 font-semibold text-ink-900">Site</span>
            <select
              value={siteSlug}
              onChange={(e) => {
                setSiteSlug(e.target.value);
                setActiveCode(null);
              }}
              className="h-12 rounded-lg border border-sand-300 bg-white px-4 font-semibold text-ink-900 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
            >
              {SITES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* live progress */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Picked up" value={`${pickedUnits} of ${totalUnits}`} tone="dark" />
        <Stat label="Orders outstanding" value={String(outstanding.length)} />
        <Stat
          label="Reserve remaining"
          value={LEVELS.map(
            (l) => `${reserve[l.key].shipped - reserve[l.key].used}`,
          ).join(", ")}
          hint="A-A, A, Chinuch"
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
        {/* search + list */}
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Scan QR, or type code / name / phone"
            className="h-14 w-full rounded-lg border border-sand-300 bg-white px-5 text-lg text-ink-950 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
          />
          <p className="mt-2 text-[13px] text-ink-500">
            A camera scan lands here as a code. Typing works the same way.
          </p>

          <ul className="mt-4 max-h-[560px] divide-y divide-sand-200 overflow-y-auto rounded-xl border border-sand-200 bg-white">
            {results.length === 0 && (
              <li className="px-5 py-6 text-sm text-ink-500">No match at this site.</li>
            )}
            {results.map((o) => {
              const units = o.items.reduce((s, i) => s + i.quantity, 0);
              const picked = o.items.reduce((s, i) => s + i.qtyPickedUp, 0);
              return (
                <li key={o.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCode(o.code);
                      setExchangeFor(null);
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition ${
                      activeCode === o.code ? "bg-leaf-50" : "hover:bg-sand-50"
                    }`}
                  >
                    <span>
                      <span className="font-display text-lg font-bold text-ink-950">
                        {o.customerName}
                      </span>
                      <span className="block text-[13px] text-ink-500">
                        {o.code}, {o.phone}
                      </span>
                    </span>
                    <span
                      className={`tnum shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        picked >= units
                          ? "bg-leaf-100 text-leaf-900"
                          : picked > 0
                            ? "bg-esrog-200 text-esrog-900"
                            : "bg-sand-200 text-ink-700"
                      }`}
                    >
                      {picked}/{units}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* detail */}
        <div>
          {!active ? (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-sand-300 bg-white p-10 text-center text-ink-500">
              Pick a person from the list, or scan a code, to see exactly what he ordered, what he
              is entitled to, and what he paid.
            </div>
          ) : (
            <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-4xl font-bold text-ink-950">
                    {active.customerName}
                  </h2>
                  <p className="mt-1 text-ink-700">
                    {active.code}, {active.phone}
                    {active.shul && `, ${active.shul}`}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={active.status} />
                  <p className="tnum mt-2 font-display text-2xl font-bold text-ink-950">
                    {money(active.totalCents)}
                  </p>
                  <p className="text-[13px] text-ink-500">
                    {active.channel === "PAPER"
                      ? `Paper, ${active.paymentMethod.toLowerCase()} received`
                      : "Paid by card"}
                  </p>
                </div>
              </div>

              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
                Entitled to
              </p>
              <ul className="mt-3 space-y-3">
                {active.items.map((item) => {
                  const remaining = item.quantity - item.qtyPickedUp;
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-200 bg-sand-50 px-5 py-4"
                    >
                      <div>
                        <p className="font-display text-2xl font-bold text-ink-950">
                          {item.quantity} x {itemLabel(item)}
                        </p>
                        {item.qtyPickedUp > 0 && (
                          <p className="text-sm text-ink-700">
                            {item.qtyPickedUp} handed over, {remaining} remaining
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {remaining > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                pickUp(active.code, item.id, 1);
                                flash(`Handed over 1 x ${itemLabel(item)}`);
                              }}
                              className="flex h-12 items-center justify-center rounded-lg border-2 border-leaf-800 px-5 text-sm font-semibold text-leaf-900 transition hover:bg-leaf-800 hover:text-white"
                            >
                              Hand over 1
                            </button>
                            {remaining > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  pickUp(active.code, item.id, remaining);
                                  flash(`Handed over all ${remaining}`);
                                }}
                                className="flex h-12 items-center justify-center rounded-lg border-2 border-sand-300 px-5 text-sm font-semibold text-ink-900 transition hover:bg-sand-100"
                              >
                                All {remaining}
                              </button>
                            )}
                          </>
                        )}
                        {item.kind === "LEVEL" && (
                          <button
                            type="button"
                            onClick={() => setExchangeFor(exchangeFor === item.id ? null : item.id)}
                            className="flex h-12 items-center justify-center rounded-lg border-2 border-esrog-700 px-5 text-sm font-semibold text-esrog-800 transition hover:bg-esrog-700 hover:text-white"
                          >
                            Exchange
                          </button>
                        )}
                      </div>

                      {exchangeFor === item.id && item.kind === "LEVEL" && (
                        <ExchangePanel
                          levelName={getLevel(item.levelKey!).name}
                          available={
                            reserve[item.levelKey!].shipped - reserve[item.levelKey!].used
                          }
                          onConfirm={(note) => {
                            const ok = recordExchange(active.code, item.id, note);
                            setExchangeFor(null);
                            flash(
                              ok
                                ? "Exchange recorded and drawn from reserve stock."
                                : "Exchange recorded with an override - reserve for this level is exhausted.",
                            );
                          }}
                          onCancel={() => setExchangeFor(null)}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={active.status === "FULFILLED"}
                  onClick={() => {
                    active.items.forEach((i) =>
                      pickUp(active.code, i.id, i.quantity - i.qtyPickedUp),
                    );
                    flash(`${active.customerName} - order complete.`);
                  }}
                  className="flex h-16 flex-1 items-center justify-center rounded-lg bg-leaf-800 px-8 text-xl font-bold text-white transition hover:bg-leaf-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {active.status === "FULFILLED" ? "Already picked up" : "Mark as Picked Up"}
                </button>
                {active.status !== "PAID" && (
                  <button
                    type="button"
                    onClick={() => {
                      undoPickup(active.code);
                      flash("Pickup reversed.");
                    }}
                    className="flex h-16 items-center justify-center rounded-lg border-2 border-sand-300 px-6 text-sm font-semibold text-ink-900 transition hover:bg-sand-100"
                  >
                    Undo
                  </button>
                )}
                {active.status === "PAID" && (
                  <button
                    type="button"
                    onClick={() => {
                      markUnclaimed(active.code);
                      flash("Marked unclaimed for end-of-day follow-up.");
                    }}
                    className="flex h-16 items-center justify-center rounded-lg border-2 border-sand-300 px-6 text-sm font-semibold text-ink-900 transition hover:bg-sand-100"
                  >
                    Unclaimed
                  </button>
                )}
              </div>

              {active.exchanges.length > 0 && (
                <div className="mt-6 rounded-xl border border-esrog-300 bg-esrog-100 px-5 py-4 text-sm text-ink-900">
                  <p className="font-semibold">Exchange history</p>
                  {active.exchanges.map((ex, i) => (
                    <p key={i} className="mt-1 text-ink-700">
                      {ex.note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink-950 px-6 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "light",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={`rounded-xl px-5 py-4 shadow-card ${
        tone === "dark"
          ? "border border-leaf-200 bg-leaf-50 text-ink-950"
          : "border border-sand-200 bg-white text-ink-950"
      }`}
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
          tone === "dark" ? "text-leaf-800" : "text-esrog-800"
        }`}
      >
        {label}
      </p>
      <p className="tnum mt-1 font-display text-2xl font-bold">{value}</p>
      {hint && (
        <p className={`text-[13px] ${tone === "dark" ? "text-leaf-800/70" : "text-ink-500"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function ExchangePanel({
  levelName,
  available,
  onConfirm,
  onCancel,
}: {
  levelName: string;
  available: number;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("Motz ruled the item is not worth the price paid.");
  return (
    <div className="mt-3 w-full rounded-xl border border-esrog-300 bg-esrog-100 p-5">
      <p className="font-semibold text-ink-900">
        Exchange a {levelName} from reserve stock
      </p>
      <p className="mt-1 text-sm text-ink-700">
        {available > 0
          ? `${available} in reserve at this level.`
          : "Reserve for this level is exhausted - confirming records an override for the admin."}
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="mt-3 w-full rounded-lg border border-sand-300 bg-white px-4 py-2.5 text-sm text-ink-950 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(note)}
          className="flex h-11 items-center justify-center rounded-lg bg-esrog-700 px-5 text-sm font-semibold text-white transition hover:bg-esrog-800"
        >
          Confirm exchange
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 items-center justify-center rounded-lg border-2 border-sand-300 px-5 text-sm font-semibold text-ink-900 transition hover:bg-sand-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
