import Link from "next/link";
import { LEVELS, type LevelKey } from "@/lib/data";
import { HE_LEVEL } from "@/lib/he";
import { money } from "@/lib/orders";

type Row = { label: string; pick: (l: (typeof LEVELS)[number]) => string };

const ROWS_EN: Row[] = [
  { label: "Esrog", pick: (l) => l.spec.esrog },
  { label: "Lulav", pick: (l) => l.spec.lulav },
  { label: "Hadassim", pick: (l) => l.spec.hadassim },
  { label: "Aravos", pick: () => "Fresh, sealed together with the hadassim." },
];

const ROWS_HE: Row[] = [
  { label: "אתרוג", pick: (l) => HE_LEVEL[l.key].spec.esrog },
  { label: "לולב", pick: (l) => HE_LEVEL[l.key].spec.lulav },
  { label: "הדסים", pick: (l) => HE_LEVEL[l.key].spec.hadassim },
  { label: "ערבות", pick: () => "טריות, בשקית חתומה יחד עם ההדסים." },
];

const T = {
  en: { standard: "Standard", perSet: "per set", thisPage: "This page", see: "See this set" },
  he: { standard: "התקן", perSet: "לסט", thisPage: "הדף הזה", see: "לדף הסט" },
};

/**
 * The three standards side by side, word for word, the current level highlighted.
 * Tablets and up: a fixed-width table with equal columns. Phones: one stacked card
 * per level (the current one open), because a 3-column table of long text is
 * unreadable at 390px. `locale="he"` renders the Hebrew rendering of the standard.
 */
export function CompareTable({ current, locale = "en" }: { current?: LevelKey; locale?: "en" | "he" }) {
  const he = locale === "he";
  const rows = he ? ROWS_HE : ROWS_EN;
  const t = he ? T.he : T.en;
  const name = (l: (typeof LEVELS)[number]) => (he ? HE_LEVEL[l.key].name : l.name);
  const tier = (l: (typeof LEVELS)[number]) => (he ? HE_LEVEL[l.key].tier : l.tier);

  return (
    <>
      {/* phones */}
      <div className="space-y-3 sm:hidden">
        {LEVELS.map((l, i) => {
          const on = current ? l.key === current : i === 0;
          return (
            <details
              key={l.key}
              open={on}
              className={`group rounded-2xl border bg-white ${current && on ? "border-leaf-700 ring-1 ring-leaf-700" : "border-sand-200"}`}
            >
              <summary className="flex items-center justify-between gap-3 p-4">
                <span>
                  <span className={`block text-[11px] font-bold text-esrog-800 ${he ? "text-[12px]" : "uppercase tracking-[0.14em]"}`}>{tier(l)}</span>
                  <span className="block font-display text-lg font-bold text-ink-950">{name(l)}</span>
                  <span className="tnum block text-[14px] font-semibold text-leaf-900">
                    <span dir="ltr">{money(l.basePriceCents)}</span> {t.perSet}
                  </span>
                </span>
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 text-ink-700 transition group-open:rotate-180">
                  <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <dl className="space-y-3 border-t border-sand-200 px-4 py-4 text-[14px] leading-relaxed text-ink-700">
                {rows.map((r) => (
                  <div key={r.label}>
                    <dt className="font-display text-[15px] font-bold text-ink-950">{r.label}</dt>
                    <dd className="mt-0.5">{r.pick(l)}</dd>
                  </div>
                ))}
              </dl>
              {!(current && on) && (
                <div className="px-4 pb-4">
                  <Link href={`#${l.slug}`} className="inline-block py-1.5 text-[14px] font-semibold text-leaf-800 underline underline-offset-4">
                    {t.see}
                  </Link>
                </div>
              )}
            </details>
          );
        })}
      </div>

      {/* tablets and up */}
      <table className="hidden w-full table-fixed border-separate border-spacing-0 text-start text-[14px] leading-relaxed sm:table">
        <colgroup>
          <col className="w-24 lg:w-28" />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th className={`border border-e-0 border-sand-200 bg-sand-100 p-4 text-start align-bottom text-[11px] font-bold text-esrog-800 ${he ? "rounded-tr-2xl text-[12px]" : "rounded-tl-2xl uppercase tracking-[0.16em]"}`}>
              {t.standard}
            </th>
            {LEVELS.map((l, i) => {
              const on = current ? l.key === current : false;
              const last = i === LEVELS.length - 1;
              return (
                <th
                  key={l.key}
                  className={`border border-e-0 p-4 text-start align-bottom font-normal ${last ? (he ? "rounded-tl-2xl border-e" : "rounded-tr-2xl border-e") : ""} ${
                    on ? "border-leaf-700 bg-leaf-50" : "border-sand-200 bg-sand-100"
                  }`}
                >
                  <p className={`text-[11px] font-bold text-esrog-800 ${he ? "text-[12px]" : "uppercase tracking-[0.16em]"}`}>{tier(l)}</p>
                  <p className="mt-1 font-display text-lg font-bold leading-tight text-ink-950">{name(l)}</p>
                  <p className="tnum text-[15px] font-semibold text-leaf-900">
                    <span dir="ltr">{money(l.basePriceCents)}</span> {t.perSet}
                  </p>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r.label}>
              <th
                scope="row"
                className={`border border-e-0 border-t-0 border-sand-200 bg-white p-4 text-start align-top font-display text-[15px] font-bold text-ink-950 ${
                  ""
                }`}
              >
                {r.label}
              </th>
              {LEVELS.map((l, i) => {
                const on = current ? l.key === current : false;
                const last = i === LEVELS.length - 1;
                return (
                  <td
                    key={l.key}
                    className={`border border-e-0 border-t-0 p-4 align-top text-ink-700 ${last ? "border-e" : ""} ${
                      ""
                    } ${on ? "border-leaf-700 bg-leaf-50 text-ink-900" : "border-sand-200 bg-white"}`}
                  >
                    {r.pick(l)}
                  </td>
                );
              })}
            </tr>
          ))}
          {/* The link out sits at the foot of the table rather than in its head:
              a reader compares first and acts afterwards, and putting it above
              the standards asked them to choose before reading them. */}
          <tr>
            <th
              scope="row"
              className={`border border-e-0 border-t-0 border-sand-200 bg-white p-4 ${he ? "rounded-br-2xl" : "rounded-bl-2xl"}`}
            >
              <span className="sr-only">{t.see}</span>
            </th>
            {LEVELS.map((l, i) => {
              const on = current ? l.key === current : false;
              const last = i === LEVELS.length - 1;
              return (
                <td
                  key={l.key}
                  className={`border border-e-0 border-t-0 p-4 align-top ${last ? "border-e" : ""} ${
                    last ? (he ? "rounded-bl-2xl" : "rounded-br-2xl") : ""
                  } ${on ? "border-leaf-700 bg-leaf-50" : "border-sand-200 bg-white"}`}
                >
                  {on ? (
                    <p className="text-[13px] font-semibold text-leaf-800">{t.thisPage}</p>
                  ) : (
                    <Link
                      href={`#${l.slug}`}
                      className="inline-block text-[13px] font-semibold text-leaf-800 underline underline-offset-4"
                    >
                      {t.see}
                    </Link>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </>
  );
}
