import Image from "next/image";
import Link from "next/link";
import { OrderLink } from "@/components/OrderLink";
import { headlinePriceCents, type Level } from "@/lib/data";
import { IMG, type Photo } from "@/lib/images";
import { money } from "@/lib/orders";

const PHOTO: Record<Level["key"], Photo> = {
  MEHUDAR_AA: IMG.levelAA,
  MEHUDAR_A: IMG.levelA,
  CHINUCH: IMG.levelChinuch,
};

const WHO: Record<Level["key"], string> = {
  MEHUDAR_AA: "Shape, cleanliness and shilush at their best",
  MEHUDAR_A: "The level most balabatim choose",
  CHINUCH: "For every boy, his own set",
};

/**
 * One product card. Photo on top, the price large, a one-line promise, and the
 * operator's halachic standard word for word behind a single tap. The card face
 * never paraphrases the standard; it only points to it.
 */
export function LevelCard({
  level,
  href: hrefProp,
  featured = false,
  priority = false,
}: {
  level: Level;
  href?: string;
  featured?: boolean;
  priority?: boolean;
}) {
  const photo = PHOTO[level.key];
  const href = hrefProp ?? `#${level.slug}`;
  /* The photo goes to the detail block on the page; the button starts the
     order, carrying this level with it so the choice is not lost. */
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-card transition hover:shadow-lift ${
        featured ? "border-esrog-500 ring-1 ring-esrog-500" : "border-sand-200"
      }`}
    >
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-sand-100">
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          priority={priority}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
        />
        {featured && (
          <span className="absolute left-4 top-4 rounded-md bg-esrog-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-950 shadow">
            The finest
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6 md:p-5 lg:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-esrog-800">
          {level.tier}
        </p>
        <h3 className="mt-1.5 font-display text-2xl font-bold leading-tight text-ink-950 sm:text-[1.7rem] md:min-h-[4.25rem]">
          {level.name}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-700 md:min-h-[3.05rem]">{WHO[level.key]}</p>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="tnum font-display text-[2.6rem] font-bold leading-none text-leaf-900">
            {money(headlinePriceCents(level))}
          </span>
          <span className="text-sm text-ink-500">per set</span>
        </div>
        {level.pitomSurchargeCents ? (
          <p className="mt-1.5 text-sm text-ink-700 md:min-h-[2.6rem]">
            {money(level.basePriceCents)} without a pitom - your choice at checkout
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-ink-500 md:min-h-[2.6rem]">
            Esrog, lulav, hadassim and aravos included
          </p>
        )}

        <p className="mt-3 text-[13px] text-ink-500">Shipped to your door. Change or cancel free until the deadline.</p>


        <OrderLink
          level={level.key}
          className={`mt-6 flex min-h-13 items-center justify-center rounded-lg px-5 py-3 md:mt-auto text-center text-[15px] font-semibold leading-snug transition ${
            featured
              ? "bg-leaf-800 text-white hover:bg-leaf-900"
              : "border-2 border-leaf-800 text-leaf-900 hover:bg-leaf-800 hover:text-white"
          }`}
        >
          Order this set
        </OrderLink>
      </div>
    </article>
  );
}
