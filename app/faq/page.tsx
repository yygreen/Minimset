import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { EXCHANGE_GUARANTEE, SEASON } from "@/lib/data";

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  title: "Questions - V'samachta Arba Minim",
  description:
    "How the V'samachta pre-order program works: what you receive, why a Rav picks your lulav, the exchange guarantee at pickup, and when to collect.",
};

const FAQ: { q: string; a: string[] }[] = [
  {
    q: "Why can't I pick my own lulav?",
    a: [
      "A Rav already inspected and approved every item in Eretz Yisrael before it was sealed. The esrog is boxed, the hadassim and aravos are in a sealed bag, and the lulav is sealed. You open it for the first time in your own sukkah.",
    ],
  },
  {
    q: "What if the Motz says it's not worth the money?",
    a: [EXCHANGE_GUARANTEE, "Reserve stock is shipped for exactly this. You are never asked to come back another day."],
  },
  {
    q: "When and where do I pick up?",
    a: [
      "The day after Yom Kippur, at your community's host Beis Medrash, 10:00 AM to 5:00 PM. Your confirmation has the exact address for your site. The whole community is served in two to three hours with a card system.",
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
    q: "What if I can't make the pickup window?",
    a: ["Send someone with your code. If nobody can come, call your community rep before the window closes."],
  },
  {
    q: "Can I change or cancel my order?",
    a: [
      `Yes, any time before the deadline (${SEASON.deadlineLabelEt}), from your order page. A price difference is refunded or charged automatically. After the deadline, changes go through your community rep.`,
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
