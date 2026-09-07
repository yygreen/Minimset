"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { GoldRule, QrBlock, StatusBadge, Stepper } from "@/components/Ui";
import {
  ADDONS,
  EXCHANGE_GUARANTEE,
  LEVELS,
  LevelKey,
  PARTNERSHIP_PARAGRAPH,
  SEASON,
  Site,
  getSite,
} from "@/lib/data";
import { Order, OrderItem, isPastDeadline, itemLabel, money, orderTotal } from "@/lib/orders";
import { useStore } from "@/lib/store";
import { Share } from "@/components/Share";
import { StripePay } from "@/components/StripePay";

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrderStatus />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="mx-auto min-h-[80vh] max-w-3xl px-4 py-24 text-center text-ink-500">
      Loading your order...
    </div>
  );
}

function OrderStatus() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const isNew = search.get("new") === "1";
  const code = (params?.code ?? "").toUpperCase();

  const { orders, ready, updateItems, cancelOrder } = useStore();
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  /**
   * The server holds the order; this device may also hold a copy from when it was placed.
   * The server wins when it answers, so the same code opens the same order on any phone.
   */
  const [remote, setRemote] = useState<Order | null>(null);
  const [asked, setAsked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!code) return;
    let live = true;
    fetch(`/api/orders/${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live) return;
        if (d?.order) setRemote(d.order as Order);
      })
      .catch(() => {})
      .finally(() => {
        if (live) setAsked(true);
      });
    return () => {
      live = false;
    };
  }, [code]);

  const local = orders.find((o) => o.code === code);
  const order = remote ?? local;
  const site = order ? getSite(order.siteSlug) : undefined;
  const closed = isPastDeadline();

  /**
   * A pending order means the card step was not finished (or the webhook has not landed yet).
   * Arriving fresh from Stripe's redirect, poll a few times for the webhook; either way offer
   * the retry, whose PaymentIntent is idempotent by code so a double press cannot double-pay.
   */
  const pendingPay = order?.status === "PENDING_PAYMENT";
  const [payInfo, setPayInfo] = useState<{ clientSecret: string; publishableKey: string } | null>(null);
  const [payStartErr, setPayStartErr] = useState("");
  useEffect(() => {
    if (!pendingPay || !isNew) return;
    let polls = 0;
    const id = window.setInterval(async () => {
      polls += 1;
      if (polls > 20) return window.clearInterval(id);
      try {
        const d = await fetch(`/api/orders/${encodeURIComponent(code)}`).then((r) => (r.ok ? r.json() : null));
        if (d?.order?.status && d.order.status !== "PENDING_PAYMENT") {
          setRemote(d.order as Order);
          window.clearInterval(id);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [pendingPay, isNew, code]);

  const startPayment = async () => {
    setPayStartErr("");
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(code)}/pay`, { method: "POST" });
      const d = (await res.json().catch(() => ({}))) as {
        clientSecret?: string;
        publishableKey?: string;
        error?: string;
      };
      if (!res.ok || !d.clientSecret || !d.publishableKey) {
        setPayStartErr(d.error || "The payment could not be started. Try again, or call your rep.");
        return;
      }
      setPayInfo({ clientSecret: d.clientSecret, publishableKey: d.publishableKey });
    } catch {
      setPayStartErr("We could not reach the server. Check your connection and try again.");
    }
  };

  if (!ready || (!asked && !local)) return <Loading />;

  if (!order || !site) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink-950">Order not found</h1>
        <p className="mt-4 text-ink-700">
          We could not find an order with the code <strong>{code}</strong>. Check the code on your
          confirmation, or call your community rep.
        </p>
        <Link
          href="/order"
          className="mt-8 inline-flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-semibold text-white transition hover:bg-leaf-900"
        >
          Try another code
        </Link>
      </div>
    );
  }

  const pickedUnits = order.items.reduce((s, i) => s + i.qtyPickedUp, 0);
  const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);
  const cancelled = order.status === "CANCELLED_REFUNDED";

  const pickupDate = new Date(`${site.distributionDateIso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10 lg:py-14">
      {/* (0) unpaid: finish the payment before anything celebrates */}
      {pendingPay && (
        <div className="mb-6 rounded-2xl border border-esrog-300 bg-esrog-100 p-6 sm:mb-8 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-900">
            {isNew ? "Confirming your payment" : "Payment not finished"}
          </p>
          <h1 className="mt-2 font-display text-[1.7rem] font-bold leading-tight text-ink-950 sm:text-[2rem]">
            {isNew ? "One moment - your payment is being confirmed." : "Your order is saved, but not yet paid."}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-900">
            {isNew
              ? "If this screen does not update within a minute, the card did not go through - you can complete the payment right here."
              : "The sets are only reserved once payment is complete. Finish it below; your order and code stay exactly as they are."}
          </p>
          {payInfo ? (
            <div className="mt-5">
              <StripePay
                publishableKey={payInfo.publishableKey}
                clientSecret={payInfo.clientSecret}
                returnUrl={`${window.location.origin}/order/${order.code}?new=1`}
                payLabel={`Pay ${money(order.totalCents)}`}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={startPayment}
              className="mt-5 flex h-14 w-full items-center justify-center rounded-lg bg-leaf-800 px-8 text-[16px] font-semibold text-white transition hover:bg-leaf-900 sm:w-auto"
            >
              Complete payment - {money(order.totalCents)}
            </button>
          )}
          {payStartErr && (
            <p role="alert" className="mt-3 rounded-lg bg-alert-50 px-4 py-3 text-[14px] text-alert-800">
              {payStartErr}
            </p>
          )}
        </div>
      )}

      {/* (1) success banner */}
      {isNew && !pendingPay && (
        <div className="mb-6 rounded-2xl border border-leaf-200 bg-leaf-50 p-6 sm:mb-8 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
            Payment received
          </p>
          <h1 className="mt-2 font-display text-[1.9rem] font-bold leading-tight text-ink-950 sm:text-[2.3rem]">
            You are in. Your set is reserved.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
            Thank you, {order.customerName.split(" ")[0]}, for partnering with us this Sukkos.
          </p>
          <p className="mt-3 text-[13px] text-ink-500">
            Your order is saved under code {order.code}. Keep this code: it opens this page on any
            phone. Emailed confirmations switch on once the operator connects their mail account.
          </p>
        </div>
      )}

      {/* (2) pickup code + QR */}
      <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
              Your pickup code
            </p>
            <p className="tnum mt-2 font-display text-[3rem] font-bold tracking-[0.12em] text-ink-950">
              {order.code}
            </p>
            <p className="mt-3 max-w-sm text-[14px] leading-snug text-ink-700">
              This is your card. Show it at pickup.
            </p>
          </div>
          <div className="rounded-xl border border-sand-200 bg-white p-3 shadow-card">
            <QrBlock code={order.code} size={140} />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* (4) contents */}
        <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink-950">What you ordered</h2>
            {!closed && !cancelled && (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-block py-1.5 text-[14px] font-semibold text-leaf-800 underline underline-offset-4"
              >
                {editing ? "Cancel edit" : "Change"}
              </button>
            )}
          </div>
          <div className="mt-3">
            <StatusBadge status={order.status} />
          </div>

          {order.status === "PARTIALLY_PICKED_UP" && (
            <p className="mt-4 rounded-lg bg-esrog-100 px-4 py-3 text-[14px] text-ink-900">
              {pickedUnits} of {totalUnits} items collected. The rest is still waiting for you at
              the table.
            </p>
          )}

          {editing ? (
            <Editor
              items={order.items}
              busy={busy}
              error={actionError}
              onSave={async (items) => {
                setBusy(true);
                setActionError("");
                const lines = items.map((i) =>
                  i.kind === "LEVEL"
                    ? { kind: "LEVEL", levelKey: i.levelKey, withPitom: i.withPitom, quantity: i.quantity }
                    : { kind: "ADDON", addOnId: i.addOnId, quantity: i.quantity },
                );
                try {
                  const res = await fetch(`/api/orders/${encodeURIComponent(order.code)}`, {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ lines }),
                  });
                  const data = (await res.json().catch(() => ({}))) as { order?: Order; error?: string };
                  if (!res.ok || !data.order) {
                    setActionError(data.error || "That change could not be saved. Please try again.");
                    setBusy(false);
                    return;
                  }
                  setRemote(data.order);
                  updateItems(order.code, data.order.items);
                  setEditing(false);
                } catch {
                  setActionError("We could not reach the server. Check your connection and try again.");
                }
                setBusy(false);
              }}
              onClose={() => setEditing(false)}
              originalTotal={order.totalCents}
            />
          ) : (
            <>
              <ul className="mt-4 divide-y divide-sand-200">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-3 py-3">
                    <span className="text-[14px] text-ink-900">
                      <strong className="font-semibold">{item.quantity} x</strong>{" "}
                      {itemLabel(item)}
                      {item.qtyPickedUp > 0 && (
                        <span className="ml-2 text-[12px] text-leaf-700">
                          ({item.qtyPickedUp} collected)
                        </span>
                      )}
                    </span>
                    <span className="tnum font-semibold text-ink-900">
                      {money(item.unitPriceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-baseline justify-between border-t-2 border-leaf-800 pt-3">
                <span className="font-display text-lg font-bold text-ink-950">
                  {cancelled ? "Refunded" : "Paid in full"}
                </span>
                <span className="tnum font-display text-xl font-bold text-ink-950">
                  {money(order.totalCents)}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-ink-500">
                {order.channel === "PAPER"
                  ? `Paper order, ${order.paymentMethod === "CASH" ? "cash" : "check"} received by the rep`
                  : "Paid by card"}
              </p>
            </>
          )}
        </section>

        {/* (3) pickup details */}
        <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
            Where and when
          </p>
          <p className="mt-2 font-display text-lg font-bold text-ink-950">
            {site.hostInstitution}
          </p>
          <p className="text-[14px] text-ink-700">
            {site.addressLines.join(", ")}
            <br />
            {site.city}, {site.state} {site.zip}
          </p>
          <GoldRule className="my-4" />
          <p className="text-[15px] text-ink-900">
            {pickupDate}
            <br />
            <strong className="font-semibold text-ink-950">
              {site.windowStart} to {site.windowEnd}
            </strong>
          </p>
          <a
            href={pickupIcs(site, order.code)}
            download={`pickup-${order.code}.ics`}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg border-2 border-leaf-800 px-4 text-[14px] font-semibold text-leaf-900 transition hover:bg-leaf-800 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add pickup to my calendar
          </a>
          <p className="mt-4 text-[14px] text-ink-700">
            Rep: {site.repName} -{" "}
            <a
              href={`tel:${site.repPhone.replace(/\D/g, "")}`}
              className="inline-block py-1 font-semibold text-leaf-800 underline underline-offset-2"
            >
              {site.repPhone}
            </a>
          </p>
        </section>
      </div>

      {/* (5) partnership paragraph */}
      <section className="mt-6 rounded-2xl bg-esrog-100 p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-900">
          Your partnership
        </p>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-900">{PARTNERSHIP_PARAGRAPH}</p>
      </section>

      {/* (6) exchange guarantee */}
      <section className="mt-6 rounded-2xl border border-leaf-200 bg-leaf-50 p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
          The Motz guarantee
        </p>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-900">{EXCHANGE_GUARANTEE}</p>
        {order.exchanges.length > 0 && (
          <div className="mt-5 border-t border-leaf-200 pt-5">
            <p className="text-[14px] font-semibold text-leaf-800">Exchange on record</p>
            {order.exchanges.map((ex, i) => (
              <p key={i} className="mt-1 text-[14px] text-ink-700">
                {ex.note}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* (7) edit / cancel controls */}
      <section className="mt-6 rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
        {cancelled ? (
          <p className="text-[14px] text-ink-700">
            This order was cancelled and refunded in full. To order again, start a new order for{" "}
            <Link
              href={`/${site.slug}/order`}
              className="font-semibold text-leaf-800 underline underline-offset-2"
            >
              {site.name}
            </Link>
            .
          </p>
        ) : closed ? (
          <p className="text-[14px] text-ink-700">
            The deadline has passed and the shipment is packed against these totals. For any
            change, speak to {site.repName} at {site.repPhone}.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-lg text-[14px] text-ink-700">
              You can change or cancel this order yourself until{" "}
              <strong className="font-semibold text-ink-950">{SEASON.deadlineLabelEt}</strong>.
              Cancelling refunds the full amount.
            </p>
            {confirmCancel ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setActionError("");
                    try {
                      const res = await fetch(`/api/orders/${encodeURIComponent(order.code)}`, {
                        method: "DELETE",
                      });
                      const data = (await res.json().catch(() => ({}))) as { order?: Order; error?: string };
                      if (!res.ok || !data.order) {
                        setActionError(data.error || "That order could not be cancelled. Call your rep.");
                        setBusy(false);
                        return;
                      }
                      setRemote(data.order);
                      cancelOrder(order.code);
                    } catch {
                      setActionError("We could not reach the server. Check your connection and try again.");
                    }
                    setBusy(false);
                  }}
                  className="flex h-13 items-center justify-center rounded-lg bg-alert-800 px-5 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? "Cancelling..." : `Yes, cancel and refund ${money(order.totalCents)}`}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="flex h-13 items-center justify-center rounded-lg border-2 border-sand-300 px-5 text-[14px] font-semibold text-ink-700 transition hover:border-ink-500"
                >
                  Keep it
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="flex h-13 items-center justify-center rounded-lg border-2 border-alert-800 px-5 text-[14px] font-semibold text-alert-800 transition hover:bg-alert-800 hover:text-white"
              >
                Cancel my order
              </button>
            )}
          </div>
        )}
        {actionError && !editing && (
          <p role="alert" className="mt-4 rounded-lg bg-alert-50 px-4 py-3 text-[14px] text-alert-800">
            {actionError}
          </p>
        )}
      </section>

      {/* (8) share / copy link */}
      <ShareRow code={order.code} />

      {/* (9) pass the program on */}
      <section data-noprint className="mt-6 rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Pass it on</p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
          Know a family in {site.name} that still needs a set? Send them the {site.name} page.
        </p>
        <div className="mt-4">
          <Share
            compact
            stretch
            path={`/${site.slug}`}
            label="WhatsApp"
            copyLabel="Copy page link"
            text={`Arba Minim for ${site.name}: Rav-inspected sets from $40, pick up at ${site.hostInstitution} after Yom Kippur.`}
          />
        </div>
      </section>
    </div>
  );
}

/* ---------------- share / copy link row ---------------- */

/** Pickup-day reminder as an .ics data URL; opens the phone's calendar, no server involved. */
function pickupIcs(site: Site, code: string): string {
  const d = site.distributionDateIso.replace(/-/g, "");
  const toHm = (t: string) => {
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return "100000";
    let h = Number(m[1]) % 12;
    if (/pm/i.test(m[3])) h += 12;
    return `${String(h).padStart(2, "0")}${m[2]}00`;
  };
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//V'samachta Arba Minim//4minimset.com//EN",
    "BEGIN:VEVENT",
    `UID:pickup-${code}@4minimset.com`,
    `DTSTART:${d}T${toHm(site.windowStart)}`,
    `DTEND:${d}T${toHm(site.windowEnd)}`,
    `SUMMARY:Pick up Arba Minim (code ${code})`,
    `LOCATION:${site.hostInstitution}, ${site.addressLines.join(", ")}, ${site.city}, ${site.state} ${site.zip}`,
    `DESCRIPTION:Show your code ${code} at the table. https://4minimset.com/order/${code}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"));
}

function ShareRow({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/order/${code}` : `/order/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available in this browser - no-op
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand-200 bg-white p-5 shadow-card">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
          Save this page
        </p>
        <p className="mt-1 text-[14px] text-ink-700">
          Copy your order link so you can find your code again.
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="flex h-11 items-center justify-center rounded-lg border-2 border-leaf-800 px-5 text-[14px] font-semibold text-leaf-900 transition hover:bg-leaf-800 hover:text-white"
      >
        {copied ? "Order link copied" : "Copy my order link"}
      </button>
    </div>
  );
}

/* ---------------- inline editor ---------------- */

function Editor({
  items,
  onSave,
  onClose,
  originalTotal,
  busy = false,
  error = "",
}: {
  items: OrderItem[];
  onSave: (items: OrderItem[]) => void;
  onClose: () => void;
  originalTotal: number;
  busy?: boolean;
  error?: string;
}) {
  const initialQty = useMemo(() => {
    const q: Record<string, number> = {};
    for (const item of items) {
      q[item.kind === "LEVEL" ? item.levelKey! : item.addOnId!] = item.quantity;
    }
    return q;
  }, [items]);

  const pitomInitial = items.find((i) => i.levelKey === "MEHUDAR_AA")?.withPitom ?? true;
  const [qty, setQty] = useState<Record<string, number>>(initialQty);
  const [pitom, setPitom] = useState(pitomInitial);

  const nextItems: OrderItem[] = useMemo(() => {
    const out: OrderItem[] = [];
    for (const level of LEVELS) {
      const n = qty[level.key] ?? 0;
      if (!n) continue;
      const withPitom = level.key === "MEHUDAR_AA" ? pitom : false;
      const existing = items.find((i) => i.levelKey === level.key);
      out.push({
        id: existing?.id ?? `it_${level.key.toLowerCase()}`,
        kind: "LEVEL",
        levelKey: level.key as LevelKey,
        withPitom,
        quantity: n,
        unitPriceCents:
          level.basePriceCents +
          (withPitom && level.pitomSurchargeCents ? level.pitomSurchargeCents : 0),
        qtyPickedUp: Math.min(existing?.qtyPickedUp ?? 0, n),
      });
    }
    for (const addon of ADDONS) {
      const n = qty[addon.id] ?? 0;
      if (!n) continue;
      const existing = items.find((i) => i.addOnId === addon.id);
      out.push({
        id: existing?.id ?? `it_${addon.id}`,
        kind: "ADDON",
        addOnId: addon.id,
        withPitom: false,
        quantity: n,
        unitPriceCents: addon.priceCents,
        qtyPickedUp: Math.min(existing?.qtyPickedUp ?? 0, n),
      });
    }
    return out;
  }, [qty, pitom, items]);

  const newTotal = orderTotal(nextItems);
  const delta = newTotal - originalTotal;
  const sets = nextItems.filter((i) => i.kind === "LEVEL").reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="mt-4">
      <ul className="space-y-3">
        {LEVELS.map((level) => (
          <li key={level.key} className="flex items-center justify-between gap-3">
            <span className="text-[14px] text-ink-900">
              {level.name}
              <span className="ml-2 text-[12px] text-ink-500">
                {money(
                  level.basePriceCents +
                    (level.key === "MEHUDAR_AA" && pitom ? (level.pitomSurchargeCents ?? 0) : 0),
                )}
              </span>
            </span>
            <Stepper
              value={qty[level.key] ?? 0}
              onChange={(n) => setQty({ ...qty, [level.key]: n })}
              label={level.name}
            />
          </li>
        ))}
        {ADDONS.map((addon) => (
          <li key={addon.id} className="flex items-center justify-between gap-3">
            <span className="text-[14px] text-ink-700">
              {addon.name}
              <span className="ml-2 text-[12px] text-ink-500">{money(addon.priceCents)}</span>
            </span>
            <Stepper
              value={qty[addon.id] ?? 0}
              onChange={(n) => setQty({ ...qty, [addon.id]: n })}
              max={10}
              label={addon.name}
            />
          </li>
        ))}
      </ul>

      {(qty.MEHUDAR_AA ?? 0) > 0 && (
        <div className="mt-4 flex items-center gap-2 text-[14px]">
          <span className="text-ink-700">Pitom on the A-A:</span>
          <button
            type="button"
            onClick={() => setPitom(!pitom)}
            className="rounded-lg border-2 border-leaf-800 px-4 py-1.5 text-[13px] font-semibold text-leaf-900 transition hover:bg-leaf-800 hover:text-white"
          >
            {pitom ? "With pitom" : "Without pitom"}
          </button>
        </div>
      )}

      <div className="mt-5 rounded-lg bg-sand-100 px-4 py-3 text-[14px]">
        <div className="flex justify-between">
          <span className="text-ink-700">New total</span>
          <span className="tnum font-semibold text-ink-950">{money(newTotal)}</span>
        </div>
        {delta !== 0 && (
          <p className="mt-1 text-ink-700">
            {delta > 0
              ? `${money(delta)} will be charged to your card.`
              : `${money(Math.abs(delta))} will be refunded to your card.`}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-alert-50 px-4 py-3 text-[14px] text-alert-800">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-12 items-center justify-center rounded-lg border-2 border-sand-300 px-5 text-[14px] font-semibold text-ink-700 transition hover:border-ink-500"
        >
          Discard
        </button>
        <button
          type="button"
          disabled={sets === 0 || busy}
          onClick={() => onSave(nextItems)}
          className="flex h-12 flex-1 items-center justify-center rounded-lg bg-leaf-800 px-6 text-[14px] font-semibold text-white transition hover:bg-leaf-900 disabled:opacity-40"
        >
          {busy ? "Saving..." : sets === 0 ? "Keep at least one set" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
