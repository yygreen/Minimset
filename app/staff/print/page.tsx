"use client";

import { useState } from "react";
import Link from "next/link";
import { ADDONS, LEVELS, SEASON, SITES } from "@/lib/data";
import { money } from "@/lib/orders";
import { useStore } from "@/lib/staff-store";

/**
 * The paper order sheet: what a rep takes to the Beis Medrash table. Print CSS, no server
 * PDF - the house pattern. Each printed page is one order; afterwards the rep keys them in
 * at /staff/paper and hands the customer the printed pickup card.
 */
export default function PrintSheetsPage() {
  const { role, repSite } = useStore();
  const [chosenSite, setChosenSite] = useState(SITES[0].slug);
  const siteSlug = role === "rep" && repSite ? repSite : chosenSite;
  const site = SITES.find((s) => s.slug === siteSlug) ?? SITES[0];
  const [copies, setCopies] = useState(4);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div data-noprint>
        <Link href="/staff" className="inline-block py-1 text-[14px] text-ink-500 hover:text-leaf-800">
          Back to staff
        </Link>
        <h1 className="mt-1.5 font-display text-3xl font-bold text-ink-950">Paper order sheets</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-700">
          One sheet per order. Take a stack to the table; key each finished sheet into{" "}
          <Link href="/staff/paper" className="font-semibold text-leaf-800 underline underline-offset-2">
            Paper Order
          </Link>{" "}
          and it joins the totals at once.
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-4">
          {role !== "rep" && (
            <label className="text-sm">
              <span className="mr-2 font-semibold text-ink-900">Site</span>
              <select
                value={siteSlug}
                onChange={(e) => setChosenSite(e.target.value)}
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
          <label className="text-sm">
            <span className="mr-2 font-semibold text-ink-900">Sheets</span>
            <select
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
              className="h-12 rounded-lg border border-sand-300 bg-white px-4 font-semibold text-ink-900 outline-none focus:border-leaf-700 focus:ring-2 focus:ring-leaf-200"
            >
              {[1, 2, 4, 8, 12, 20].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-12 items-center justify-center rounded-lg bg-leaf-800 px-6 text-[15px] font-semibold text-white transition hover:bg-leaf-900"
          >
            Print
          </button>
        </div>
      </div>

      {Array.from({ length: copies }, (_, i) => (
        <Sheet key={i} site={site} first={i === 0} />
      ))}
    </div>
  );
}

function Sheet({ site, first }: { site: (typeof SITES)[number]; first: boolean }) {
  return (
    <div
      className={`rounded-2xl border-2 border-ink-950 bg-white p-6 print:rounded-none print:border print:p-5 ${
        first ? "mt-8" : "mt-6"
      } print:mt-0 print:break-after-page`}
    >
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink-950 pb-3">
        <div>
          <p className="font-display text-[22px] font-bold leading-none text-ink-950">
            V&#39;samachta Arba Minim
          </p>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.15em] text-ink-700">
            Paper order - {site.name} ({site.hostInstitution})
          </p>
        </div>
        <p className="text-right text-[12px] leading-snug text-ink-700">
          Paid in full before
          <br />
          <strong className="text-ink-950">{SEASON.deadlineLabelEt}</strong>
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-[14px]">
        <Line label="Name" />
        <Line label="Phone" />
        <Line label="Shul (optional)" />
        <Line label="Email (optional)" />
      </div>

      <table className="mt-5 w-full text-[14px]">
        <thead>
          <tr className="border-b border-ink-950 text-left text-[11px] uppercase tracking-wider text-ink-700">
            <th className="pb-1.5 font-bold">Set</th>
            <th className="pb-1.5 font-bold">Price</th>
            <th className="pb-1.5 text-center font-bold">Qty</th>
            <th className="pb-1.5 text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {LEVELS.map((l) => (
            <tr key={l.key} className="border-b border-sand-300">
              <td className="py-2 font-semibold text-ink-950">
                {l.name}
                {l.pitomSurchargeCents !== null && (
                  <span className="ml-2 font-normal text-ink-700">
                    pitom +{money(l.pitomSurchargeCents)}: yes / no
                  </span>
                )}
              </td>
              <td className="tnum py-2">{money(l.basePriceCents)}</td>
              <td className="py-2 text-center">
                <span className="inline-block h-7 w-12 rounded border border-ink-950 align-middle" />
              </td>
              <td className="py-2 text-right">
                <span className="inline-block h-7 w-16 rounded border border-sand-400 align-middle" />
              </td>
            </tr>
          ))}
          {ADDONS.map((a) => (
            <tr key={a.id} className="border-b border-sand-300">
              <td className="py-2 text-ink-900">{a.name}</td>
              <td className="tnum py-2">{money(a.priceCents)}</td>
              <td className="py-2 text-center">
                <span className="inline-block h-7 w-12 rounded border border-ink-950 align-middle" />
              </td>
              <td className="py-2 text-right">
                <span className="inline-block h-7 w-16 rounded border border-sand-400 align-middle" />
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} className="pt-3 text-[13px] text-ink-700">
              Paid by: cash / check &nbsp;&nbsp; Taken by: ______________
            </td>
            <td className="pt-3 text-right font-bold text-ink-950">Total</td>
            <td className="pt-3 text-right">
              <span className="inline-block h-8 w-20 rounded border-2 border-ink-950 align-middle" />
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-4 border-t border-sand-300 pt-3 text-[11px] leading-snug text-ink-700">
        Pickup: {site.hostInstitution}, {site.city} {site.state}, {site.windowStart} to {site.windowEnd},
        the day after Yom Kippur. Key this sheet into the Paper Order screen and give the customer
        the printed pickup card. Office code after entry: ______________
      </p>
    </div>
  );
}

function Line({ label }: { label: string }) {
  return (
    <p>
      <span className="mr-2 font-semibold text-ink-900">{label}:</span>
      <span className="inline-block w-full max-w-[220px] border-b border-ink-950 align-baseline">
        &nbsp;
      </span>
    </p>
  );
}
