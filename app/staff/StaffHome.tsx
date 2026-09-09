"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/Ui";
import { StaffTools } from "./StaffTools";

/** The operator's screens. Everything here is behind the staff PIN. */
const TILES: { href: string; title: string; body: string; who: string }[] = [
  {
    href: "/staff/fulfillment",
    title: "Fulfilment",
    body: "The packing screen. Find an order by code, name, phone or town; read the delivery address; record the carrier and tracking number as the box goes out.",
    who: "Packing",
  },
  {
    href: "/staff/totals",
    title: "HQ Totals",
    body: "The sheet you pull the moment the deadline passes: sets per level, with and without pitom, derived unit counts for packing, and revenue.",
    who: "Admin",
  },
  {
    href: "/staff/orders",
    title: "Order Search",
    body: "Every order, with status, delivery address, tracking and contents.",
    who: "Admin",
  },
  {
    href: "/brief",
    title: "What we still need",
    body: "The ten photographs, the names of the Morei Hora'ah, a short inspection clip and the Hebrew standard. A phone-friendly shot list to work through at the table.",
    who: "Operator",
  },
];

export function StaffHome() {
  const tiles = TILES;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <SectionLabel>Staff</SectionLabel>
      <h1 className="mt-3 font-display text-4xl font-bold text-ink-950">Operations</h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        Orders live on the server, so every screen here shows the same truth at the same moment,
        on any device.
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

      <StaffTools />
    </div>
  );
}

