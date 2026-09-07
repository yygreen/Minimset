"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LEVELS, SITES } from "@/lib/data";

/**
 * Step one of the order: which Beis Medrash you will collect from.
 *
 * The chosen level rides along in ?level= so that picking "Order this set" on
 * Mehudar A-A and picking a town are two steps of one journey rather than two
 * unrelated decisions. Read after mount, exactly as OrderFlow does, so this
 * page stays static and edge-cached.
 */
export function CommunityChoice() {
  const [level, setLevel] = useState<string | null>(null);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("level");
    if (key && LEVELS.some((l) => l.key === key)) setLevel(key);
  }, []);

  const chosen = LEVELS.find((l) => l.key === level);
  const qs = level ? `?level=${level}` : "";

  return (
    <>
      {chosen && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-esrog-300 bg-esrog-100 px-3.5 py-1.5 text-[13px] font-semibold text-ink-900">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-leaf-800">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {chosen.name} selected — pick where you collect
        </p>
      )}

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {SITES.map((site) => {
          const date = new Date(`${site.distributionDateIso}T12:00:00`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          });
          return (
            <li key={site.slug}>
              <Link
                href={`/${site.slug}/order${qs}`}
                className="group flex h-full items-center justify-between gap-4 rounded-2xl border border-sand-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-leaf-700 hover:shadow-lift sm:p-6"
              >
                <span className="min-w-0">
                  <span className="block font-display text-xl font-bold text-ink-950 sm:text-2xl">
                    {site.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[14px] text-ink-700">
                    {site.hostInstitution}
                  </span>
                  <span className="mt-2 block text-[13px] text-ink-500">
                    {date}, {site.windowStart} to {site.windowEnd}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-leaf-800 text-leaf-900 transition group-hover:bg-leaf-800 group-hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
