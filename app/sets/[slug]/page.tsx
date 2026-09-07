import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/Faq";
import { EXCHANGE_GUARANTEE, LEVELS, SEASON, SITES, getLevelBySlug } from "@/lib/data";
import { IMG, type Photo } from "@/lib/images";
import { money } from "@/lib/orders";
import { Gallery } from "./Gallery";
import { ProductBar } from "./ProductBar";
import { Share } from "@/components/Share";
import { CompareTable } from "@/components/CompareTable";
import { OpenOnly } from "@/components/OpenOnly";
import { InspectedBy } from "@/components/InspectedBy";

export function generateStaticParams() {
  return LEVELS.map((l) => ({ slug: l.slug }));
}

const SEO: Record<string, { title: string; description: string }> = {
  "mehudar-aa": {
    title: "Mehudar A-A Lulav and Etrog Set, $100",
    description:
      "The finest complete lulav and etrog set in the V'samachta program: esrog clean of black dots with a gidul na'eh, lulav closed to the top, high-level shilush hadassim. Rav-inspected in Eretz Yisrael, sealed, collected after Yom Kippur.",
  },
  "mehudar-a": {
    title: "Mehudar A Lulav and Etrog Set, $65",
    description:
      "A full mehudar lulav and etrog set, the level most balabatim choose: esrog clean of black dots, lulav closed to the end, hadassim meshulash. Sorted by Morei Hora'ah, sealed, collected at your Beis Medrash after Yom Kippur.",
  },
  chinuch: {
    title: "Chinuch Lulav and Etrog Set for Boys, $40",
    description:
      "A kosher l'bracha lulav and etrog set for children, so every boy holds his own minim. Esrog clean of black dots, lulav mostly closed, hadassim mostly meshulash. Rav-inspected and sealed.",
  },
};

const PHOTOS: Record<string, { main: Photo; gallery: Photo[] }> = {
  "mehudar-aa": { main: IMG.hero, gallery: [IMG.levelAA, IMG.esrog, IMG.lulav, IMG.hadassim, IMG.aravos] },
  "mehudar-a": { main: IMG.levelA, gallery: [IMG.esrog, IMG.lulav, IMG.hadassim, IMG.aravos] },
  chinuch: { main: IMG.esrogCluster, gallery: [IMG.esrog, IMG.lulav, IMG.hadassim, IMG.aravos] },
};

const PROMISE: Record<string, string[]> = {
  "mehudar-aa": [
    "Sorted to the strictest standard in the program",
    "Reserve stock at pickup, exchanged on the spot if the Motz says so",
    "Sealed in Eretz Yisrael, opened only in your sukkah",
  ],
  "mehudar-a": [
    "A full mehudar set, sorted by the same Morei Hora'ah",
    "Pairs with Chinuch sets for the boys in one order",
    "Best value in the program",
  ],
  chinuch: [
    "Kosher l'bracha, so every boy holds his own minim",
    "Dignified, not a toy set",
    "Order several in one order with your own set",
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const level = getLevelBySlug(slug);
  if (!level) return { title: "Set not found" };
  const seo = SEO[slug];
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/sets/${slug}` },
    openGraph: { title: `${seo.title} | V'samachta Arba Minim`, description: seo.description, type: "website", images: [{ url: `/og-${slug}.jpg`, width: 1200, height: 630 }] },
  };
}

export default async function SetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const level = getLevelBySlug(slug);
  if (!level) notFound();
  const photos = PHOTOS[slug];
  const withPitom = level.pitomSurchargeCents ? level.basePriceCents + level.pitomSurchargeCents : null;

  const faq = [
    {
      q: "What is in the box?",
      a: ["A complete set: esrog, lulav, hadassim and aravos. The esrog in its own box, the hadassim and aravos together in a sealed bag, the lulav sealed."],
    },
    {
      q: "Who checked it?",
      a: ["Morei Hora'ah in Eretz Yisrael who are experts in hilchos Daled Minim. Every item is inspected and approved before it is sealed. A Moreh Hora'ah is also present at pickup."],
    },
    {
      q: "What if I am not satisfied at pickup?",
      a: [EXCHANGE_GUARANTEE],
    },
    {
      q: "Can I change my mind after ordering?",
      a: [`Yes, from your order page, any time before the deadline (${SEASON.deadlineLabelEt}). The difference is refunded or charged automatically.`],
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${level.name} Lulav and Etrog Set`,
    description: SEO[slug].description,
    image: [`https://4minimset.com${photos.main.src}`],
    brand: { "@type": "Brand", name: "V'samachta" },
    offers: {
      "@type": "Offer",
      price: (level.basePriceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      url: `https://4minimset.com/sets/${slug}`,
      priceValidUntil: SEASON.deadlineIso.slice(0, 10),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-4 text-[13px] text-ink-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="inline-block py-1 hover:text-leaf-800">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/#levels" className="inline-block py-1 hover:text-leaf-800">The sets</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-900">{level.name}</li>
        </ol>
      </nav>

      {/* ---------- PRODUCT ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-4 lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:pt-6">
        {/* gallery */}
        <Gallery
          photos={[photos.main, ...photos.gallery]}
          badge={level.key === "MEHUDAR_AA" ? "The finest" : undefined}
        />

        {/* buy box */}
        <div className="mt-8 lg:mt-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">{level.tier}</p>
          <h1 className="mt-2 font-display text-[2.3rem] font-bold leading-[1.05] text-ink-950 sm:text-[2.9rem]">
            {level.name}
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-700">{level.headline}</p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="tnum font-display text-[3rem] font-bold leading-none text-leaf-900">
              {money(level.basePriceCents)}
            </span>
            <span className="text-[15px] text-ink-500">per complete set</span>
          </div>
          {withPitom && (
            <p className="mt-2 text-[15px] text-ink-700">
              {money(withPitom)} with a pitom. You choose at checkout.
            </p>
          )}

          <ul className="mt-6 space-y-2.5">
            {[...PROMISE[slug], "No shipping, no fees. Collect at your Beis Medrash", `Change or cancel free until ${SEASON.deadlineLabelEt.replace(", 8:30 PM EDT", "")}`].map((line) => (
              <li key={line} className="flex items-start gap-3 text-[15px] text-ink-900">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6.2l2.6 2.6L10 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {line}
              </li>
            ))}
          </ul>

          <OpenOnly closed={
              <div id="order" className="mt-8 scroll-mt-24 rounded-2xl border border-esrog-300 bg-esrog-100 p-5 sm:p-6">
                <p className="font-display text-xl font-bold text-ink-950">Registration for {SEASON.name} has closed.</p>
                <p className="mt-1 text-[14px] text-ink-700">The shipment is packed against the final totals. Already ordered? Your pickup details are on your order page.</p>
                <Link href="/order" className="mt-4 inline-flex h-12 items-center rounded-lg bg-leaf-800 px-6 text-[15px] font-semibold text-white">Find my order</Link>
              </div>
          }>
          {/* community picker = the buy button */}
          <div id="order" className="mt-8 scroll-mt-24 rounded-2xl border border-sand-200 bg-white p-5 shadow-card sm:p-6">
            <p className="font-display text-xl font-bold text-ink-950">Order for your community</p>
            <p className="mt-1 text-[14px] text-ink-700">
              Pick where you will collect. Then choose how many sets.
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-2.5">
              {SITES.map((site) => (
                <li key={site.slug}>
                  <Link
                    href={`/${site.slug}/order?level=${level.key}`}
                    className="flex h-14 items-center justify-between rounded-lg border-2 border-leaf-800 px-4 text-[15px] font-semibold text-leaf-900 transition hover:bg-leaf-800 hover:text-white"
                  >
                    {site.name}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-ink-500">
              Orders close {SEASON.deadlineLabelEt}. Your set is ready for pickup on{" "}
              {new Date(`${SITES[0].distributionDateIso}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, 10:00 AM to 5:00 PM, the day after Yom Kippur.
            </p>
          </div>

          </OpenOnly>
          <ul className="mt-5 grid grid-cols-3 gap-3 text-center text-[12px] font-semibold text-ink-700">
            <li className="rounded-lg bg-sand-100 px-2 py-3">Rav-inspected</li>
            <li className="rounded-lg bg-sand-100 px-2 py-3">Sealed in Eretz Yisrael</li>
            <li className="rounded-lg bg-sand-100 px-2 py-3">Exchanged on the spot</li>
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <p className="text-[13px] text-ink-500">Know someone who needs a set?</p>
            <Share
              compact
              path={`/sets/${slug}`}
              text={`${level.name} lulav and esrog set, ${money(level.basePriceCents)}, Rav-inspected and sealed, pickup after Yom Kippur:`}
            />
          </div>
        </div>
      </section>

      {/* ---------- THE STANDARD ---------- */}
      <section className="border-y border-sand-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">The standard</p>
            <h2 className="mt-2 font-display text-[1.9rem] font-bold leading-tight text-ink-950 sm:text-[2.4rem]">
              What {level.name} means, word for word.
            </h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-ink-700">
              This is the sorting standard the Morei Hora&#39;ah work to, exactly as the program
              writes it. Nothing summarized.
            </p>
          </div>
          <ul className="mt-8 space-y-5 lg:mt-0">
            {(
              [
                ["Esrog", level.spec.esrog, IMG.esrog],
                ["Lulav", level.spec.lulav, IMG.lulav],
                ["Hadassim", level.spec.hadassim, IMG.hadassim],
              ] as const
            ).map(([term, text, photo]) => (
              <li key={term} className="flex gap-4 rounded-2xl border border-sand-200 bg-sand-50 p-4 sm:p-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand-100 sm:h-24 sm:w-24">
                  <Image src={photo.src} alt={photo.alt} fill sizes="96px" className="object-cover" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink-950">{term}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-700">{text}</p>
                </div>
              </li>
            ))}
            <li className="flex gap-4 rounded-2xl border border-sand-200 bg-sand-50 p-4 sm:p-5">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand-100 sm:h-24 sm:w-24">
                <Image src={IMG.aravos.src} alt={IMG.aravos.alt} fill sizes="96px" className="object-cover" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink-950">Aravos</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-700">
                  Fresh, sealed together with the hadassim in a securely sealed bag.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <InspectedBy />

      {/* ---------- GUARANTEE ---------- */}
      <section className="bg-esrog-100 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-900">At pickup</p>
            <h2 className="mt-2 font-display text-[1.9rem] font-bold leading-tight text-ink-950 sm:text-[2.4rem]">
              The Motz is in the room.
            </h2>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-ink-900">{EXCHANGE_GUARANTEE}</p>
            <Link
              href="#order"
              className="mt-6 inline-flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-semibold text-white transition hover:bg-leaf-900"
            >
              Order {level.name} - {money(level.basePriceCents)}
            </Link>
          </div>
          <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl shadow-lift lg:mt-0">
            <Image src={IMG.community.src} alt={IMG.community.alt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ---------- COMPARE ---------- */}
      <section id="compare" className="scroll-mt-20 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Compare</p>
          <h2 className="mt-2 font-display text-[1.9rem] font-bold leading-tight text-ink-950 sm:text-[2.4rem]">
            The three standards, side by side.
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-700">
            Same Morei Hora&#39;ah, same sealed box. Only the sorting differs. Word for word, as the
            program writes it.
          </p>
          <div className="mt-8">
            <CompareTable current={level.key} />
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="border-t border-sand-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-[1.9rem] font-bold leading-tight text-ink-950 sm:text-[2.4rem]">
            Questions about this set
          </h2>
          <div className="mt-6">
            <Faq items={faq} />
          </div>
        </div>
      </section>

      <ProductBar name={level.name} price={money(level.basePriceCents)} />
    </>
  );
}
