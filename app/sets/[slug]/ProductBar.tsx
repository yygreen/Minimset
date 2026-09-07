"use client";

import { useEffect, useState } from "react";

/**
 * Phone-only buy bar for the product page: price on the left, one button that
 * jumps to the community picker. Appears once the picker has scrolled out of view.
 */
export function ProductBar({ name, price }: { name: string; price: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const target = document.getElementById("order");
    if (!target) return;
    const io = new IntersectionObserver(
      ([entry]) => setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 px-4 pt-2.5 shadow-[0_-8px_24px_-12px_rgba(23,21,15,0.25)] backdrop-blur transition-transform duration-300 md:hidden ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!shown}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-semibold text-ink-900">{name}</p>
          <p className="tnum text-[15px] font-bold text-leaf-900">{price} per set</p>
        </div>
        <a
          href="#order"
          tabIndex={shown ? 0 : -1}
          className="flex h-12 items-center rounded-lg bg-leaf-800 px-6 text-[15px] font-semibold text-white"
        >
          Order now
        </a>
      </div>
    </div>
  );
}
