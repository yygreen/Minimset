import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { EXCHANGE_GUARANTEE, SEASON, SHIPPING, shippingAmount } from "@/lib/data";

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  title: "Questions - V'samachta Arba Minim",
  description:
    "How the V'samachta pre-order program works: what you receive, why a Rav picks your lulav, the replacement guarantee, shipping and when it arrives.",
};

const FAQ: { q: string; a: string[] }[] = [
  {
    q: "Why can't I pick my own lulav?",
    a: [
      "A Rav already inspected and approved every item in Eretz Yisrael before it was sealed. The esrog is boxed, the hadassim and aravos are in a sealed bag, and the lulav is sealed. You open it for the first time in your own sukkah.",
    ],
  },
  {
    q: "What if the set isn't worth the money?",
    a: [EXCHANGE_GUARANTEE, "Reserve stock is flown in for exactly this."],
  },
  {
    q: "When will it arrive?",
    a: [
      `${SEASON.deliveryNote} The shipment lands after Yom Kippur and orders go out to the addresses on them as it is unpacked.`,
      "You get a tracking number by email the day your box leaves, so you can see where it is as Yom Tov approaches.",
    ],
  },
  {
    q: "How much is shipping, and where do you ship?",
    a: [
      `One flat rate per order${shippingAmount() ? `, ${shippingAmount()}` : ""}, however many sets are on it. Your own set and Chinuch sets for the boys travel in one box for one charge.`,
      SHIPPING.carrierNote,
    ],
  },
  {
    q: "What exactly do I receive?",
    a: [
      "A complete set: esrog, lulav, hadassim and aravos, at the level you chose. The esrog comes in its own box, and the hadassim and aravos come together in a sealed bag.",
    ],
  },
  {
    q: "Can I order for my children?",
    a: [
      "Yes. The Kosher L'Bracha (Chinuch) set is $40, so every boy holds his own minim. One order can hold a Mehudar A-A for you and Chinuch sets for the boys.",
    ],
  },
  {
    q: "Who is behind this?",
    a: [
      "V'samachta has run this pre-order model in Eretz Yisrael for about seventeen years, starting in Meah Shearim. Kiryas Joel already runs the same system in America. This platform brings it to more American communities.",
    ],
  },
  {
    q: "Why do I pay in full up front?",
    a: [
      "Full payment before the deadline is what makes the numbers exact: the shipment is packed against real totals, not a guess. It also makes every buyer a partner in the minim brought in for the whole community.",
    ],
  },
  {
    q: "What if nobody is home when it arrives?",
    a: [
      "That is between you and the carrier — the tracking number lets you redirect it, hold it, or leave delivery instructions. Use an address where somebody can take a box before Yom Tov.",
    ],
  },
  {
    q: "Can I change or cancel my order?",
    a: [
      `Yes, any time before the deadline (${SEASON.deadlineLabelEt}), from your order page. A price difference is refunded or charged automatically. After the deadline the shipment is packed against the totals, but a wrong delivery address can still be corrected until the box leaves.`,
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a.join(" ") },
            })),
          }),
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Questions</p>
      <h1 className="mt-2 max-w-3xl font-display text-[2.5rem] font-bold leading-[1.05] text-ink-950 sm:text-[3.4rem]">
        New concept in America.
      </h1>
      <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-700">
        In Eretz Yisrael this is simply how Arba Minim are bought. Here is everything people ask
        before their first order.
      </p>

      <div className="mt-10">
        <Faq items={FAQ} />
      </div>

      <div className="mt-10 rounded-2xl bg-esrog-100 p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold text-ink-950">Still deciding?</h2>
        <p className="mt-2 text-[16px] leading-relaxed text-ink-900">
          The deadline is real. Once it passes and the shipment is packed, the season is closed.
        </p>
        <Link
          href="/#levels"
          className="mt-6 inline-flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-semibold text-white transition hover:bg-leaf-900"
        >
          Choose a set
        </Link>
      </div>
    </div>
    </>
  );
}
