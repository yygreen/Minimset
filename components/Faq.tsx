/**
 * Accordion built on native <details>: zero JavaScript, keyboard accessible,
 * and the answers are in the HTML for search engines. First item open by default.
 */
export interface FaqItem {
  q: string;
  a: string[];
}

export function Faq({ items, openFirst = true }: { items: FaqItem[]; openFirst?: boolean }) {
  return (
    <div className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white shadow-card">
      {items.map((item, i) => (
        <details key={item.q} open={openFirst && i === 0} className="group px-5 sm:px-7">
          <summary className="flex items-start justify-between gap-4 py-5 text-left">
            <span className="font-display text-lg font-bold leading-snug text-ink-950 sm:text-xl">
              {item.q}
            </span>
            <span
              aria-hidden="true"
              className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sand-300 text-ink-700 transition group-open:rotate-45 group-open:border-leaf-700 group-open:text-leaf-700"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <div className="space-y-3 pb-6 pr-2 text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
            {item.a.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
