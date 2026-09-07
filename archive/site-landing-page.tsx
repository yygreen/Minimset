import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/Countdown";
import { Faq } from "@/components/Faq";
import { LevelCard } from "@/components/LevelCard";
import { OpenOnly } from "@/components/OpenOnly";
import { EXCHANGE_GUARANTEE, LEVELS, SEASON, SITES, getSite } from "@/lib/data";
import { IMG } from "@/lib/images";
import { Share } from "@/components/Share";

export function generateStaticParams() {
  return SITES.map((s) => ({ site: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ site: string }>;
}): Promise<Metadata> {
  const { site: slug } = await params;
  const site = getSite(slug);
  if (!site) return { title: "Site not found" };
  const title = `Lulav and Etrog Sets in ${site.name}, ${site.state}: Pre-Order, Pick Up After Yom Kippur`;
  const description = `Complete Arba Minim sets for ${site.name} from $40: esrog, lulav, hadassim and aravos, sorted by Morei Hora'ah in Eretz Yisrael and sealed. Pick up at ${site.hostInstitution}, ${site.windowStart} to ${site.windowEnd} the day after Yom Kippur. Orders close ${SEASON.deadlineLabelEt}.`;
  return {
    title,
    description,
    alternates: { canonical: `/${site.slug}` },
    openGraph: { title, description, type: "website", images: [{ url: `/og-${site.slug}.jpg`, width: 1200, height: 630 }] },
  };
}

export default async function SitePage({ params }: { params: Promise<{ site: string }> }) {
  const { site: slug } = await params;
  const site = getSite(slug);
  if (!site) notFound();

  const distributionLabel = new Date(`${site.distributionDateIso}T12:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  );
  const from = Math.min(...LEVELS.map((l) => l.basePriceCents)) / 100;
  const address = `${site.addressLines.join(", ")}, ${site.city}, ${site.state} ${site.zip}`;

  const faq = [
    {
      q: `Where do I pick up in ${site.name}?`,
      a: [`At ${site.hostInstitution}, ${address}. ${distributionLabel}, ${site.windowStart} to ${site.windowEnd}. Bring your pickup code; anyone can collect for you with it.`],
    },
    {
      q: "Do I get to choose my esrog?",
      a: ["No, and that is the point. Morei Hora'ah in Eretz Yisrael sort and approve every item before it is sealed. What you open in your sukkah is what a Rav already chose. If the Motz at pickup rules an item is not worth what you paid, it is exchanged on the spot."],
    },
    {
      q: "Can I order for the whole family in one go?",
      a: ["Yes. One order can hold a Mehudar A-A for you and Chinuch sets for the boys. Pay once, one code, one pickup."],
    },
    {
      q: `Who do I call in ${site.name}?`,
      a: [`${site.repName}, ${site.repPhone}. He is the local rep and runs the pickup table.`],
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: `Arba Minim distribution, ${site.name}`,
      description: `Pickup of pre-ordered lulav and etrog sets at ${site.hostInstitution}, the day after Yom Kippur.`,
      startDate: `${site.distributionDateIso}T10:00:00-04:00`,
      endDate: `${site.distributionDateIso}T17:00:00-04:00`,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: site.hostInstitution,
        address: {
          "@type": "PostalAddress",
          streetAddress: site.addressLines.join(", "),
          addressLocality: site.city,
          addressRegion: site.state,
          postalCode: site.zip,
          addressCountry: "US",
        },
      },
      organizer: { "@type": "Organization", name: "V'samachta Arba Minim", url: "https://4minimset.com" },
      offers: {
        "@type": "Offer",
        url: `https://4minimset.com/${site.slug}/order`,
        price: from.toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/PreOrder",
        validThrough: SEASON.deadlineIso,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a.join(" ") },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://4minimset.com/" },
        { "@type": "ListItem", position: 2, name: site.name, item: `https://4minimset.com/${site.slug}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-sand-100">
        <div className="relative aspect-[16/10] w-full sm:aspect-[16/8] lg:absolute lg:inset-0 lg:left-auto lg:aspect-auto lg:w-[52%]">
          <Image
            src={IMG.set.src}
            alt={IMG.set.alt}
            fill
            priority
            fetchPriority="high"
            decoding="sync"
            quality={70}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-sand-100 to-transparent lg:hidden" />
          <div className="photo-veil absolute inset-0 hidden lg:block" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-3 sm:pb-16 sm:pt-5 lg:pb-24 lg:pt-20">
          <div className="max-w-xl">
            <Link
              href="/#sites"
              className="inline-flex items-center gap-1.5 py-1.5 text-[13px] font-semibold text-ink-700 transition hover:text-leaf-800"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M7.5 2L3 6l4.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All communities
            </Link>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
              {SEASON.name} - {site.city}, {site.state}
            </p>
            <h1 className="mt-2 font-display text-[2.5rem] font-bold leading-[1.05] text-ink-950 sm:text-[3.3rem] lg:text-[3.8rem]">
              Lulav and esrog sets for {site.name}.
              <span className="block text-leaf-800">Pick up after Yom Kippur.</span>
            </h1>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-700">
              Sorted by a Rav in Eretz Yisrael, sealed, and handed to you at {site.hostInstitution}.
              Sets from ${from}.
            </p>

            <OpenOnly closed={
              <div className="mt-7 rounded-2xl border border-esrog-300 bg-esrog-100 p-5">
                <p className="font-display text-xl font-bold text-ink-950">Registration for {SEASON.name} has closed.</p>
                <p className="mt-1 text-[15px] text-ink-700">Already ordered? Your pickup details are on your order page. Questions: {site.repName}, {site.repPhone}.</p>
                <Link href="/order" className="mt-4 inline-flex h-12 items-center rounded-lg bg-leaf-800 px-6 text-[15px] font-semibold text-white">Find my order</Link>
              </div>
            }>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${site.slug}/order`}
                className="flex h-14 items-center justify-center rounded-lg bg-leaf-800 px-8 text-[17px] font-semibold text-white shadow-lift transition hover:bg-leaf-900"
              >
                Order for {site.name}
              </Link>
              <Link
                href="/order"
                className="flex h-14 items-center justify-center rounded-lg border border-ink-900/15 bg-white/80 px-7 text-[16px] font-semibold text-ink-900 transition hover:border-leaf-800 hover:text-leaf-800"
              >
                I already ordered
              </Link>
            </div>

            </OpenOnly>
            <div className="mt-8">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-700">
                Orders close in
              </p>
              <Countdown />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- PICKUP + REP ---------- */}
      <section className="border-y border-sand-200 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          <div className="flex gap-4 rounded-2xl border border-sand-200 bg-sand-50 p-5 sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Pickup</p>
              <p className="mt-1 font-display text-xl font-bold text-ink-950">{site.hostInstitution}</p>
              <p className="mt-0.5 text-[14px] leading-snug text-ink-700">
                {site.addressLines.join(", ")}
                <br />
                {site.city}, {site.state} {site.zip}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-900">
                {distributionLabel}
                <br />
                <span className="font-semibold">
                  {site.windowStart} to {site.windowEnd}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-center gap-4 lg:mt-0">
            <p className="text-[15px] leading-relaxed text-ink-700">
              Questions in {site.name}? Speak to{" "}
              <span className="font-semibold text-ink-950">{site.repName}</span>,{" "}
              <a
                href={`tel:${site.repPhone.replace(/[^0-9]/g, "")}`}
                className="inline-block py-1 font-semibold text-leaf-800 underline underline-offset-2"
              >
                {site.repPhone}
              </a>
              . He runs the pickup table.
            </p>
            <Share
              compact
              path={`/${site.slug}`}
              text={`Arba Minim for ${site.name}: Rav-inspected sets from $40, pick up at ${site.hostInstitution} after Yom Kippur.`}
            />
          </div>
        </div>
      </section>

      {/* ---------- LEVELS ---------- */}
      <section id="levels" className="scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Choose a level</p>
          <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
            Three levels of hiddur. Every set complete.
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
            Esrog, lulav, hadassim and aravos in each. The levels differ only in how strictly each
            item was sorted. Tap a level to start your {site.name} order with it.
          </p>

          <OpenOnly
            closed={
              <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-3 md:gap-6">
                {LEVELS.map((level, i) => (
                  <LevelCard key={level.key} level={level} href={`/sets/${level.slug}`} featured={i === 0} />
                ))}
              </div>
            }
          >
            <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-3 md:gap-6">
              {LEVELS.map((level, i) => (
                <LevelCard
                  key={level.key}
                  level={level}
                  href={`/${site.slug}/order?level=${level.key}`}
                  featured={i === 0}
                />
              ))}
            </div>
          </OpenOnly>
        </div>
      </section>

      {/* ---------- HOW IT WORKS HERE ---------- */}
      <section className="border-y border-sand-200 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card">
            <Image
              src={IMG.community.src}
              alt={IMG.community.alt}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="mt-8 lg:mt-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
              How it works in {site.name}
            </p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              A card system, not a scramble.
            </h2>
            <ol className="mt-5 space-y-4">
              {[
                ["Order and pay online", `before ${SEASON.deadlineLabelEt}. You get a pickup code and a QR.`],
                ["The sets fly in sealed,", "packed against the exact totals the moment the deadline passes, plus reserve stock for exchanges."],
                [`Collect at ${site.hostInstitution}`, `on ${distributionLabel}, ${site.windowStart} to ${site.windowEnd}. Show your code. In and out in minutes.`],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-esrog-200 font-display text-base font-bold text-esrog-900">
                    {i + 1}
                  </span>
                  <p className="text-[16px] leading-relaxed text-ink-700">
                    <strong className="font-semibold text-ink-950">{t}</strong> {b}
                  </p>
                </li>
              ))}
            </ol>
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
            <OpenOnly
              closed={
                <Link
                  href="/order"
                  className="mt-7 inline-flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-semibold text-white transition hover:bg-leaf-900"
                >
                  Find my order
                </Link>
              }
            >
              <Link
                href={`/${site.slug}/order`}
                className="mt-7 inline-flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-semibold text-white transition hover:bg-leaf-900"
              >
                Order for {site.name}
              </Link>
            </OpenOnly>
          </div>
          <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl shadow-lift lg:mt-0">
            <Image
              src={IMG.inspection.src}
              alt={IMG.inspection.alt}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Questions</p>
          <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
            Asked in {site.name}
          </h2>
          <div className="mt-8">
            <Faq items={faq} />
          </div>
          <Link href="/faq" className="mt-6 inline-block text-[15px] font-semibold text-leaf-800 underline underline-offset-4">
            Every question, answered
          </Link>
        </div>
      </section>
    </>
  );
}
