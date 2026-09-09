"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Stepper } from "@/components/Ui";
import {
  ADDONS,
  EXCHANGE_GUARANTEE,
  LEVELS,
  LevelKey,
  SEASON,
  SHIPPING,
  shippingLabel,
} from "@/lib/data";
import { IMG, type Photo } from "@/lib/images";
import {
  Address,
  Order,
  OrderItem,
  isPastDeadline,
  itemLabel,
  money,
  orderTotal,
} from "@/lib/orders";
import { useStore } from "@/lib/store";
import { StripePay } from "@/components/StripePay";

type Step = 0 | 1 | 2 | 3;

const STEP_LABELS = ["Your sets", "Delivery details", "Review", "Payment"];

const EMPTY_QTY: Record<LevelKey, number> = {
  MEHUDAR_AA: 0,
  MEHUDAR_A: 0,
  CHINUCH: 0,
};

const THUMB: Record<LevelKey, Photo> = {
  MEHUDAR_AA: IMG.levelAA,
  MEHUDAR_A: IMG.levelA,
  CHINUCH: IMG.levelChinuch,
};

const WHO: Record<LevelKey, string> = {
  MEHUDAR_AA: "The finest in the program",
  MEHUDAR_A: "The level most balabatim choose",
  CHINUCH: "For every boy, his own set",
};

/* Deliberately not a dropdown of fifty. A short text field the customer's own
   autofill can complete beats a select they have to scroll. Validated as two
   letters, uppercased on the way out. */
const STATE_RE = /^[A-Za-z]{2}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;

export function OrderFlow() {
  const router = useRouter();
  const { placeOrder } = useStore();

  const [step, setStep] = useState<Step>(0);
  const [qty, setQty] = useState<Record<LevelKey, number>>({ ...EMPTY_QTY });
  const [pitom, setPitom] = useState(true);
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  /* The level the visitor picked before they got here. It leads the list and is
     marked as theirs; the other two follow as alternatives and as the upsell
     that matters most -- a Chinuch set for each boy. */
  const [preselected, setPreselected] = useState<LevelKey | null>(null);

  // ?level=KEY from a product page or a homepage card pre-selects one set of that level.
  // Read after mount so the page itself stays static (edge-cached) and fully server-rendered.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("level") as LevelKey | null;
    if (key && LEVELS.some((l) => l.key === key)) {
      setQty((q) => (Object.values(q).some((n) => n > 0) ? q : { ...EMPTY_QTY, [key]: 1 }));
      setPreselected(key);
    }
  }, []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [touched, setTouched] = useState(false);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  /**
   * Issued by the server when the payment step opens. It carries the server's own clock, so a
   * cart that genuinely reached payment before the deadline may still finish inside the grace
   * window. Absent (offline, or the season closed) simply means no grace.
   */
  const [ticket, setTicket] = useState("");
  /** Set when the server has a real processor: the preview fields give way to Stripe. */
  const [payLive, setPayLive] = useState(false);
  const [pubKey, setPubKey] = useState("");
  /** Live mode only: the pending order awaiting its card. */
  const [pending, setPending] = useState<{ code: string; clientSecret: string } | null>(null);

  useEffect(() => {
    if (step !== 3 || ticket) return;
    let live = true;
    fetch("/api/checkout/start", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live || !d?.ticket) return;
        setTicket(d.ticket as string);
        if (d.paymentsLive && d.publishableKey) {
          setPayLive(true);
          setPubKey(d.publishableKey as string);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [step, ticket]);

  const closed = isPastDeadline();

  const items: OrderItem[] = useMemo(() => {
    const out: OrderItem[] = [];
    for (const level of LEVELS) {
      const n = qty[level.key];
      if (!n) continue;
      const withPitom = level.key === "MEHUDAR_AA" ? pitom : false;
      const unit =
        level.basePriceCents +
        (withPitom && level.pitomSurchargeCents ? level.pitomSurchargeCents : 0);
      out.push({
        id: `it_${level.key.toLowerCase()}`,
        kind: "LEVEL",
        levelKey: level.key,
        withPitom,
        quantity: n,
        unitPriceCents: unit,
      });
    }
    for (const addon of ADDONS) {
      const n = addonQty[addon.id] ?? 0;
      if (!n) continue;
      out.push({
        id: `it_${addon.id}`,
        kind: "ADDON",
        addOnId: addon.id,
        withPitom: false,
        quantity: n,
        unitPriceCents: addon.priceCents,
      });
    }
    return out;
  }, [qty, pitom, addonQty]);

  const subtotal = orderTotal(items);
  /* Null means the rate is not agreed yet, so the site names no figure and the
     total it shows is explicitly "before shipping". It never invents a price. */
  const shipCents = SHIPPING.flatRateCents;
  /* An empty cart is not a $7.99 order. Shipping only exists once there is a box
     to put in the post, so the rail reads $0 until something is chosen. */
  const shipApplied = items.length > 0 ? (shipCents ?? 0) : 0;
  const total = subtotal + shipApplied;
  const setCount = items.filter((i) => i.kind === "LEVEL").reduce((s, i) => s + i.quantity, 0);

  const emailOk = email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const nameOk = name.trim().length > 1;
  const phoneOk = phone.replace(/\D/g, "").length >= 10;
  const line1Ok = line1.trim().length > 3;
  const cityOk = city.trim().length > 1;
  const stateOk = STATE_RE.test(state.trim());
  const zipOk = ZIP_RE.test(zip.trim());
  const detailsValid =
    nameOk && phoneOk && emailOk && line1Ok && cityOk && stateOk && zipOk;

  const address: Address = {
    line1: line1.trim(),
    line2: line2.trim(),
    city: city.trim(),
    state: state.trim().toUpperCase(),
    zip: zip.trim(),
  };

  /* ---------------- deadline closed ---------------- */
  if (closed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink-950">Ordering is closed</h1>
        <p className="mt-4 text-ink-700">
          The deadline passed on {SEASON.deadlineLabelEt}. The shipment is packed against the
          totals, so no further orders can be accepted this season.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-13 items-center rounded-lg bg-leaf-800 px-7 font-semibold text-white"
        >
          Back to the program
        </Link>
      </div>
    );
  }

  /* ---------------- payment ---------------- */
  /**
   * The order is written by the server, which prices the cart itself, allocates the code and
   * enforces the deadline. The browser is only allowed to say what was chosen. On failure the
   * customer is told the truth: no confirmation screen for an order nobody received.
   */
  const submitPayment = async () => {
    setPayError("");
    setPaying(true);

    const lines = items.map((i) =>
      i.kind === "LEVEL"
        ? { kind: "LEVEL" as const, levelKey: i.levelKey, withPitom: i.withPitom, quantity: i.quantity }
        : { kind: "ADDON" as const, addOnId: i.addOnId, quantity: i.quantity },
    );

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines,
          customerName: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address,
          ticket,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
        clientSecret?: string;
        error?: string;
        message?: string;
      };

      if (!res.ok || !data.code) {
        setPaying(false);
        setPayError(
          data.message ||
            data.error ||
            "We could not place the order just now. Please try again in a moment.",
        );
        return;
      }

      // Live processor: the order is saved as PENDING_PAYMENT and the card is collected by
      // Stripe's own element. The webhook flips it to PAID; the browser never does.
      if (payLive && data.clientSecret) {
        setPaying(false);
        setPending({ code: data.code, clientSecret: data.clientSecret });
        return;
      }
      if (payLive && !data.clientSecret) {
        // Order exists but the intent could not be created; send them to the retry path.
        router.push(`/order/${data.code}?new=1`);
        return;
      }

      // Keep a local copy so the confirmation works instantly and the code survives a refresh.
      placeOrder({
        code: data.code,
        status: "PAID",
        customerName: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address,
        items,
        shippingCents: shipApplied,
        totalCents: total,
        paymentMethod: "CARD",
        createdAt: new Date().toISOString(),
        notes: "",
        exchanges: [],
      } satisfies Order);
      router.push(`/order/${data.code}?new=1`);
    } catch {
      setPaying(false);
      setPayError("We could not reach the server. Check your connection and try again.");
    }
  };

  /* Chosen level first, the rest in their normal order behind it. */
  const orderedLevels = preselected
    ? [...LEVELS].sort((a, b) => Number(b.key === preselected) - Number(a.key === preselected))
    : LEVELS;

  const goDetails = () => setStep(1);
  const goReview = () => {
    setTouched(true);
    if (detailsValid) setStep(2);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:pb-16 lg:pt-10">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/" className="inline-block py-1 text-[14px] text-ink-500 hover:text-leaf-800">
            Back to the program
          </Link>
          <h1 className="mt-1.5 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
            Order your sets
          </h1>
          <p className="mt-1 text-[15px] text-ink-700">
            {SEASON.deliveryNote} {shippingLabel()}.
          </p>
        </div>
      </div>

      {/* progress */}
      <ol className="mt-6 grid grid-cols-4 gap-1.5" aria-label="Progress">
        {STEP_LABELS.map((label, i) => {
          const state = i === step ? "current" : i < step ? "done" : "todo";
          return (
            <li key={label}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i as Step)}
                aria-current={state === "current" ? "step" : undefined}
                className="w-full text-left disabled:cursor-default"
              >
                <span
                  className={`block h-1.5 rounded-full ${
                    state === "todo" ? "bg-sand-200" : "bg-leaf-700"
                  }`}
                />
                <span
                  className={`mt-2 block truncate text-[12px] font-semibold sm:text-[13px] ${
                    state === "current" ? "text-ink-950" : state === "done" ? "text-leaf-800" : "text-ink-500"
                  }`}
                >
                  <span className="hidden sm:inline">{i + 1}. </span>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[1fr_340px]">
        <div>
          {/* ---------------- STEP 0: SETS ---------------- */}
          {step === 0 && (
            <div className="space-y-4">
              {orderedLevels.map((level, idx) => {
                const isAA = level.key === "MEHUDAR_AA";
                const isChoice = preselected === level.key;
                const unit =
                  level.basePriceCents +
                  (isAA && pitom && level.pitomSurchargeCents ? level.pitomSurchargeCents : 0);
                const selected = qty[level.key] > 0;
                const thumb = THUMB[level.key];
                return (
                  <Fragment key={level.key}>
                    {preselected && idx === 1 && (
                      <div className="pt-4">
                        <h2 className="font-display text-xl font-bold text-ink-950">
                          Add to your order
                        </h2>
                        <p className="mt-1 text-[14px] leading-relaxed text-ink-700">
                          One order can hold several sets, and they ship together in one box. A
                          Chinuch set for each boy is the usual addition - or change your mind here,
                          nothing is fixed until you pay.
                        </p>
                      </div>
                    )}
                    <article
                      className={`rounded-2xl border bg-white p-4 shadow-card transition sm:p-5 ${
                        isChoice
                          ? "border-leaf-700 ring-2 ring-leaf-700"
                          : selected
                            ? "border-leaf-700 ring-1 ring-leaf-700"
                            : "border-sand-200"
                      }`}
                    >
                    {isChoice && (
                      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-leaf-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Your choice
                      </p>
                    )}
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand-100 sm:h-24 sm:w-24">
                        <Image src={thumb.src} alt={thumb.alt} fill sizes="96px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-esrog-800">
                          {level.tier}
                        </p>
                        <h2 className="font-display text-xl font-bold leading-tight text-ink-950 sm:text-2xl">
                          {level.name}
                        </h2>
                        <p className="mt-0.5 text-[14px] text-ink-700">{WHO[level.key]}</p>
                        <p className="tnum mt-1.5 font-display text-2xl font-bold text-leaf-900">
                          {money(unit)}{" "}
                          <span className="font-sans text-[13px] font-normal text-ink-500">per set</span>
                        </p>
                      </div>
                    </div>

                    {isAA && (
                      <div className="mt-4">
                        <p className="mb-2 text-[13px] font-semibold text-ink-900">Esrog with a pitom?</p>
                        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                          {[
                            { on: true, label: "With pitom", price: level.basePriceCents + (level.pitomSurchargeCents ?? 0) },
                            { on: false, label: "No pitom", price: level.basePriceCents },
                          ].map((opt) => (
                            <button
                              key={String(opt.on)}
                              type="button"
                              onClick={() => setPitom(opt.on)}
                              aria-pressed={pitom === opt.on}
                              className={`flex h-12 items-center justify-between gap-2 whitespace-nowrap rounded-lg border-2 px-3.5 text-[14px] font-semibold transition ${
                                pitom === opt.on
                                  ? "border-leaf-800 bg-leaf-50 text-leaf-900"
                                  : "border-sand-200 bg-white text-ink-700 hover:border-sand-300"
                              }`}
                            >
                              {opt.label}
                              <span className="tnum">{money(opt.price)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-sand-200 pt-4">
                      <span className="text-[14px] text-ink-700">How many sets?</span>
                      <div className="flex items-center gap-3">
                        <Stepper
                          value={qty[level.key]}
                          onChange={(n) => setQty({ ...qty, [level.key]: n })}
                          label={level.name}
                        />
                      </div>
                    </div>
                    <SpecDetails level={level} />
                    </article>
                  </Fragment>
                );
              })}

              <details className="group rounded-2xl border border-sand-200 bg-white shadow-card">
                <summary className="flex items-center justify-between p-4 sm:p-5">
                  <span>
                    <span className="font-display text-lg font-bold text-ink-950">Add extras</span>
                    <span className="block text-[13px] text-ink-500">
                      Extra hadassim, extra aravos, koishiklach. Optional.
                    </span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 text-ink-700 transition group-open:rotate-180">
                    <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <ul className="divide-y divide-sand-200 border-t border-sand-200 px-4 sm:px-5">
                  {ADDONS.map((addon) => (
                    <li key={addon.id} className="flex flex-wrap items-center gap-3 py-4">
                      <div className="min-w-[160px] flex-1">
                        <p className="font-semibold text-ink-950">{addon.name}</p>
                        <p className="text-[13px] text-ink-500">{addon.note}</p>
                      </div>
                      <span className="tnum font-display text-lg font-bold text-ink-950">
                        {money(addon.priceCents)}
                      </span>
                      <Stepper
                        value={addonQty[addon.id] ?? 0}
                        onChange={(n) => setAddonQty({ ...addonQty, [addon.id]: n })}
                        max={10}
                        label={addon.name}
                      />
                    </li>
                  ))}
                </ul>
              </details>

              <button
                type="button"
                disabled={setCount === 0}
                onClick={goDetails}
                className="hidden h-14 w-full items-center justify-center rounded-lg bg-leaf-800 px-8 text-[17px] font-semibold text-white transition hover:bg-leaf-900 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
              >
                {setCount === 0 ? "Choose at least one set" : `Continue - ${money(subtotal)}`}
              </button>
            </div>
          )}

          {/* ---------------- STEP 1: DELIVERY DETAILS ---------------- */}
          {step === 1 && (
            <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-8">
              <h2 className="font-display text-2xl font-bold text-ink-950">Delivery details</h2>
              <p className="mt-1 text-[15px] text-ink-700">
                Where the box goes, and how we reach you if anything about it needs a word.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Full name"
                  required
                  value={name}
                  onChange={setName}
                  placeholder="Yaakov Friedman"
                  autoComplete="name"
                  error={touched && !nameOk ? "Please enter your name." : ""}
                />
                <Field
                  label="Phone"
                  required
                  value={phone}
                  onChange={setPhone}
                  placeholder="(555) 123-4567"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  error={
                    touched && !phoneOk
                      ? "A phone number is required for delivery."
                      : ""
                  }
                />
                <Field
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  hint="For your confirmation and tracking number."
                  error={touched && !emailOk ? "That email does not look right. Leave it blank if you prefer." : ""}
                />
              </div>

              <h3 className="mt-8 font-display text-lg font-bold text-ink-950">Shipping address</h3>
              <p className="mt-1 text-[14px] text-ink-700">{SHIPPING.carrierNote}</p>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Street address"
                    required
                    value={line1}
                    onChange={setLine1}
                    placeholder="14 Forest Avenue"
                    autoComplete="address-line1"
                    error={touched && !line1Ok ? "Please enter a street address." : ""}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Field
                    label="Apartment, suite, floor"
                    value={line2}
                    onChange={setLine2}
                    placeholder="Apt 3B"
                    autoComplete="address-line2"
                    hint="Optional."
                  />
                </div>
                <Field
                  label="City"
                  required
                  value={city}
                  onChange={setCity}
                  placeholder="Lakewood"
                  autoComplete="address-level2"
                  error={touched && !cityOk ? "Please enter a city." : ""}
                />
                <div className="grid grid-cols-[1fr_1.4fr] gap-4">
                  <Field
                    label="State"
                    required
                    value={state}
                    onChange={(v) => setState(v.toUpperCase().slice(0, 2))}
                    placeholder="NJ"
                    autoComplete="address-level1"
                    error={touched && !stateOk ? "Two letters." : ""}
                  />
                  <Field
                    label="ZIP"
                    required
                    value={zip}
                    onChange={setZip}
                    placeholder="08701"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    error={touched && !zipOk ? "Five digits." : ""}
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex h-13 items-center justify-center rounded-lg border-2 border-sand-300 px-6 font-semibold text-ink-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goReview}
                  className="flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-8 font-semibold text-white transition hover:bg-leaf-900 sm:flex-1"
                >
                  Review my order
                </button>
              </div>
            </div>
          )}

          {/* ---------------- STEP 2: REVIEW ---------------- */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-8">
                <h2 className="font-display text-2xl font-bold text-ink-950">Review</h2>
                <ul className="mt-4 divide-y divide-sand-200">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-4 py-3">
                      <span className="text-ink-900">
                        <strong className="font-semibold">{item.quantity} x</strong> {itemLabel(item)}
                      </span>
                      <span className="tnum font-display text-lg font-bold text-ink-950">
                        {money(item.unitPriceCents * item.quantity)}
                      </span>
                    </li>
                  ))}
                  <li className="flex items-baseline justify-between gap-4 py-3">
                    <span className="text-ink-900">Shipping</span>
                    <span className="tnum text-[15px] font-semibold text-ink-700">
                      {shipCents === null ? "Added at checkout" : money(shipCents)}
                    </span>
                  </li>
                </ul>
                <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink-950 pt-4">
                  <span className="font-display text-xl font-bold text-ink-950">
                    {shipCents === null ? "Total before shipping" : "Total"}
                  </span>
                  <span className="tnum font-display text-2xl font-bold text-ink-950">{money(total)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="mt-2 inline-block py-1.5 text-[14px] font-semibold text-leaf-800 underline underline-offset-4"
                >
                  Change my sets
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-card">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Ordered by</p>
                  <p className="mt-2 font-display text-lg font-bold text-ink-950">{name}</p>
                  <p className="text-[14px] text-ink-700">{phone}</p>
                  {email && <p className="text-[14px] text-ink-700">{email}</p>}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-2 inline-block py-1.5 text-[14px] font-semibold text-leaf-800 underline underline-offset-4"
                  >
                    Edit
                  </button>
                </div>
                <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-card">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Ship to</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-900">
                    {address.line1}
                    {address.line2 && (
                      <>
                        <br />
                        {address.line2}
                      </>
                    )}
                    <br />
                    {address.city}, {address.state} {address.zip}
                  </p>
                  <p className="mt-2 text-[14px] text-ink-700">{SEASON.deliveryNote}</p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-2 inline-block py-1.5 text-[14px] font-semibold text-leaf-800 underline underline-offset-4"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-esrog-300 bg-esrog-100 p-5">
                <p className="text-[14px] leading-relaxed text-ink-900">
                  <strong className="font-semibold">Before you pay:</strong> orders close{" "}
                  {SEASON.deadlineLabelEt}. Until then you can change or cancel yourself from your
                  order page. After that the shipment is packed against these totals.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex h-13 items-center justify-center rounded-lg border-2 border-sand-300 px-6 font-semibold text-ink-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-8 font-semibold text-white transition hover:bg-leaf-900 sm:flex-1"
                >
                  Continue to payment - {money(total)}
                </button>
              </div>
            </div>
          )}

          {/* ---------------- STEP 3: PAYMENT ---------------- */}
          {step === 3 && (
            <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink-950">Payment</h2>
                  <p className="mt-1 text-[15px] text-ink-700">
                    Paid in full now. That is what makes you a partner in the shipment.
                  </p>
                </div>
                <span className="tnum shrink-0 rounded-lg bg-sand-100 px-3 py-2 font-display text-xl font-bold text-ink-950">
                  {money(total)}
                </span>
              </div>

              {pending ? (
                /* Live processor, order saved: Stripe collects the card, the webhook marks PAID. */
                <div className="mt-6">
                  <p className="mb-4 rounded-lg bg-leaf-50 px-4 py-3 text-[14px] text-ink-900">
                    Your order is saved under code{" "}
                    <strong className="font-display font-bold">{pending.code}</strong>. Complete the
                    payment to lock it in.
                  </p>
                  <StripePay
                    publishableKey={pubKey}
                    clientSecret={pending.clientSecret}
                    returnUrl={`${window.location.origin}/order/${pending.code}?new=1`}
                    payLabel={`Pay ${money(total)}`}
                  />
                </div>
              ) : (
                <>
                  {!payLive && (
                    <div className="mt-5 rounded-lg border border-esrog-300 bg-esrog-100 px-4 py-3 text-[14px] text-ink-900">
                      Card processing is not switched on yet. Your order is recorded and held under
                      your code, and no card is charged. We will be in touch to settle payment
                      before anything ships.
                    </div>
                  )}

                  {payError && (
                    <p className="mt-4 rounded-lg bg-alert-100 px-4 py-3 text-[14px] text-alert-800">{payError}</p>
                  )}

                  <button
                    type="button"
                    disabled={paying}
                    onClick={submitPayment}
                    className="mt-7 flex h-14 w-full items-center justify-center rounded-lg bg-leaf-800 px-8 text-[17px] font-semibold text-white transition hover:bg-leaf-900 disabled:opacity-60"
                  >
                    {paying
                      ? payLive
                        ? "Saving your order..."
                        : "Placing your order..."
                      : payLive
                        ? `Continue to secure payment - ${money(total)}`
                        : `Place my order - ${money(total)}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={paying}
                    className="mt-2 flex h-11 w-full items-center justify-center rounded-lg text-[14px] font-semibold text-ink-500 hover:text-ink-900"
                  >
                    Back to review
                  </button>
                </>
              )}

              <p className="mt-6 border-t border-sand-200 pt-5 text-[13px] leading-relaxed text-ink-500">
                {payLive && "Statement descriptor: VSAMACHTA ARBA MINIM. "}
                {EXCHANGE_GUARANTEE}
              </p>
            </div>
          )}
        </div>

        {/* ---------------- SUMMARY RAIL (desktop) ---------------- */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Your order</p>
            {items.length === 0 ? (
              <p className="mt-4 text-[14px] text-ink-500">Nothing selected yet. Add a set to begin.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-[14px]">
                {items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="text-ink-700">
                      {item.quantity} x {itemLabel(item)}
                    </span>
                    <span className="tnum font-semibold text-ink-950">
                      {money(item.unitPriceCents * item.quantity)}
                    </span>
                  </li>
                ))}
                <li className="flex justify-between gap-3">
                  <span className="text-ink-700">Shipping</span>
                  <span className="tnum font-semibold text-ink-950">
                    {shipCents === null ? "At checkout" : money(shipCents)}
                  </span>
                </li>
              </ul>
            )}
            <div className="mt-5 flex items-baseline justify-between border-t border-sand-200 pt-4">
              <span className="font-semibold text-ink-900">
                {shipCents === null ? "Before shipping" : "Total"}
              </span>
              <span className="tnum font-display text-2xl font-bold text-ink-950">{money(total)}</span>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-500">
              {setCount} complete {setCount === 1 ? "set" : "sets"}. Esrog, lulav, hadassim and
              aravos in each.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-500">{SEASON.deliveryNote}</p>
          </div>
        </aside>
      </div>

      {/* ---------------- MOBILE ACTION BAR ---------------- */}
      {step === 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 px-4 pt-2.5 shadow-[0_-8px_24px_-12px_rgba(23,21,15,0.25)] backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[12px] text-ink-500">
                {setCount === 0 ? "No sets yet" : `${setCount} ${setCount === 1 ? "set" : "sets"}`}
              </p>
              <p className="tnum font-display text-xl font-bold text-ink-950">{money(subtotal)}</p>
            </div>
            <button
              type="button"
              disabled={setCount === 0}
              onClick={goDetails}
              className="flex h-12 items-center rounded-lg bg-leaf-800 px-6 text-[15px] font-semibold text-white disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- helpers ---------------- */

function SpecDetails({ level }: { level: (typeof LEVELS)[number] }) {
  return (
    <details className="mt-3 rounded-xl border border-sand-200 bg-sand-50">
      <summary className="px-4 py-2.5 text-[13px] font-semibold text-ink-700">
        Show the sorting standard for {level.name}
      </summary>
      <dl className="space-y-3 border-t border-sand-200 px-4 py-4 text-[14px] leading-relaxed text-ink-700">
        {(
          [
            ["Esrog", level.spec.esrog],
            ["Lulav", level.spec.lulav],
            ["Hadassim", level.spec.hadassim],
          ] as const
        ).map(([term, text]) => (
          <div key={term}>
            <dt className="font-display text-[15px] font-bold text-ink-950">{term}</dt>
            <dd className="mt-0.5">{text}</dd>
          </div>
        ))}
        <div>
          <dt className="font-display text-[15px] font-bold text-ink-950">Aravos</dt>
          <dd className="mt-0.5">Fresh aravos are included with every set.</dd>
        </div>
      </dl>
    </details>
  );
}


function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  hint,
  error,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  hint?: string;
  error?: string;
  inputMode?: "numeric" | "text" | "tel" | "email";
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[14px] font-semibold text-ink-900">
        {label}
        {required && <span className="text-esrog-800"> *</span>}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 h-13 w-full rounded-lg border bg-white px-4 text-[17px] text-ink-950 outline-none transition placeholder:text-ink-500/60 focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200 ${
          error ? "border-alert-800" : "border-sand-300"
        }`}
      />
      {error ? (
        <span className="mt-1 block text-[13px] text-alert-800">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[13px] text-ink-500">{hint}</span>
      ) : null}
    </label>
  );
}
