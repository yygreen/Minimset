"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { QrBlock, Stepper } from "@/components/Ui";
import { ADDONS, LEVELS, LevelKey, SITES, getSite } from "@/lib/data";
import { money, type Order } from "@/lib/orders";
import { useStore } from "@/lib/staff-store";

/**
 * Paper channel. A rep takes an order on a sheet at the Beis Medrash and keys it here; it is
 * PAID on creation against cash or a check, and from that moment it is indistinguishable from
 * an online order in totals, search and distribution. Closes the last gap in DECISIONS.md.
 */
export default function PaperOrderPage() {
  const { reload, role, repSite } = useStore();
  const [chosenSite, setChosenSite] = useState(SITES[0].slug);
  // A rep keys orders for his own community only; the server refuses anything else anyway.
  const siteSlug = role === "rep" && repSite ? repSite : chosenSite;
  const setSiteSlug = setChosenSite;
  const [qty, setQty] = useState<Record<string, number>>({});
  const [pitom, setPitom] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shul, setShul] = useState("");
  const [email, setEmail] = useState("");
  const [enteredBy, setEnteredBy] = useState("");
  const [method, setMethod] = useState<"CASH" | "CHECK">("CASH");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<Order | null>(null);

  const lines = useMemo(() => {
    const out: {
      kind: "LEVEL" | "ADDON";
      levelKey?: LevelKey;
      addOnId?: string;
      withPitom?: boolean;
      quantity: number;
      unitPriceCents: number;
      label: string;
    }[] = [];
    for (const level of LEVELS) {
      const n = qty[level.key] ?? 0;
      if (!n) continue;
      const withPitom = level.key === "MEHUDAR_AA" ? pitom : false;
      out.push({
        kind: "LEVEL",
        levelKey: level.key,
        withPitom,
        quantity: n,
        unitPriceCents:
          level.basePriceCents + (withPitom ? (level.pitomSurchargeCents ?? 0) : 0),
        label: level.name,
      });
    }
    for (const addon of ADDONS) {
      const n = qty[addon.id] ?? 0;
      if (!n) continue;
      out.push({
        kind: "ADDON",
        addOnId: addon.id,
        quantity: n,
        unitPriceCents: addon.priceCents,
        label: addon.name,
      });
    }
    return out;
  }, [qty, pitom]);

  const total = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const sets = lines.filter((l) => l.kind === "LEVEL").reduce((s, l) => s + l.quantity, 0);
  const valid = sets > 0 && name.trim().length > 1 && phone.replace(/\D/g, "").length >= 7;

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          siteSlug,
          lines: lines.map((l) => ({
            kind: l.kind,
            levelKey: l.levelKey,
            addOnId: l.addOnId,
            withPitom: l.withPitom,
            quantity: l.quantity,
          })),
          customerName: name,
          phone,
          shul,
          email,
          paymentMethod: method,
          enteredBy,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || "That order could not be saved.");
        setBusy(false);
        return;
      }
      setPlaced(data.order);
      await reload();
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  };

  const startAnother = () => {
    setPlaced(null);
    setQty({});
    setName("");
    setPhone("");
    setShul("");
    setEmail("");
    setError("");
  };

  /* ---------- the pickup card ---------- */
  if (placed) {
    const site = getSite(placed.siteSlug);
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p data-noprint className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
          Paper order saved
        </p>
        <div className="mt-4 rounded-2xl border-2 border-ink-950 bg-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-display text-[15px] font-bold text-ink-700">
                V&#39;samachta Arba Minim
              </p>
              <p className="tnum mt-2 font-display text-[3rem] font-bold leading-none tracking-[0.12em] text-ink-950">
                {placed.code}
              </p>
              <p className="mt-3 font-display text-xl font-bold text-ink-950">{placed.customerName}</p>
              <p className="text-[14px] text-ink-700">{placed.phone}</p>
            </div>
            <QrBlock code={placed.code} size={120} />
          </div>
          <ul className="mt-5 border-t border-sand-300 pt-4 text-[14px] text-ink-900">
            {placed.items.map((i) => (
              <li key={i.id} className="flex justify-between py-1">
                <span>
                  {i.quantity} x{" "}
                  {i.kind === "LEVEL"
                    ? `${LEVELS.find((l) => l.key === i.levelKey)?.name}${i.withPitom ? " (pitom)" : ""}`
                    : ADDONS.find((a) => a.id === i.addOnId)?.name}
                </span>
                <span className="tnum">{money(i.unitPriceCents * i.quantity)}</span>
              </li>
            ))}
            <li className="mt-2 flex justify-between border-t border-sand-300 pt-2 font-semibold">
              <span>Paid, {placed.paymentMethod === "CHECK" ? "check" : "cash"}</span>
              <span className="tnum">{money(placed.totalCents)}</span>
            </li>
          </ul>
          <p className="mt-4 text-[13px] leading-snug text-ink-700">
            {site
              ? `Collect at ${site.hostInstitution}, ${site.city}, ${site.windowStart} to ${site.windowEnd}.`
              : ""}{" "}
            Show this card at the table.
          </p>
        </div>

        <div data-noprint className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-6 text-[15px] font-semibold text-white transition hover:bg-leaf-900"
          >
            Print this card
          </button>
          <button
            type="button"
            onClick={startAnother}
            className="flex h-13 items-center justify-center rounded-lg border-2 border-sand-300 px-6 text-[15px] font-semibold text-ink-700 transition hover:border-ink-500"
          >
            Enter another
          </button>
          <Link
            href="/staff"
            className="flex h-13 items-center justify-center px-2 text-[15px] font-semibold text-ink-700 underline underline-offset-4"
          >
            Back to staff
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- entry ---------- */
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/staff" className="inline-block py-1 text-[14px] text-ink-500 hover:text-leaf-800">
        Back to staff
      </Link>
      <h1 className="mt-1.5 font-display text-3xl font-bold text-ink-950">Paper order</h1>
      <p className="mt-1 text-sm text-ink-700">
        For an order taken on a sheet. It is saved as paid and joins the totals immediately.
      </p>

      <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-6">
        {role === "rep" ? (
          <p className="text-sm">
            <span className="font-semibold text-ink-900">Community: </span>
            <span className="font-semibold text-leaf-900">
              {SITES.find((s) => s.slug === siteSlug)?.name ?? siteSlug}
            </span>
          </p>
        ) : (
          <label className="block text-sm">
            <span className="font-semibold text-ink-900">Community</span>
            <select
              value={siteSlug}
              onChange={(e) => setSiteSlug(e.target.value)}
              className="mt-2 h-12 w-full rounded-lg border border-sand-300 bg-white px-4 font-semibold text-ink-900 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
            >
              {SITES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <ul className="mt-5 space-y-3">
          {LEVELS.map((level) => (
            <li key={level.key} className="flex items-center justify-between gap-3">
              <span className="text-[15px] text-ink-900">
                {level.name}
                <span className="ml-2 text-[13px] text-ink-500">
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
              <span className="text-[15px] text-ink-700">
                {addon.name}
                <span className="ml-2 text-[13px] text-ink-500">{money(addon.priceCents)}</span>
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
          <div className="mt-4 flex items-center gap-3 text-[14px]">
            <span className="text-ink-700">Pitom on the A-A:</span>
            <button
              type="button"
              onClick={() => setPitom(!pitom)}
              className="rounded-lg border-2 border-leaf-800 px-4 py-2 text-[13px] font-semibold text-leaf-900 transition hover:bg-leaf-800 hover:text-white"
            >
              {pitom ? "With pitom" : "Without pitom"}
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Text label="Name" value={name} onChange={setName} />
          <Text label="Phone" value={phone} onChange={setPhone} inputMode="tel" />
          <Text label="Shul (optional)" value={shul} onChange={setShul} />
          <Text label="Email (optional)" value={email} onChange={setEmail} inputMode="email" />
          <Text label="Taken by" value={enteredBy} onChange={setEnteredBy} />
          <label className="block text-sm">
            <span className="font-semibold text-ink-900">Paid by</span>
            <div className="mt-2 flex gap-2">
              {(["CASH", "CHECK"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`h-12 flex-1 rounded-lg border-2 text-[14px] font-semibold transition ${
                    method === m
                      ? "border-leaf-800 bg-leaf-800 text-white"
                      : "border-sand-300 text-ink-700 hover:border-ink-500"
                  }`}
                >
                  {m === "CASH" ? "Cash" : "Check"}
                </button>
              ))}
            </div>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-lg bg-sand-100 px-4 py-3">
          <span className="text-[15px] text-ink-700">
            {sets} {sets === 1 ? "set" : "sets"}
          </span>
          <span className="tnum font-display text-xl font-bold text-ink-950">{money(total)}</span>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-alert-50 px-4 py-3 text-[14px] text-alert-800">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!valid || busy}
          onClick={submit}
          className="mt-5 flex h-14 w-full items-center justify-center rounded-lg bg-leaf-800 px-6 text-[16px] font-semibold text-white transition hover:bg-leaf-900 disabled:opacity-40"
        >
          {busy ? "Saving..." : sets === 0 ? "Add at least one set" : `Save as paid, ${money(total)}`}
        </button>
      </div>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "tel" | "email";
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-ink-900">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-12 w-full rounded-lg border border-sand-300 bg-white px-4 text-[15px] text-ink-950 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
      />
    </label>
  );
}
