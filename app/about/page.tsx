import type { Metadata } from "next";
import Image from "next/image";
import { OrderLink } from "@/components/OrderLink";
import { PARTNERSHIP_PARAGRAPH } from "@/lib/data";
import { IMG } from "@/lib/images";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About - V'samachta Arba Minim",
  description:
    "Seventeen years in Eretz Yisrael: how the V'samachta pre-order model works, who sorts the minim, and why the whole thing rests on the Rabbanim who bring them.",
};

/**
 * Full width, with the prose paired against the photographs rather than stacked
 * between them in a narrow column. The copy is unchanged; only the layout is.
 * Individual paragraphs still sit on a readable measure -- widening the page is
 * not a reason to run a line of body text across 1100px.
 */
export default function AboutPage() {
  return (
    <>
      <section className="bg-sand-100 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">About the program</p>
          <h1 className="mt-2 max-w-4xl font-display text-[2.5rem] font-bold leading-[1.05] text-ink-950 sm:text-[3.4rem]">
            Seventeen years, one way.
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-700">
            V&#39;samachta was established in Eretz Yisrael to bring Bnei Torah communities Arba
            Minim that are mehudar l&#39;chatchilah, at affordable prices.
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        {/* the model, alongside the inspection */}
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
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
              those totals, plus a reserve for replacements, and flown to America - about one day
              in transit.
            </p>
          </div>

          <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl shadow-card lg:mt-0">
            <Image
              src={IMG.inspection.src}
              alt={IMG.inspection.alt}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* delivery: the photo takes the left, so the two blocks alternate
            text-image, image-text rather than repeating one shape */}
        <div className="mt-14 lg:mt-20 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
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
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Delivery</p>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
              It arrives at your door.
            </h2>
            <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-ink-700">
              <p>
                As the shipment is unpacked, every order goes out to the address on it, tracked,
                in time to arrive before Yom Tov. Nobody drives anywhere and nobody waits in a
                line; you get a tracking number the day your box leaves.
              </p>
              <p>
                Everything arrives closed up: the esrog in its box, the hadassim and aravos in a
                sealed bag, the lulav sealed. You open it in your own sukkah. If what you received
                would not be worth what you paid, it is replaced from reserve stock at our cost.
              </p>
            </div>
          </div>
        </div>

        {/* the line the whole thing rests on, given the full width */}
        <div className="mt-14 rounded-2xl bg-esrog-100 px-6 py-10 text-center sm:px-10 lg:mt-20">
          <p className="mx-auto max-w-3xl font-display text-[1.6rem] font-bold leading-relaxed text-ink-950 sm:text-[2rem]">
            &#34;You are relying on the Rabbanim who bring you the items, kasher v&#39;yashar, one
            hundred percent.&#34;
          </p>
        </div>

        <div className="mt-12 lg:flex lg:items-end lg:justify-between lg:gap-12">
          <p className="max-w-2xl text-[16px] leading-relaxed text-ink-700">{PARTNERSHIP_PARAGRAPH}</p>
          <OrderLink className="mt-8 inline-flex h-14 shrink-0 items-center justify-center rounded-lg bg-leaf-800 px-8 text-[17px] font-semibold text-white shadow-lift transition hover:bg-leaf-900 lg:mt-0">
            Order your set
          </OrderLink>
        </div>
      </article>
    </>
  );
}
