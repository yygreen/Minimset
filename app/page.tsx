import Image from "next/image";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { OrderLink } from "@/components/OrderLink";
import { LevelCard } from "@/components/LevelCard";
import { OpenOnly } from "@/components/OpenOnly";
import { Share } from "@/components/Share";
import { CompareTable } from "@/components/CompareTable";
import { EXCHANGE_GUARANTEE, LEVELS, PARTNERSHIP_PARAGRAPH, SEASON, SHIPPING, headlinePriceCents, altPriceCents, shippingAmount } from "@/lib/data";
import { IMG, type Photo } from "@/lib/images";
import { money } from "@/lib/orders";
import { MEDIA } from "@/lib/trust";
import { InspectedBy } from "@/components/InspectedBy";
import { InspectionClip } from "@/components/InspectionClip";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const MINIM = [
  { key: "esrog", name: "Esrog", hebrew: "אתרוג", line: "Boxed on its own, pitom and all.", photo: IMG.esrog },
  { key: "lulav", name: "Lulav", hebrew: "לולב", line: "Closed to the top. Sealed.", photo: IMG.lulav },
  { key: "hadassim", name: "Hadassim", hebrew: "הדסים", line: "Meshulash, the length of the branch.", photo: IMG.hadassim },
  { key: "aravos", name: "Aravos", hebrew: "ערבות", line: "Fresh, in a sealed bag with the hadassim.", photo: IMG.aravos },
];

/* Carried over from the retired /sets/[slug] pages, unchanged. The promises are
   the operator's own selling points per level; the standards themselves stay in
   lib/data.ts and are never paraphrased. */
const LEVEL_DETAIL: Record<string, { photo: Photo; promises: string[] }> = {
  "mehudar-aa": {
    photo: IMG.levelAA,
    promises: [
      "Sorted to the strictest standard in the program",
      "Reserve stock held back, so a set that falls short is replaced",
      "Sealed in Eretz Yisrael, opened only in your sukkah",
    ],
  },
  "mehudar-a": {
    photo: IMG.levelA,
    promises: [
      "A full mehudar set, sorted by the same Morei Hora'ah",
      "Pairs with Chinuch sets for the boys in one order",
      "Best value in the program",
    ],
  },
  chinuch: {
    photo: IMG.esrogCluster,
    promises: [
      "Kosher l'bracha, so every boy holds his own minim",
      "Dignified, not a toy set",
      "Order several in one order with your own set",
    ],
  },
};

const STEPS = [
  { n: "1", title: "Order and pay", body: `Choose your sets and where they go. Pay in full before ${SEASON.deadlineLabelEt}.` },
  { n: "2", title: "The Rabbanim sort", body: "Morei Hora'ah in Eretz Yisrael select and inspect every item. Nothing is packed until it passes." },
  { n: "3", title: "It flies in sealed", body: "Esrog boxed, hadassim and aravos bagged, lulav sealed. One day in the air." },
  { n: "4", title: "It ships to your door", body: "Boxed and tracked the moment it lands, addressed to you. In time to open it in your own sukkah." },
];

const FAQ = [
  {
    q: "Why can't I pick my own lulav?",
    a: [
      "Because a Rav already did. Every item is inspected and approved in Eretz Yisrael by Morei Hora'ah who are experts in hilchos Daled Minim, then sealed. You take it home and open it in your sukkah.",
    ],
  },
  {
    q: "What if the set is not worth what I paid?",
    a: ["Tell us and it is replaced from the reserve stock held back for exactly that. You do not argue the point and you are not left with it."],
  },
  {
    q: "What exactly is in a set?",
    a: ["All four: esrog, lulav, hadassim and aravos. The esrog in a box, the hadassim and aravos in a sealed bag, the lulav sealed. What changes between levels is how strictly each item was sorted."],
  },
  {
    q: "Can I order for my children?",
    a: ["Yes. The Kosher L'Bracha (Chinuch) set is $40, so every boy holds his own minim. One order can hold a Mehudar A-A for you and Chinuch sets for the boys."],
  },
  {
    q: "When will it arrive?",
    a: ["Every set ships in time to arrive before Yom Tov. The shipment lands after Yom Kippur and goes straight out to the addresses on the orders; you get a tracking number by email the day yours leaves."],
  },
  {
    q: "How much is shipping?",
    a: ["One flat rate per order, added at checkout, however many sets are on it. A set for you and Chinuch sets for the boys travel in one box for one shipping charge."],
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
      "Full payment before the deadline is what makes the numbers exact: the shipment is packed against real totals, not a guess. It also makes every buyer a partner in the minim brought in for the season.",
    ],
  },
  {
    q: "What if nobody is home when it arrives?",
    a: [
      "That is between you and the carrier - the tracking number lets you redirect it, hold it, or leave delivery instructions. Use an address where somebody can take a box before Yom Tov.",
    ],
  },
  {
    q: "Can I change or cancel my order?",
    a: [
      `Yes, any time before the deadline (${SEASON.deadlineLabelEt}), from your order page. A price difference is refunded or charged automatically. After the deadline the shipment is packed against the totals, but a wrong delivery address can still be corrected until the box leaves.`,
    ],
  },
  {
    q: "Why can't the deadline move?",
    a: [
      "The whole season travels as one shipment. When orders close the totals are pulled, that exact quantity is packed in Eretz Yisrael, and it flies in together with reserve stock for exchanges. Everything ordered by the deadline is on that flight.",
    ],
  },
];

/** Short labels for the hero's price ladder; the figures come from LEVELS. */
const SHORT_NAME: Record<string, string> = {
  CHINUCH: "Chinuch",
  MEHUDAR_A: "Mehudar A",
  MEHUDAR_AA: "Mehudar A-A",
};

export default function HomePage() {
  const from = Math.min(...LEVELS.map((l) => l.basePriceCents)) / 100;

  /* The hero used to promise "from $40" and then open on a $110 set. $40 is the
     child's Chinuch set; a man buying for himself pays $65 or $110. Three real
     prices, cheapest first, cost one line and never contradict the page. */
  const ladder = [...LEVELS]
    .sort((a, b) => headlinePriceCents(a) - headlinePriceCents(b))
    .map((l) => `${SHORT_NAME[l.key] ?? l.name} $${headlinePriceCents(l) / 100}`)
    .join(" \u00b7 ");

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "V'samachta Arba Minim",
      url: "https://4minimset.com",
      logo: "https://4minimset.com/og.jpg",
      description:
        "Pre-order program for complete lulav and etrog sets sorted by Morei Hora'ah in Eretz Yisrael and shipped sealed to your door in the United States.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a.join(" ") },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Lulav and etrog sets",
      itemListElement: LEVELS.map((l, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://4minimset.com/#${l.slug}`,
        name: `${l.name} lulav and etrog set`,
      })),
    },
    /* The three sets used to carry Product markup on their own pages. The pages
       are gone; the markup has to stay, so it moves here against the anchors. */
    ...LEVELS.map((l) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${l.name} lulav and etrog set`,
      description: l.headline,
      url: `https://4minimset.com/#${l.slug}`,
      brand: { "@type": "Brand", name: "V'samachta Arba Minim" },
      offers: {
        "@type": "Offer",
        price: (headlinePriceCents(l) / 100).toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/PreOrder",
        priceValidUntil: SEASON.deadlineIso,
        url: "https://4minimset.com/#levels",
      },
    })),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-white">
        {/* A photo block above the text on phones; a two-column grid on desktop.
            A grid rather than an absolutely positioned panel because the type
            used to sit in a centred max-w-6xl container while the photo was
            positioned against the viewport: the two measured from different
            origins, so giving the picture more width risked running it under
            the headline. Here the columns divide the full width between them
            and cannot overlap, so the split is a number we can simply choose.
            The type keeps the page's left margin via the padding below.
            Near-black and leaf-green type needs plain ground, not a scrim, so
            only the photo's leading edge is faded into the white. */}
        {/* The photo is positioned rather than gridded so it can reach further
            left than the type does. A grid could not: its columns cannot
            overlap, so every pixel given to the picture was taken from the
            headline. Here the panel slides under the type, and the ramp below
            is opaque across exactly the part it passes behind. */}
        <div className="relative aspect-[16/11] w-full sm:aspect-[16/9] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[60%]">
            <Image
              src={IMG.hero.src}
              alt={IMG.hero.alt}
              fill
              priority
              fetchPriority="high"
              decoding="sync"
              quality={70}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover object-[58%_45%]"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent lg:hidden" />
            <div className="photo-veil absolute inset-0 hidden lg:block" />
          </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-4 sm:pb-16 sm:pt-6 lg:pb-28 lg:pt-24">
          <div className="max-w-xl lg:max-w-[30rem]">
            <OpenOnly
              closed={
                <p className="rise inline-flex items-center gap-2 rounded-full border border-sand-300 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-alert-800" />
                  {SEASON.name} registration closed
                </p>
              }
            >
              <p className="rise inline-flex items-center gap-2 rounded-full border border-esrog-300 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-esrog-900">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-600" />
                {SEASON.name} pre-order is open
              </p>
            </OpenOnly>
            <h1 className="rise rise-2 mt-5 font-display text-[2.5rem] font-bold leading-[1.04] text-ink-950 sm:text-[3.4rem] lg:text-[3rem] xl:text-[3.5rem]">
              Your Arba Minim, chosen by a Rav.
              <span className="block text-leaf-800">Delivered to your door.</span>
            </h1>
            <p className="rise rise-3 mt-5 max-w-md text-[17px] leading-relaxed text-ink-700 sm:text-lg">
              Mehudar sets from Eretz Yisrael, sealed in the box they were packed in and shipped
              to your address. The system Meah Shearim and Kiryas Joel already use, now anywhere
              in the country.
            </p>

            <OpenOnly closed={
              <div className="rise rise-4 mt-7 rounded-2xl border border-esrog-300 bg-esrog-100 p-5">
                <p className="font-display text-xl font-bold text-ink-950">Registration for {SEASON.name} has closed.</p>
                <p className="mt-1 text-[15px] text-ink-700">
                  The shipment is packed against the final totals. Already ordered? Your delivery
                  details and tracking are in your confirmation email.
                </p>
              </div>
            }>
            <div className="rise rise-4 mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <OrderLink className="flex h-14 items-center justify-center rounded-lg bg-leaf-800 px-8 text-[17px] font-semibold text-white shadow-lift transition hover:bg-leaf-900">
                Order your set
              </OrderLink>
              {/* The nearer question is "what do I get for $65 rather than
                  $110", which is the sets, not the logistics. */}
              <Link
                href="#levels"
                className="flex h-12 items-center justify-center rounded-lg px-4 text-[15px] font-semibold text-leaf-900 underline underline-offset-4 sm:h-14 sm:border sm:border-ink-900/15 sm:bg-white/80 sm:px-7 sm:text-[16px] sm:text-ink-900 sm:no-underline sm:transition sm:hover:border-leaf-800 sm:hover:text-leaf-800"
              >
                See the three sets
              </Link>
            </div>
            <p className="rise rise-4 tnum mt-3 text-[14px] font-semibold text-ink-700">{ladder}</p>

            </OpenOnly>
          </div>
        </div>
      </section>

      {/* ---------- TRUST STRIP ---------- */}
      <section className="border-y border-sand-200 bg-white">
        <ul className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-sand-200 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            {
              k: "Rav-inspected",
              v: "Every item approved by Morei Hora'ah before it is sealed",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M7.5 10.8l2 2 3.6-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              k: "Sealed and boxed",
              v: "Esrog in its box, hadassim and aravos bagged, lulav sealed",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3.5 8.5 12 4l8.5 4.5v8L12 21l-8.5-4.5v-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M3.5 8.5 12 13l8.5-4.5M12 13v8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              k: "Replaced if it falls short",
              v: "If what arrives is not worth the price, it is replaced from reserve stock at our cost",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 9h13l-3-3M20 15H7l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
          ].map(({ k, v, icon }) => (
            <li key={k} className="flex items-start gap-3.5 py-4 sm:px-6 sm:py-5 sm:first:pl-0 sm:last:pr-0">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
                {icon}
              </span>
              <div>
                <p className="font-display text-[17px] font-bold text-ink-950">{k}</p>
                <p className="mt-0.5 text-[14px] leading-snug text-ink-700">{v}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <InspectedBy />

      {/* ---------- THE SETS ---------- */}
      <section id="levels" className="scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">The sets</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              Three levels of hiddur. Every one a complete set.
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
              Esrog, lulav, hadassim and aravos in each. The levels differ only in how strictly each
              item was sorted.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-3 md:gap-6">
            {LEVELS.map((level, i) => (
              <LevelCard key={level.key} level={level} featured={i === 0} />
            ))}
          </div>

          <p className="mt-6 text-[14px] text-ink-500">
            One order can hold several sets. A Mehudar A-A for you and Chinuch sets for the boys is
            the usual order.
          </p>

          {/* The compare table sits with the cards rather than in a section of
              its own: the question it answers -- which level -- is the one the
              cards have just raised. */}
          <div id="compare" className="mt-12 scroll-mt-20 border-t border-sand-200 pt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Compare</p>
            <h3 className="mt-2 font-display text-[1.9rem] font-bold leading-tight text-ink-950 sm:text-[2.3rem]">
              The three standards, side by side.
            </h3>
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-700">
              Same Morei Hora&#39;ah, same sealed box. Only the sorting differs. Word for word, as the
              program writes it.
            </p>
            <div className="mt-8">
              <CompareTable />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- EACH SET, IN FULL ---------- */}
      {/* What the three /sets/[slug] pages carried: the photo, the promises and
          the sorting standard word for word. One block per level, anchored so
          the old product URLs still have somewhere to point. */}
      <section className="border-t border-sand-200 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl space-y-14 px-4 sm:space-y-20">
          {LEVELS.map((level, i) => {
            const detail = LEVEL_DETAIL[level.slug];
            return (
              <article key={level.key} id={level.slug} className="scroll-mt-20">
                <div className={`lg:grid lg:items-start lg:gap-12 ${i % 2 ? "lg:grid-cols-[1.2fr_1fr]" : "lg:grid-cols-[1fr_1.2fr]"}`}>
                  <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand-100 shadow-lift ${i % 2 ? "lg:order-2" : ""}`}>
                    <Image
                      src={detail.photo.src}
                      alt={detail.photo.alt}
                      fill
                      sizes="(min-width: 1024px) 520px, 100vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="mt-6 lg:mt-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">{level.tier}</p>
                    <h3 className="mt-2 font-display text-[1.9rem] font-bold leading-tight text-ink-950 sm:text-[2.4rem]">
                      {level.name}
                    </h3>
                    <p className="mt-3 text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">{level.headline}</p>

                    <p className="mt-5 font-display text-3xl font-bold text-esrog-900">
                      {money(headlinePriceCents(level))}
                      <span className="ml-2 align-middle text-[14px] font-semibold text-ink-500">per set</span>
                    </p>
                    {altPriceCents(level) != null && (
                      <p className="mt-1 text-[14px] text-ink-500">
                        {money(altPriceCents(level)!)} without a pitom.
                      </p>
                    )}

                    <ul className="mt-5 space-y-2">
                      {detail.promises.map((line) => (
                        <li key={line} className="flex gap-2.5 text-[15px] leading-snug text-ink-700">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-leaf-800">
                            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {line}
                        </li>
                      ))}
                    </ul>

                    <OpenOnly>
                      <OrderLink
                        level={level.key}
                        className="mt-7 inline-flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-semibold text-white transition hover:bg-leaf-900"
                      >
                        Order {level.name}
                      </OrderLink>
                    </OpenOnly>
                  </div>
                </div>

                {/* the standard, word for word */}
                <div className="mt-8 rounded-2xl border border-sand-200 bg-sand-50 p-5 sm:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
                    The standard, word for word
                  </p>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        ["Esrog", level.spec.esrog],
                        ["Lulav", level.spec.lulav],
                        ["Hadassim", level.spec.hadassim],
                        ["Aravos", "Fresh, sealed together with the hadassim in a securely sealed bag."],
                      ] as const
                    ).map(([term, text]) => (
                      <div key={term}>
                        <dt className="font-display text-lg font-bold text-ink-950">{term}</dt>
                        <dd className="mt-0.5 text-[15px] leading-relaxed text-ink-700">{text}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------- FOUR MINIM ---------- */}
      <section id="minim" className="scroll-mt-20 border-y border-sand-200 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">In every box</p>
              <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
                Four minim. Sorted in Eretz Yisrael, sealed before they fly.
              </h2>
            </div>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 lg:grid-cols-4 lg:gap-5">
            {MINIM.map((m) => (
              <li key={m.key} className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand-100">
                  <Image
                    src={m.photo.src}
                    alt={m.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 280px, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <span
                    dir="rtl"
                    className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-0.5 font-display text-base font-bold text-ink-950"
                  >
                    {m.hebrew}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-ink-950">{m.name}</h3>
                <p className="mt-0.5 text-[14px] leading-snug text-ink-700">{m.line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">How it works</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              No table. No picking. No guessing.
            </h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
              In Eretz Yisrael this is simply how Arba Minim are bought. The picking is done for you,
              by Rabbanim, before the set ever leaves.
            </p>
            {MEDIA.inspectionClip ? (
              <InspectionClip className="mt-8" />
            ) : (
              <div className="relative mt-8 hidden aspect-[4/3] overflow-hidden rounded-2xl lg:block">
                <Image
                  src={IMG.inspection.src}
                  alt={IMG.inspection.alt}
                  fill
                  sizes="(min-width: 1024px) 520px, 100vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <ol className="mt-8 space-y-3 lg:mt-0">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-esrog-200 font-display text-lg font-bold text-esrog-900">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink-950">{s.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-700">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- THE PARTNERSHIP ---------- */}
      {/* The operator's own account of what this is: a communal order that people
          join. Everything that follows -- the two ways in and the immovable
          deadline -- only makes sense once that is said, so it belongs here and
          not only on /about. */}
      <section className="border-t border-sand-200 bg-sand-100 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
            What this actually is
          </p>
          <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
            One shipment, brought in together.
          </h2>
          {/* The two paragraphs run as columns rather than one stacked block: that
              fills the width the section is given without pushing a single line of
              body text across 1100px. */}
          <div className="mt-5 grid gap-x-10 gap-y-4 text-[17px] leading-relaxed lg:grid-cols-2 lg:gap-x-14">
            <p className="text-ink-900">{PARTNERSHIP_PARAGRAPH}</p>
            <p className="text-ink-700">
              Orders are counted, one shipment is packed against those totals in Eretz Yisrael,
              and every set goes out to the address on its order. It is how Arba Minim have been
              bought in Meah Shearim for years.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 md:gap-6">
            <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card sm:p-7">
              <h3 className="font-display text-xl font-bold text-ink-950 sm:text-2xl">
                One order, one box
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
                Ordering takes about three minutes. Everything on the order travels together -
                your own set and a Chinuch set for each boy - in one box, for one shipping charge.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
                You get a code the moment you pay. It opens your order on any phone, and it is
                the reference to quote if anything needs a word.
              </p>
            </div>

            <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card sm:p-7">
              <h3 className="font-display text-xl font-bold text-ink-950 sm:text-2xl">
                Why the deadline does not move
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
                Nothing is bought before orders close. When they do, the totals are pulled - how
                many lulavim, how many hadassim, how many esrogim at each level - and that is what
                gets packed and flown, along with reserve stock for replacements.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
                Everything ordered by the deadline is on that flight. Anything after it waits for
                next year.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ---------- GUARANTEE ---------- */}
      <section className="bg-esrog-100 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-900">The guarantee</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              The Motz is in the room.
            </h2>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-ink-900">{EXCHANGE_GUARANTEE}</p>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-700">
              Reserve stock flies in for exactly this. Kasher v&#39;yashar, one hundred percent, and you
              rely on the Rabbanim who bring it.
            </p>
            <Link
              href="#levels"
              className="mt-7 inline-flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-semibold text-white transition hover:bg-leaf-900"
            >
              Choose a set
            </Link>
          </div>
          <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl shadow-lift lg:mt-0">
            <Image
              src={IMG.community.src}
              alt={IMG.community.alt}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ---------- DELIVERY ---------- */}
      <section id="delivery" className="scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Delivery</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              It comes to you.
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
              No collection point, no drive, no window to make. The shipment lands after Yom
              Kippur and every order goes straight out to the address on it.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {[
              {
                title: "Anywhere in the country",
                body: SHIPPING.carrierNote,
              },
              {
                title: "One flat rate",
                body: `${shippingAmount() ?? "Added at checkout"}, however many sets are on the order. Yours and the boys' travel in one box.`,
              },
              {
                title: "Tracked from the door",
                body: "You get a tracking number by email the day your box leaves, so you know when to expect it.",
              },
              {
                title: "In time for Yom Tov",
                body: SEASON.deliveryNote + " Sealed as it was packed in Eretz Yisrael, opened in your sukkah.",
              },
            ].map((card) => (
              <article
                key={card.title}
                className="flex flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-6"
              >
                <h3 className="font-display text-lg font-bold text-ink-950 sm:text-xl">{card.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-700">{card.body}</p>
              </article>
            ))}
          </div>

          <OpenOnly>
            <OrderLink className="mt-8 inline-flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-8 text-[16px] font-semibold text-white transition hover:bg-leaf-900">
              Order your set
            </OrderLink>
          </OpenOnly>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="scroll-mt-20 border-t border-sand-200 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Questions</p>
          <h2 className="mt-2 max-w-3xl font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
            New concept in America. Old news in Yerushalayim.
          </h2>
          <div className="mt-10">
            <Faq items={FAQ} />
          </div>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src={IMG.set.src} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-sand-50/88" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h2 className="mx-auto max-w-2xl font-display text-[2.1rem] font-bold leading-tight text-ink-950 sm:text-[2.8rem]">
            Order before Motzaei Shabbos. Open your box in your sukkah.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[16px] text-ink-700">
            Sets from ${from}. Sealed, inspected, and shipped to your door.
          </p>
          <OrderLink className="mt-7 inline-flex h-14 items-center justify-center rounded-lg bg-leaf-800 px-9 text-[17px] font-semibold text-white shadow-lift transition hover:bg-leaf-900">
            Order your set
          </OrderLink>
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-[13px] text-ink-500">Pass it on to your shul chat</p>
            <Share
              compact
              path="/"
              text="Rav-inspected Arba Minim sets from Eretz Yisrael, sealed and shipped to your door before Yom Tov. Sets from $40:"
            />
          </div>
        </div>
      </section>
    </>
  );
}
