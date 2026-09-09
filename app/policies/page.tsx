import type { Metadata } from "next";
import Link from "next/link";
import { EXCHANGE_GUARANTEE, SEASON, SHIPPING, shippingAmount } from "@/lib/data";
import { GRACE_MINUTES } from "@/lib/server/pricing";

export const metadata: Metadata = {
  alternates: { canonical: "/policies" },
  title: "Policies - V'samachta Arba Minim",
  description:
    "Ordering, payment, shipping and delivery, changes and cancellation, the replacement guarantee, and what the order form stores.",
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
  ["who", "Who you are buying from"],
  ["ordering", "Ordering"],
  ["payment", "Payment"],
  ["changes", "Changes and cancellation"],
  ["shipping", "Shipping and delivery"],
  ["guarantee", "The replacement guarantee"],
  ["privacy", "What we store about you"],
  ["contact", "Questions"],
] as const;

export default function PoliciesPage() {
  return (
    <>
      <section className="bg-sand-100 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Policies</p>
          <h1 className="mt-2 font-display text-[2.5rem] font-bold leading-[1.05] text-ink-950 sm:text-[3.4rem]">
            How ordering, paying and delivery work.
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
          <Section id="who" title="Who you are buying from">
            <p>
              V&#39;samachta Arba Minim is a trading name of Stam Mehudar Co., a Delaware
              corporation, of 123 Highgrove Crescent, Lakewood, NJ 08701, USA. Your order is a
              contract with that company, and that is the name that appears on your card
              statement.
            </p>
          </Section>

          <Section id="ordering" title="Ordering">
            <p>
              Orders are placed on this site for the {SEASON.name} season and are shipped to the
              address on the order. You choose your sets and how many, and give a name, a phone
              number, an email address and a delivery address.
            </p>
            <p>
              Every order is given a code. That code is how you look your order up and how you change
              it before the deadline.
            </p>
            <p>
              Ordering closes at the season deadline, <strong>{SEASON.deadlineLabelEt}</strong>. Prices
              are calculated on the server at the moment you order, never in your browser.
            </p>
          </Section>

          <Section id="payment" title="Payment">
            <p>
              Sets are paid for in full at the time of ordering, together with one flat shipping
              charge per order{shippingAmount() ? ` of ${shippingAmount()}` : ""}, however many
              sets are on it. The total is shown before you pay, and prices are calculated on the
              server, never in your browser.
            </p>
            <div className="rounded-2xl border border-esrog-300 bg-esrog-100 p-5 text-ink-900">
              <p className="font-display text-lg font-bold text-ink-950">Card processing is not live yet</p>
              <p className="mt-1 text-[15px] leading-relaxed">
                Orders are recorded on the server, but no card is charged until the operator connects
                a payment account in their own name. Exact charge timing and refund handling will be
                stated here once that account is connected.
              </p>
            </div>
          </Section>

          <Section id="changes" title="Changes and cancellation">
            <p>
              You can change or cancel your order, free, at any time up to the deadline. Reply to
              your confirmation email or get in touch quoting your order number, and we will change
              the sets or refund you in full. Your confirmation also carries a link to the order
              itself, where you can see exactly what is on it.
            </p>
            <p>
              After the deadline the shipment is packed against the final totals, so the site stops
              accepting changes. A cart that reached the payment step before the deadline may finish
              paying for up to {GRACE_MINUTES} minutes afterwards; nothing new can be started.
            </p>
            <p>
              Past the deadline, get in touch — the shipment is already packed against the totals,
              but a wrong delivery address can still be corrected until the box leaves.
            </p>
          </Section>

          <Section id="shipping" title="Shipping and delivery">
            <p>
              Every order ships to the address on it. {SHIPPING.carrierNote} Shipping is one flat
              charge per order{shippingAmount() ? `, ${shippingAmount()}` : ""}, however many sets
              are on it — your own set and the boys&#39; travel in the same box.
            </p>
            <p>
              {SEASON.deliveryNote} The shipment lands after Yom Kippur and orders go out as it is
              unpacked; you get a tracking number by email the day yours leaves. Delivery dates are
              the carrier&#39;s, not ours, so keep an eye on the tracking as Yom Tov approaches.
            </p>
            <p>
              Check the address before you pay. A package returned as undeliverable can be sent
              again, but the second shipping charge is yours and time is short.
            </p>
            <p>
              The sets fly in from Eretz Yisrael sealed: esrog in its box, hadassim and aravos in a
              sealed bag, lulav sealed. You open them in your sukkah.
            </p>
          </Section>

          <Section id="guarantee" title="The replacement guarantee">
            <p>{EXCHANGE_GUARANTEE}</p>
            <p>Reserve stock is flown in for exactly this.</p>
          </Section>

          <Section id="privacy" title="What we store about you">
            <p>An order record holds only what is needed to fill and hand over that order:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>your name, phone number and email address</li>
              <li>the delivery address for the order</li>
              <li>what you ordered, the total, and how you chose to pay</li>
              <li>your order code and the time it was placed</li>
            </ul>
            <p>
              Records are held in a private server-side store that only the program can read. Staff
              packing the season&#39;s shipment see the orders and their delivery addresses; that is
              how a set reaches the right door.
            </p>
            <p>
              Your email address is used for one thing: your order confirmation. There is no mailing
              list, and nothing is sold or passed to anyone outside the program. Confirmation sending
              is currently switched off: messages are written to a log, and sending begins once a
              sending domain is set up.
            </p>
            <p>
              Records are kept for the season and the reconciliation that follows it. To have yours
              removed, get in touch.
            </p>
          </Section>

          <Section id="contact" title="Questions">
            <p>
              Most things are answered on the{" "}
              <Link href="/#faq" className="font-semibold text-leaf-800 underline underline-offset-4">questions on the homepage</Link>. For
              anything about your own order, quote your order code and we can find it in seconds.
            </p>
          </Section>
        </div>
      </article>
    </>
  );
}
