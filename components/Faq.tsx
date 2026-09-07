/**
 * Questions and answers, as a full-width accordion.
 *
 * One question per row across the whole measure, built on native <details>:
 * there is no state to get wrong, every answer is in the DOM for a crawler and
 * for browser find-in-page, and it works before any JavaScript loads.
 *
 * The first row opens on load so the pattern is obvious without a click. No
 * rotating +: the chevron matches the disclosures used elsewhere on the site.
 */
export interface FaqItem {
  q: string;
  a: string[];
}

function Chevron() {
  return (
    <span
      aria-hidden="true"
      className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand-300 text-ink-700 transition group-open:border-leaf-800 group-open:bg-leaf-800 group-open:text-white"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition group-open:rotate-180">
        <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="w-full border-t border-sand-200">
      {items.map((item, i) => (
        <details key={item.q} open={i === 0} className="group w-full border-b border-sand-200">
          <summary className="flex w-full items-start justify-between gap-6 py-5 transition hover:bg-sand-50 sm:py-6">
            <h3 className="font-display text-lg font-bold leading-snug text-ink-950 transition group-hover:text-leaf-900 sm:text-[1.4rem]">
              {item.q}
            </h3>
            <Chevron />
          </summary>
          <div className="max-w-3xl space-y-3 pb-6 text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
            {item.a.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
