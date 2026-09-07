"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/Ui";
import { SITES } from "@/lib/data";
import { useStore } from "@/lib/staff-store";
import { StaffTools } from "./StaffTools";

/**
 * Role-aware staff home. A rep sees his own tools; the admin sees everything. Hiding a tile
 * is only manners - every admin endpoint refuses a rep server-side regardless.
 */
const TILES: { href: string; title: string; body: string; who: string; admin?: boolean }[] = [
  {
    href: "/staff/distribution",
    title: "Distribution Day",
    body: "The card system. Look a person up by code, name or phone; see exactly what he is entitled to; hand it over. Partial pickups and Motz exchanges included.",
    who: "Rep + volunteer",
  },
  {
    href: "/staff/totals",
    title: "HQ Totals",
    body: "The sheet you pull the moment the deadline passes: sets per level, with and without pitom, derived unit counts for packing, and revenue.",
    who: "Admin",
    admin: true,
  },
  {
    href: "/staff/orders",
    title: "Order Search",
    body: "Every order - online and paper - with status, payment method and contents.",
    who: "Admin + rep",
  },
  {
    href: "/staff/paper",
    title: "Paper Order",
    body: "Key an order taken on a sheet. Saved as paid against cash or a check, and it joins the totals and distribution list at once.",
    who: "Rep",
  },
  {
    href: "/staff/print",
    title: "Print Order Sheets",
    body: "Blank one-order-per-page sheets for the table, priced and site-stamped. Print a stack, take orders on paper, key them in afterwards.",
    who: "Rep",
  },
  {
    href: "/brief",
    title: "What we still need",
    body: "The ten photographs, the names of the Morei Hora'ah, a short inspection clip and the Hebrew standard. A phone-friendly shot list to work through at the table.",
    who: "Operator",
    admin: true,
  },
];

export function StaffHome() {
  const { role, repSite, locked } = useStore();
  const rep = role === "rep";
  const siteName = SITES.find((s) => s.slug === repSite)?.name ?? repSite;
  const tiles = TILES.filter((t) => !t.admin || !rep);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <SectionLabel>Staff</SectionLabel>
      <h1 className="mt-3 font-display text-4xl font-bold text-ink-950">
        {rep ? `${siteName} operations` : "Operations"}
      </h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        {rep
          ? `You are signed in as the ${siteName} rep. Everything here shows your community only; orders update live on every device.`
          : "Orders live on the server, so every screen here shows the same truth at the same moment, on any device. The admin PIN sees every site; each rep PIN is scoped to its own."}
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group flex flex-col rounded-2xl border border-sand-200 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-leaf-700 hover:shadow-lift"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">
              {tile.who}
            </span>
            <h2 className="mt-2 font-display text-xl font-bold text-ink-950">{tile.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-700">{tile.body}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-800">
              Open
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                className="transition group-hover:translate-x-0.5"
              >
                <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        ))}
      </div>

      {rep ? <RepFooter locked={locked} /> : <StaffTools />}
    </div>
  );
}

function RepFooter({ locked }: { locked: boolean }) {
  const { signOut } = useStore();
  if (!locked) return null;
  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="mt-12 inline-block text-[14px] font-semibold text-ink-700 underline underline-offset-4"
    >
      Sign out of these screens
    </button>
  );
}
