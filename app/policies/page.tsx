import type { Metadata } from "next";
import Link from "next/link";
import { EXCHANGE_GUARANTEE, SEASON, SITES } from "@/lib/data";
import { GRACE_MINUTES } from "@/lib/server/pricing";

export const metadata: Metadata = {
  alternates: { canonical: "/policies" },
  title: "Policies - V'samachta Arba Minim",
  description:
    "Ordering, payment, changes and cancellation, collection at your Beis Medrash, the exchange guarantee, and what the order form stores.",
};

/**
 * Everything on this page is either copy that already appears elsewhere on the
 * site or a plain description of what the code actually does. Nothing here is
 * invented. Two commercial questions -- when a card is charged and how a refund
 * is handled -- cannot be answered until the operator connects a payment
 * account, and are marked as such rather than guessed at.
 */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-sand-200 pt-8 first:border-0 first:pt-0">
      <h2 className="font-display text-[1.6rem] font-bold leading-tight text-ink-950 sm:text-[2rem]">{title}</h2>
      <div className="mt-3 space-y-3 text-[16px] leading-relaxed text-ink-700">{children}</div>
    </section>
  );
}

const CONTENTS = [
  ["ordering", "Ordering"],
  ["payment", "Payment"],
  ["changes", "Changes and cancellation"],
  ["collection", "Collection, not shipping"],
  ["guarantee", "The exchange guarantee"],
  ["privacy", "What we store about you"],
  ["contact", "Questions"],
] as const;

export default function PoliciesPage() {
  const pickup = SITES[0];
  const pickupDate = new Date(`${pickup.distributionDateIso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <section className="bg-sand-100 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Policies</p>
          <h1 className="mt-2 font-display text-[2.5rem] font-bold leading-[1.05] text-ink-950 sm:text-[3.4rem]">
            How ordering, paying and collecting work.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-700">
            The whole arrangement in one place, in the same words used everywhere else on the site.
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <nav aria-label="On this page" className="mb-10 rounded-2xl border border-sand-200 bg-sand-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-700">On this page</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {CONTENTS.map(([id, label]) => (
              <li key={id}>
                <Link href={`#${id}`} className="text-[15px] font-semibold text-leaf-800 underline underline-offset-4">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-8">
          <Section id="ordering" title="Ordering">
            <p>
              Orders are placed on this site for the {SEASON.name} season and are collected in person.
              You choose your community, your sets and how many, and give a name, a phone number and
              an email address so your confirmation can reach you.
            </p>
            <p>
              Every order is given a code. That code is how you look your order up, how you change it,
              and how it is handed to you at pickup. Anyone holding your code can collect on your
              behalf, which is deliberate: send someone else if you cannot come yourself.
            </p>
            <p>
              Ordering closes at the season deadline, <strong>{SEASON.deadlineLabelEt}</strong>. Prices
              are calculated on the server at the moment you order, never in your browser.
            </p>
          </Section>

          <Section id="payment" title="Payment">
            <p>
              Sets are paid for in full at the time of ordering. The price you see is the price
              charged; there is no shipping charge, because nothing is shipped.
            </p>
            <div className="rounded-2xl border border-esrog-300 bg-esrog-100 p-5 text-ink-900">
              <p className="font-display text-lg font-bold text-ink-950">Card processing is not live yet</p>
              <p className="mt-1 text-[15px] leading-relaxed">
                Orders are recorded on the server, but no card is charged until the operator connects
                a payment account in their own name. Until then the payment step is a preview and the
                site says so on every page. Exact charge timing and refund handling will be stated
                here once that account is connected.
              </p>
            </div>
          </Section>

          <Section id="changes" title="Changes and cancellation">
            <p>
              You can change or cancel your order yourself, free, at any time up to the deadline. Open
              your order with its code from <Link href="/order" className="font-semibold text-leaf-800 underline underline-offset-4">Look up my order</Link>,
              and edit or cancel from there. Changing your sets reprices the order on the server.
            </p>
            <p>
              After the deadline the shipment is packed against the final totals, so the site stops
              accepting changes. A cart that reached the payment step before the deadline may finish
              paying for up to {GRACE_MINUTES} minutes afterwards; nothing new can be started.
            </p>
            <p>
              Past the deadline, speak to your community rep. Their name and number are on the
              homepage under <Link href="/#sites" className="font-semibold text-leaf-800 underline underline-offset-4">Pickup</Link>.
            </p>
          </Section>

          <Section id="collection" title="Collection, not shipping">
            <p>
              Nothing is posted or couriered. Every set is collected in person at your community&#39;s
              host Beis Medrash on distribution day, {pickupDate}, between {pickup.windowStart} and{" "}
              {pickup.windowEnd}. {SEASON.distributionNote}
            </p>
            <p>
              Bring your order code. If you cannot come, send anyone with it. If nobody collects on
              the day, contact your community rep — sets are not held indefinitely, and after Sukkos
              they are of no use to anyone.
            </p>
            <p>
              The sets fly in from Eretz Yisrael sealed: esrog in its box, hadassim and aravos in a
              sealed bag, lulav sealed. They are opened in your sukkah, not at the table.
            </p>
          </Section>

          <Section id="guarantee" title="The exchange guarantee">
            <p>{EXCHANGE_GUARANTEE}</p>
            <p>
              Reserve stock is flown in for exactly this. The exchange happens there and then — you
              are never asked to come back another day.
            </p>
          </Section>

          <Section id="privacy" title="What we store about you">
            <p>An order record holds only what is needed to fill and hand over that order:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>your name, phone number and email address</li>
              <li>your community, and your shul if you gave one</li>
              <li>what you ordered, the total, and how you chose to pay</li>
              <li>your order code and the time it was placed</li>
            </ul>
            <p>
              Records are held in a private server-side store, not in your browser and not publicly
              readable. Staff running distribution for the season can see the orders for their
              community; that is how a set gets handed to the right person on the day.
            </p>
            <p>
              Your email address is used for one thing: your order confirmation. There is no mailing
              list, and nothing is sold or passed to anyone outside the program. Confirmation sending
              is currently switched off — messages are written to a log rather than sent — and will be
              turned on when a sending domain is set up.
            </p>
            <p>
              Records are kept for the season and the reconciliation that follows it. To have yours
              removed, ask your community rep.
            </p>
          </Section>

          <Section id="contact" title="Questions">
            <p>
              Most things are answered on the{" "}
              <Link href="/faq" className="font-semibold text-leaf-800 underline underline-offset-4">questions page</Link>. For
              anything about your own order, your community rep is the fastest route — every rep is
              listed with a phone number on the{" "}
              <Link href="/#sites" className="font-semibold text-leaf-800 underline underline-offset-4">homepage</Link>.
            </p>
          </Section>
        </div>
      </article>
    </>
  );
}
