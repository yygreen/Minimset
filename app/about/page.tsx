import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PARTNERSHIP_PARAGRAPH } from "@/lib/data";
import { IMG } from "@/lib/images";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About - V'samachta Arba Minim",
  description:
    "Seventeen years in Eretz Yisrael: how the V'samachta pre-order model works, who sorts the minim, and why the whole thing rests on the Rabbanim who bring them.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-sand-100 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">About the program</p>
          <h1 className="mt-2 font-display text-[2.5rem] font-bold leading-[1.05] text-ink-950 sm:text-[3.4rem]">
            Seventeen years, one way.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-700">
            V&#39;samachta was established in Eretz Yisrael to bring Bnei Torah communities Arba
            Minim that are mehudar l&#39;chatchilah, at affordable prices.
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="space-y-4 text-[17px] leading-relaxed text-ink-700">
          <p>
            It started in one neighborhood in Meah Shearim and spread across Eretz Yisrael. Kiryas
            Joel already runs the same system. The goal is for every community to have it.
          </p>
          <p>
            Everyone pays in full, in advance, before a hard deadline. That is the whole model: it
            makes each buyer a partner in the minim bought for the community, and nothing that
            ships is a guess.
          </p>
          <p>
            The moment the deadline passes, the totals are exact. The shipment is packed against
            those totals, plus a reserve for exchanges, and flown to America - about one day in
            transit.
          </p>
        </div>

        <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-2xl shadow-card">
          <Image
            src={IMG.inspection.src}
            alt={IMG.inspection.alt}
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="mt-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Distribution day</p>
          <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
            A card system, not a scramble.
          </h2>
          <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-ink-700">
            <p>
              The day after Yom Kippur, everyone comes to the host Beis Medrash, 10:00 AM to 5:00
              PM. Distributors already know what each person ordered, what he is entitled to, and
              what he paid. A whole community is served in two to three hours.
            </p>
            <p>
              Everything arrives closed up: the esrog in a box, the hadassim and aravos in a
              sealed bag. A Moreh Hora&#39;ah stands at pickup, and if he rules an item is not
              worth what you paid, it is exchanged on the spot.
            </p>
          </div>
        </div>

        <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-2xl shadow-card">
          <Image
            src={IMG.community.src}
            alt={IMG.community.alt}
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="mt-12 rounded-2xl bg-esrog-100 p-6 sm:p-8">
          <p className="font-display text-xl font-bold leading-relaxed text-ink-950">
            &#34;You are relying on the Rabbanim who bring you the items, kasher v&#39;yashar, one
            hundred percent.&#34;
          </p>
        </div>

        <p className="mt-10 text-[16px] leading-relaxed text-ink-700">{PARTNERSHIP_PARAGRAPH}</p>

        <Link
          href="/#levels"
          className="mt-8 inline-flex h-14 items-center justify-center rounded-lg bg-leaf-800 px-8 text-[17px] font-semibold text-white shadow-lift transition hover:bg-leaf-900"
        >
          Order for your community
        </Link>
      </article>
    </>
  );
}
