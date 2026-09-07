/**
 * Questions and answers, in two shapes.
 *
 * `open` (the default) is what the homepage uses: two columns, every answer
 * showing, no interaction. On a page somebody is scrolling through once, an
 * objection they have to click to read is an objection left standing.
 *
 * `accordion` is for the questions page itself, where the list is long enough
 * that the headings are the useful thing to scan and a reader wants one or two
 * answers rather than all of them. It runs the full width of its container --
 * one question per row, no columns -- and uses native <details>, so there is no
 * state to get wrong, the answers are in the DOM for a crawler, and browser
 * find-in-page still reaches them.
 *
 * No rotating +: the chevron matches the disclosures used elsewhere on the site.
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

function Accordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="w-full border-t border-sand-200">
      {items.map((item, i) => (
        /* the first one starts open, so the pattern is obvious without a click */
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

export function Faq({ items, variant = "open" }: { items: FaqItem[]; variant?: "open" | "accordion" }) {
  if (variant === "accordion") return <Accordion items={items} />;

  return (
    <dl className="grid gap-x-10 gap-y-8 md:grid-cols-2 lg:gap-x-14">
      {items.map((item) => (
        <div key={item.q} className="break-inside-avoid">
          <dt className="flex gap-3 font-display text-lg font-bold leading-snug text-ink-950 sm:text-xl">
            <span aria-hidden="true" className="mt-[0.15em] shrink-0 text-esrog-700">
              {/* a quiet mark, so a question is findable when skimming */}
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 14.5A6.5 6.5 0 108 1.5a6.5 6.5 0 000 13Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M6.3 6.1a1.75 1.75 0 013.4.6c0 1.2-1.7 1.5-1.7 2.6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="11.6" r="0.8" fill="currentColor" />
              </svg>
            </span>
            {item.q}
          </dt>
          <dd className="mt-2.5 space-y-3 pl-[27px] text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
            {item.a.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
