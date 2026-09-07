import type { Metadata } from "next";
import Link from "next/link";
import { SEASON } from "@/lib/data";
import { CommunityChoice } from "./CommunityChoice";

export const metadata: Metadata = {
  title: "Start your order",
  // Every order URL is noindex: a checkout has no business in a search result.
  robots: { index: false, follow: false },
};

/**
 * The first step of the order, and the destination for every "order" call to
 * action on the site.
 *
 * Before this existed, those buttons scrolled to a community picker further
 * down the homepage. Two things went wrong with that: nothing actually started,
 * and the level the visitor had just chosen was dropped on the floor. Now the
 * journey is one flow of five steps, and the level travels with them.
 */
export default function StartOrderPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 lg:pt-10">
      <Link href="/" className="inline-block py-1 text-[14px] text-ink-500 hover:text-leaf-800">
        Back to the program
      </Link>

      <h1 className="mt-1.5 font-display text-[2rem] font-bold leading-tight text-ink-950 sm:text-[2.6rem]">
        Where will you collect?
      </h1>
      <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-ink-700">
        Every community has its own host Beis Medrash and its own rep. Pick yours and the rest of
        the order takes about three minutes.
      </p>

      <CommunityChoice />

      <p className="mt-8 text-[14px] leading-relaxed text-ink-500">
        Your community not listed? Ask your Rav about hosting a site — the program spreads one
        neighborhood at a time. Orders close {SEASON.deadlineLabelEt}.
      </p>
    </div>
  );
}
