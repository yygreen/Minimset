import Image from "next/image";
import Link from "next/link";
import { IMG } from "@/lib/images";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">Page not found</p>
        <h1 className="mt-2 font-display text-[2.4rem] font-bold leading-[1.05] text-ink-950 sm:text-[3.2rem]">
          That page is not in the box.
        </h1>
        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-700">
          The link may be old or mistyped. The sets and how delivery works are both one tap away.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/#levels"
            className="flex h-13 items-center justify-center rounded-lg bg-leaf-800 px-7 text-[16px] font-semibold text-white transition hover:bg-leaf-900"
          >
            See the sets
          </Link>
          <Link
            href="/#faq"
            className="flex h-13 items-center justify-center rounded-lg border-2 border-leaf-800 px-7 text-[16px] font-semibold text-leaf-900 transition hover:bg-leaf-800 hover:text-white"
          >
            Read the questions
          </Link>
        </div>
      </div>
      <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-2xl shadow-card lg:mt-0">
        <Image src={IMG.levelA.src} alt={IMG.levelA.alt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
      </div>
    </section>
  );
}
