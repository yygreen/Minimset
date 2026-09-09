import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpenOnly } from "@/components/OpenOnly";
import { AddToCart } from "@/components/AddToCart";
import { LEVELS, getLevelBySlug, headlinePriceCents } from "@/lib/data";
import { IMG, type Photo } from "@/lib/images";
import { money } from "@/lib/orders";

/**
 * A signpost, not a product page.
 *
 * The full product content was folded into the homepage. These URLs stay alive
 * so an inbound link, a shared WhatsApp message or a printed flyer never lands
 * on a 404, and so someone arriving on /sets/chinuch still sees Chinuch rather
 * than being dropped at the top of a long homepage.
 *
 * Every one of them declares the homepage as its canonical, so search engines
 * consolidate on / instead of treating this as a competing copy. Keep these
 * pages thin for that reason: the moment they repeat the homepage's copy they
 * become duplicate content rather than a signpost.
 *
 * The originals are in archive/sets/[slug]/ if the full pages are ever wanted
 * back.
 */

export function generateStaticParams() {
  return LEVELS.map((l) => ({ slug: l.slug }));
}

const PHOTO: Record<string, Photo> = {
  "mehudar-aa": IMG.levelAA,
  "mehudar-a": IMG.levelA,
  chinuch: IMG.esrogCluster,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const level = getLevelBySlug(slug);
  if (!level) return {};
  return {
    alternates: { canonical: "/" },
    title: `${level.name} Lulav and Etrog Set, ${money(headlinePriceCents(level))}`,
    description: level.headline,
  };
}

export default async function SetSignpost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const level = getLevelBySlug(slug);
  if (!level) notFound();
  const photo = PHOTO[level.slug] ?? IMG.set;

  return (
    <section className="bg-sand-100 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href="/#levels"
          className="inline-flex items-center gap-1.5 py-1.5 text-[13px] font-semibold text-ink-700 transition hover:text-leaf-800"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M7.5 2L3 6l4.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All three levels
        </Link>

        <div className="mt-4 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-card">
          <div className="relative aspect-[16/9] bg-sand-100">
            <Image src={photo.src} alt={photo.alt} fill priority sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">{level.tier}</p>
            <h1 className="mt-2 font-display text-[2.2rem] font-bold leading-tight text-ink-950 sm:text-[2.8rem]">
              {level.name}
            </h1>
            <p className="mt-3 text-[17px] leading-relaxed text-ink-700">{level.headline}</p>
            <p className="mt-5 font-display text-3xl font-bold text-esrog-900">
              {money(headlinePriceCents(level))}
              <span className="ml-2 align-middle text-[14px] font-semibold text-ink-500">per set</span>
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/#${level.slug}`}
                className="flex h-13 items-center justify-center rounded-lg border-2 border-leaf-800 px-6 text-[16px] font-semibold text-leaf-900 transition hover:bg-leaf-800 hover:text-white"
              >
                Full details and the standard
              </Link>
              <OpenOnly>
                <AddToCart
                  level={level.key}
                  className="flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-semibold text-white transition hover:bg-leaf-900"
                >
                  Add to cart
                </AddToCart>
              </OpenOnly>
            </div>

            <p className="mt-6 text-[14px] leading-relaxed text-ink-500">
              Everything about this set — the sorting standard word for word, the compare table and
              how delivery works — now lives on{" "}
              <Link href="/" className="font-semibold text-leaf-800 underline underline-offset-4">
                the main page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
