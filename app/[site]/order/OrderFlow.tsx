"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Stepper } from "@/components/Ui";
import {
  ADDONS,
  EXCHANGE_GUARANTEE,
  LEVELS,
  LevelKey,
  SEASON,
  Site,
} from "@/lib/data";
import { IMG, type Photo } from "@/lib/images";
import { Order, OrderItem, isPastDeadline, itemLabel, money, orderTotal } from "@/lib/orders";
import { useStore } from "@/lib/store";
import { StripePay } from "@/components/StripePay";

type Step = 0 | 1 | 2 | 3;

const STEP_LABELS = ["Your sets", "Your details", "Review", "Payment"];

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

export function OrderFlow({ site }: { site: Site }) {
  const router = useRouter();
  const { placeOrder } = useStore();

  const [step, setStep] = useState<Step>(0);
  const [qty, setQty] = useState<Record<LevelKey, number>>({ ...EMPTY_QTY });
  const [pitom, setPitom] = useState(true);
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [openSpec, setOpenSpec] = useState<LevelKey | null>("MEHUDAR_AA");

  // ?level=KEY from a product page or a community card pre-selects one set of that level.
  // Read after mount so the page itself stays static (edge-cached) and fully server-rendered.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("level") as LevelKey | null;
    if (key && LEVELS.some((l) => l.key === key)) {
      setQty((q) => (Object.values(q).some((n) => n > 0) ? q : { ...EMPTY_QTY, [key]: 1 }));
      setOpenSpec(key);
    }
  }, []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [shul, setShul] = useState("");
  const [touched, setTouched] = useState(false);

  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
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
        qtyPickedUp: 0,
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
        qtyPickedUp: 0,
      });
    }
    return out;
  }, [qty, pitom, addonQty]);

  const total = orderTotal(items);
  const setCount = items.filter((i) => i.kind === "LEVEL").reduce((s, i) => s + i.quantity, 0);
  const emailOk = email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const detailsValid = name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10 && emailOk;

  const pickupDate = new Date(`${site.distributionDateIso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  /* ---------------- deadline closed ---------------- */
  if (closed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink-950">
          Registration for {site.name} is closed
        </h1>
        <p className="mt-4 text-ink-700">
          The deadline passed on {SEASON.deadlineLabelEt}. The shipment is packed against the
          totals, so no further orders can be accepted this season.
        </p>
        <p className="mt-4 text-ink-700">
          Questions? Speak to {site.repName} at {site.repPhone}.
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
    if (!payLive && card.replace(/\D/g, "").length < 12) {
      setPayError("Enter a card number to continue. This is a preview, nothing is charged.");
      return;
    }
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
          siteSlug: site.slug,
          lines,
          customerName: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          shul: shul.trim(),
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
            `We could not place the order just now. Please try again, or call ${site.repName} at ${site.repPhone}.`,
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
        siteSlug: site.slug,
        status: "PAID",
        channel: "ONLINE",
        customerName: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        shul: shul.trim(),
        items,
        totalCents: total,
        paymentMethod: "CARD",
        createdAt: new Date().toISOString(),
        notes: "",
        exchanges: [],
      } satisfies Order);
      router.push(`/order/${data.code}?new=1`);
    } catch {
      setPaying(false);
      setPayError(
        `We could not reach the server. Check your connection and try again, or call ${site.repName} at ${site.repPhone}.`,
      );
    }
  };

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
          <Link href={`/${site.slug}`} className="inline-block py-1 text-[14px] text-ink-500 hover:text-leaf-800">
            Back to {site.name}
          </Link>
          <h1 className="mt-1.5 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
            Order for {site.name}
          </h1>
          <p className="mt-1 text-[15px] text-ink-700">
            Pickup at {site.hostInstitution}, {pickupDate}, {site.windowStart} to {site.windowEnd}
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
              {LEVELS.map((level) => {
                const isAA = level.key === "MEHUDAR_AA";
                const unit =
                  level.basePriceCents +
                  (isAA && pitom && level.pitomSurchargeCents ? level.pitomSurchargeCents : 0);
                const selected = qty[level.key] > 0;
                const thumb = THUMB[level.key];
                return (
                  <article
                    key={level.key}
                    className={`rounded-2xl border bg-white p-4 shadow-card transition sm:p-5 ${
                      selected ? "border-leaf-700 ring-1 ring-leaf-700" : "border-sand-200"
                    }`}
                  >
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
                {setCount === 0 ? "Choose at least one set" : `Continue - ${money(total)}`}
              </button>
            </div>
          )}

          {/* ---------------- STEP 1: DETAILS ---------------- */}
          {step === 1 && (
            <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-8">
              <h2 className="font-display text-2xl font-bold text-ink-950">Your details</h2>
              <p className="mt-1 text-[15px] text-ink-700">
                Enough to find your order in seconds at pickup.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Full name"
                  required
                  value={name}
                  onChange={setName}
                  placeholder="Yaakov Friedman"
                  autoComplete="name"
                  error={touched && name.trim().length < 2 ? "Please enter your name." : ""}
                />
                <Field
                  label="Phone"
                  required
                  value={phone}
                  onChange={setPhone}
                  placeholder={`(${site.repPhone.replace(/\D/g, "").slice(0, 3)}) 555-0142`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  error={
                    touched && phone.replace(/\D/g, "").length < 10
                      ? "A phone number is how the rep finds you."
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
                  hint="For your confirmation and pickup reminder."
                  error={touched && !emailOk ? "That email does not look right. Leave it blank if you prefer." : ""}
                />
                <Field
                  label="Shul"
                  value={shul}
                  onChange={setShul}
                  placeholder="Adas Yisrael"
                  autoComplete="organization"
                  hint="Optional. Helps the rep group orders."
                />
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
                </ul>
                <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink-950 pt-4">
                  <span className="font-display text-xl font-bold text-ink-950">Total</span>
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
                  {shul && <p className="text-[14px] text-ink-700">{shul}</p>}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-2 inline-block py-1.5 text-[14px] font-semibold text-leaf-800 underline underline-offset-4"
                  >
                    Edit
                  </button>
                </div>
                <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-card">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Pickup</p>
                  <p className="mt-2 font-display text-lg font-bold text-ink-950">{site.hostInstitution}</p>
                  <p className="text-[14px] text-ink-700">
                    {site.addressLines.join(", ")}
                    <br />
                    {site.city}, {site.state} {site.zip}
                  </p>
                  <p className="mt-2 text-[14px] text-ink-700">
                    {pickupDate}, {site.windowStart} to {site.windowEnd}
                  </p>
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
                      Preview checkout. No card is charged and nothing leaves this page.{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setCard("4242 4242 4242 4242");
                          setExp("09 / 28");
                          setCvc("123");
                        }}
                        className="inline-block py-1 font-semibold underline underline-offset-2"
                      >
                        Fill a demo card
                      </button>
                    </div>
                  )}

                  {!payLive && (
                    <div className="mt-6 space-y-5">
                      <Field
                        label="Card number"
                        value={card}
                        onChange={(v) => setCard(formatCard(v))}
                        placeholder="4242 4242 4242 4242"
                        inputMode="numeric"
                        autoComplete="cc-number"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Field
                          label="Expiry"
                          value={exp}
                          onChange={setExp}
                          placeholder="MM / YY"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                        />
                        <Field
                          label="CVC"
                          value={cvc}
                          onChange={setCvc}
                          placeholder="123"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                        />
                      </div>
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
                        : "Confirming your payment..."
                      : payLive
                        ? `Continue to secure payment - ${money(total)}`
                        : `Pay ${money(total)}`}
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
                Statement descriptor: VSAMACHTA ARBA MINIM. {EXCHANGE_GUARANTEE}
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
              </ul>
            )}
            <div className="mt-5 flex items-baseline justify-between border-t border-sand-200 pt-4">
              <span className="font-semibold text-ink-900">Total</span>
              <span className="tnum font-display text-2xl font-bold text-ink-950">{money(total)}</span>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-500">
              {setCount} complete {setCount === 1 ? "set" : "sets"}. Esrog, lulav, hadassim and
              aravos in each.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
              Pickup {pickupDate}, {site.windowStart} to {site.windowEnd}, {site.hostInstitution}.
            </p>
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
              <p className="tnum font-display text-xl font-bold text-ink-950">{money(total)}</p>
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

function formatCard(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
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
