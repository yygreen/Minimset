"use client";

import Image from "next/image";
import { useState } from "react";
import type { Photo } from "@/lib/images";

/**
 * Product gallery: one large image, a row of thumbnails, tap to switch.
 * Also swipeable on phones (scroll-snap strip) so the set can be seen from
 * every side without a modal.
 */
export function Gallery({ photos, badge }: { photos: Photo[]; badge?: string }) {
  const [i, setI] = useState(0);
  const main = photos[i];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand-100 shadow-card">
        {photos.map((p, k) => (
          <Image
            key={p.src + k}
            src={p.src}
            alt={p.alt}
            fill
            priority={k === 0}
            sizes="(min-width: 1024px) 640px, 100vw"
            className={`object-cover transition-opacity duration-300 ${k === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        {badge && (
          <span className="absolute left-4 top-4 rounded-md bg-esrog-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-950 shadow">
            {badge}
          </span>
        )}
        <span className="tnum absolute bottom-3 right-3 rounded-md bg-white/90 px-2 py-0.5 text-[12px] font-semibold text-ink-700">
          {i + 1} / {photos.length}
        </span>
      </div>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Photos">
        {photos.map((p, k) => (
          <li key={p.src + k} className="shrink-0">
            <button
              type="button"
              aria-pressed={k === i}
              aria-label={p.alt}
              onClick={() => setI(k)}
              className={`relative block h-[72px] w-[72px] overflow-hidden rounded-xl bg-sand-100 ring-2 transition sm:h-20 sm:w-20 ${
                k === i ? "ring-leaf-700" : "ring-transparent hover:ring-sand-300"
              }`}
            >
              <Image src={p.src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[13px] text-ink-500">{main.alt}</p>
    </div>
  );
}
