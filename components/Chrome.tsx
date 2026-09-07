"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { SEASON, SITES } from "@/lib/data";
import { Countdown } from "./Countdown";
import { msUntilDeadline } from "@/lib/orders";

/* ---------------- copy in both languages ---------------- */

const T = {
  en: {
    nav: [
      { href: "/#levels", label: "The Sets" },
      { href: "/#how", label: "How It Works" },
      { href: "/#sites", label: "Pickup" },
      { href: "/faq", label: "FAQ" },
      { href: "/about", label: "About" },
    ],
    myOrder: "My Order",
    orderNow: "Order Now",
    orderHref: "/order/new",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    staff: "Staff",
    distribution: "Distribution Day",
    totals: "HQ Totals",
    allOrders: "All Orders",
    stickyFrom: "Sets from $40",
    stickyCloses: "Closes in",
    footerBlurb:
      "Arba Minim mehudar l'chatchilah at affordable prices. Seventeen years in Eretz Yisrael, now serving American communities.",
    cols: [
      {
        title: "Order",
        links: [
          { href: "/#levels", label: "The three levels" },
          { href: "/#sites", label: "Pick your community" },
          { href: "/order", label: "Look up my order" },
        ],
      },
      {
        title: "Learn",
        links: [
          { href: "/#minim", label: "The four minim" },
          { href: "/#how", label: "How it works" },
          { href: "/about", label: "About the program" },
          { href: "/faq", label: "Questions" },
          { href: "/policies", label: "Policies" },
        ],
      },

    ],
    staffLine: "Staff",
    legal:
      'B"SD. Preview build for review. Orders are recorded on the server; no card is charged until the operator connects a payment account. Prices and dates shown are sample season data.',
  },
} as const;

function useLocale() {
  const pathname = usePathname() || "/";
  /* The Hebrew home was retired (it is kept in archive/he). The chrome stays a
     hook so restoring it means putting the locale test back here and nowhere
     else. */
  return { pathname, he: false, t: T.en, dir: "ltr" } as const;
}

/** Wordmark: a small esrog mark and the name. */
export function Logo({ className = "", he = false }: { className?: string; he?: boolean }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-800 text-esrog-300"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3c-3.6 0-6 3.6-6 8.5S8.4 21 12 21s6-4.6 6-9.5S15.6 3 12 3Z"
            fill="currentColor"
            opacity=".95"
          />
          <path d="M12 3V1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.45rem] font-bold tracking-tight text-ink-950">
          {he ? "ושמחת" : "V'samachta"}
        </span>
        <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-esrog-800">
          {he ? "ארבעת המינים" : "Arba Minim"}
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  const { pathname, he, t, dir } = useLocale();
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(true);
  const staff = pathname.startsWith("/staff");

  useEffect(() => {
    const check = () => setOpen(msUntilDeadline() > 0);
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, []);
  // inside the order flow the header must not compete with the flow's own buttons
  const ordering = (pathname.endsWith("/order") && pathname !== "/order") || pathname.startsWith("/order/") || !open;

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  return (
    <header
      dir={dir}
      className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/95 backdrop-blur supports-[backdrop-filter]:bg-sand-50/85"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5 sm:py-3">
        <Logo he={he} />

        <nav className={`hidden items-center gap-7 lg:flex ${he ? "mr-auto" : "ml-auto"}`} aria-label="Main">
          {t.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[15px] font-medium text-ink-700 transition hover:text-leaf-800"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/order" className="text-[15px] font-medium text-ink-700 transition hover:text-leaf-800">
            {t.myOrder}
          </Link>
          {!ordering && (
            <Link
              href={t.orderHref}
              className="flex h-11 items-center rounded-lg bg-leaf-800 px-5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-leaf-900"
            >
              {t.orderNow}
            </Link>
          )}
        </nav>

        <div className={`flex items-center gap-2 lg:hidden ${he ? "mr-auto" : "ml-auto"}`}>
          {!ordering && (
            <Link
              href={t.orderHref}
              className="flex h-11 items-center whitespace-nowrap rounded-lg bg-leaf-800 px-4 text-[14px] font-semibold text-white"
            >
              <span className="min-[400px]:hidden">{he ? "להזמנה" : "Order"}</span>
              <span className="hidden min-[400px]:inline">{t.orderNow}</span>
            </Link>
          )}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-sand-300 bg-white text-ink-900"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-label={menu ? t.closeMenu : t.openMenu}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              {menu ? (
                <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menu && (
        <div className="border-t border-sand-200 bg-sand-50 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {[...t.nav, { href: "/order", label: t.myOrder }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenu(false)}
                className="border-b border-sand-200 py-3.5 text-[16px] font-medium text-ink-900 last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={t.orderHref}
              onClick={() => setMenu(false)}
              className="my-3 flex h-13 items-center justify-center rounded-lg bg-leaf-800 text-[16px] font-semibold text-white"
            >
              {t.orderNow}
            </Link>
          </div>
        </div>
      )}

      {staff && (
        <div className="border-t border-leaf-200 bg-leaf-100 text-ink-900">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-1 px-4 py-2 text-sm">
            <span className="font-bold uppercase tracking-wider text-leaf-800">{t.staff}</span>
            <Link href="/staff/distribution" className="inline-block py-1 hover:text-leaf-800">
              {t.distribution}
            </Link>
            <Link href="/staff/totals" className="inline-block py-1 hover:text-leaf-800">
              {t.totals}
            </Link>
            <Link href="/staff/orders" className="inline-block py-1 hover:text-leaf-800">
              {t.allOrders}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Phone-only bottom bar. Appears once the visitor has scrolled past the hero
 * so the primary action is always one thumb away. Hidden inside the order
 * flow, on product pages (which have their own bar) and on staff screens.
 */
export function StickyCta() {
  const { pathname, he, t, dir } = useLocale();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 560 && msUntilDeadline() > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const suppressed =
    pathname.startsWith("/staff") ||
    pathname.endsWith("/order") ||
    pathname.startsWith("/order");
  if (suppressed) return null;

  // On a community page the fastest path is that community's own order flow.
  const siteSlug = pathname.split("/")[1];
  const onSitePage = SITES.some((s) => s.slug === siteSlug);
  const href = onSitePage ? `/${siteSlug}/order` : t.orderHref;

  return (
    <div
      dir={dir}
      className={`safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 px-4 pt-2.5 shadow-[0_-8px_24px_-12px_rgba(23,21,15,0.25)] backdrop-blur transition-transform duration-300 md:hidden ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!shown}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[12px] font-semibold text-ink-700">{t.stickyFrom}</p>
          <p className="text-[12px] text-ink-500">
            {t.stickyCloses} <Countdown variant="inline" he={he} />
          </p>
        </div>
        <Link
          href={href}
          tabIndex={shown ? 0 : -1}
          className="flex h-12 items-center rounded-lg bg-leaf-800 px-6 text-[15px] font-semibold text-white"
        >
          {t.orderNow}
        </Link>
      </div>
    </div>
  );
}

export function Footer() {
  const { pathname, he, t, dir } = useLocale();
  // Inside checkout and on the order status page the footer is a single quiet line:
  // nothing to wander off to while paying.
  const checkout = (pathname.endsWith("/order") && pathname !== "/order") || pathname.startsWith("/order/");
  if (checkout) {
    return (
      <footer dir={dir} className="mt-16 border-t border-sand-200 bg-sand-100 text-ink-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-[12px] text-ink-500">
          <p>{t.legal}</p>
          <p className="flex flex-wrap items-center gap-x-4">
            <Link href="/" className="inline-block py-1 hover:text-leaf-800">Home</Link>
            <Link href="/faq" className="inline-block py-1 hover:text-leaf-800">{he ? "שאלות" : "Questions"}</Link>
            <Link href="/order" className="inline-block py-1 hover:text-leaf-800">{t.myOrder}</Link>
          </p>
        </div>
      </footer>
    );
  }
  return (
    <footer dir={dir} className="border-t border-sand-200 bg-sand-100 text-ink-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo he={he} />
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-700">{t.footerBlurb}</p>
          <p className="mt-4 text-[13px] text-ink-500">{he ? "סוכות תשפ\"ז" : SEASON.name}</p>
        </div>
        {t.cols.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">{col.title}</p>
            <ul className="mt-3 space-y-2.5 text-[15px]">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="inline-block py-1 hover:text-leaf-800">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-sand-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-[12px] text-ink-500">
          <p>{t.legal}</p>
          <p className="flex flex-wrap items-center gap-x-3">
            <span className="font-semibold uppercase tracking-wider">{t.staffLine}</span>
            <Link href="/staff/distribution" className="inline-block py-1 hover:text-leaf-800">{t.distribution}</Link>
            <Link href="/staff/totals" className="inline-block py-1 hover:text-leaf-800">{t.totals}</Link>
            <Link href="/staff/orders" className="inline-block py-1 hover:text-leaf-800">{t.allOrders}</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
