import { INSPECTORS } from "@/lib/trust";

/**
 * "Inspected by" band. Renders nothing until lib/trust.ts INSPECTORS has at least one name.
 * Server component; no client JS.
 */
export function InspectedBy({ lang = "en" }: { lang?: "en" | "he" }) {
  if (INSPECTORS.length === 0) return null;
  const he = lang === "he";
  return (
    <section
      aria-label={he ? "נבדק על ידי" : "Inspected by"}
      className="border-b border-sand-200 bg-leaf-50"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:gap-8 sm:py-7">
        <div className="shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-leaf-800">
            {he ? "נבדק ונחתם על ידי" : "Inspected and sealed by"}
          </p>
          <p className="mt-1 font-display text-[20px] font-bold leading-tight text-ink-950">
            {he ? "מורי הוראה, מומחים בהלכות ארבעת המינים" : "Morei Hora'ah, experts in hilchos Daled Minim"}
          </p>
        </div>
        <ul className="flex flex-wrap gap-2.5 sm:justify-end sm:gap-3">
          {INSPECTORS.map((r) => (
            <li
              key={r.name}
              className="flex items-center gap-3 rounded-xl border border-leaf-200 bg-white py-2.5 pl-3 pr-4 shadow-card"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-esrog-200 text-esrog-900"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M7.5 12.2l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </span>
              <span>
                <span className="block font-display text-[17px] font-bold leading-tight text-ink-950">
                  {he ? r.nameHe : r.name}
                </span>
                <span className="block text-[13px] leading-snug text-ink-700">{he ? r.roleHe : r.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
