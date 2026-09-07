/**
 * Questions and answers, all open.
 *
 * This used to be an accordion built on <details>, with a rotating + on each
 * row. Accordions make sense when a list is long enough that scanning headings
 * beats reading, and when most readers want one answer. Neither is true here:
 * there are a handful of questions, every one of them is an objection standing
 * between somebody and an order, and the answers are two or three lines each.
 * Hiding them behind a click asked the reader to work for content we want them
 * to read.
 *
 * So: no interaction, no state, no icon. Two columns of plain Q&A that fill the
 * width available. Everything is visible to a reader and to a crawler at once,
 * and the section stops being a widget.
 */
export interface FaqItem {
  q: string;
  a: string[];
}

export function Faq({ items }: { items: FaqItem[] }) {
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
