import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpenOnly } from "@/components/OpenOnly";
import { SEASON, SITES, getSite } from "@/lib/data";

/**
 * A signpost, not a community page. Same reasoning as app/sets/[slug]/page.tsx:
 * the content moved to the homepage, but these URLs stay alive so a flyer or an
 * inbound link never 404s, and someone arriving on /lakewood still sees
 * Lakewood's own pickup details rather than a generic homepage.
 *
 * Canonical is the homepage, so keep this thin — the moment it repeats the
 * homepage's copy it is duplicate content rather than a signpost. Its real job
 * is the order button, which goes straight into this community's flow.
 *
 * The original full page is in archive/site-landing-page.tsx.
 */

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
  if (!site) return {};
  return {
    alternates: { canonical: "/" },
    title: `Lulav and Etrog Sets for ${site.name}`,
    description: `Pre-order Rav-inspected Arba Minim sets and collect at ${site.hostInstitution} in ${site.city}, ${site.state}, the day after Yom Kippur.`,
  };
}

export default async function SiteSignpost({ params }: { params: Promise<{ site: string }> }) {
  const { site: slug } = await params;
  const site = getSite(slug);
  if (!site) notFound();

  const date = new Date(`${site.distributionDateIso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="bg-sand-100 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4">
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
        <h1 className="mt-2 font-display text-[2.3rem] font-bold leading-[1.05] text-ink-950 sm:text-[3rem]">
          Lulav and esrog sets for {site.name}.
        </h1>

        <div className="mt-7 rounded-2xl border border-sand-200 bg-white p-6 shadow-card sm:p-7">
          <dl className="space-y-4 text-[15px] leading-snug">
            <div>
              <dt className="text-ink-500">Collect at</dt>
              <dd className="font-display text-xl font-bold text-ink-950">{site.hostInstitution}</dd>
              <dd className="text-ink-700">
                {site.addressLines.join(", ")}
                <br />
                {site.city}, {site.state} {site.zip}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">When</dt>
              <dd className="font-semibold text-ink-950">
                {date}, {site.windowStart} to {site.windowEnd}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">Your rep</dt>
              <dd className="text-ink-950">
                {site.repName} ·{" "}
                <a
                  href={`tel:${site.repPhone.replace(/[^\d+]/g, "")}`}
                  className="font-semibold text-leaf-800 underline underline-offset-4"
                >
                  {site.repPhone}
                </a>
              </dd>
            </div>
          </dl>

          <OpenOnly
            closed={
              <p className="mt-6 text-[15px] font-semibold text-ink-700">
                Registration for {SEASON.name} has closed. Already ordered? Speak to {site.repName}.
              </p>
            }
          >
            <Link
              href={`/${site.slug}/order`}
              className="mt-6 flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-semibold text-white transition hover:bg-leaf-900"
            >
              Order for {site.name}
            </Link>
          </OpenOnly>
        </div>

        <p className="mt-6 text-[14px] leading-relaxed text-ink-500">
          The sets, the sorting standard and how the program works are all on{" "}
          <Link href="/" className="font-semibold text-leaf-800 underline underline-offset-4">
            the main page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
