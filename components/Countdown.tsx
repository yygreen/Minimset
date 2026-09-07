"use client";

import { useEffect, useState } from "react";
import { SEASON } from "@/lib/data";
import { msUntilDeadline } from "@/lib/orders";

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Live countdown to the season deadline.
 * variant "boxes": four tiles for the hero. variant "inline": one short line
 * for bars and cards ("closes in 10 days 4 hrs").
 */
export function Countdown({
  variant = "boxes",
  he = false,
}: {
  variant?: "boxes" | "inline";
  tone?: "light" | "dark";
  he?: boolean;
}) {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMs(msUntilDeadline());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (variant === "inline") {
    if (ms === null) return <span className="tnum inline-block min-w-[9ch]">&nbsp;</span>;
    if (ms <= 0) return <span>{he ? "ההרשמה לעונה זו נסגרה." : "Registration for this season has closed."}</span>;
    const t = split(ms);
    // days out: calm "10 days 4 hrs"; last day: the full clock
    if (t.days > 0) {
      return (
        <span className="tnum">
          {he
            ? `${t.days} ימים ו-${t.hours} שעות`
            : `${t.days} day${t.days === 1 ? "" : "s"} ${t.hours} hr${t.hours === 1 ? "" : "s"}`}
        </span>
      );
    }
    return (
      <span className="tnum">
        {String(t.hours).padStart(2, "0")}:{String(t.minutes).padStart(2, "0")}:
        {String(t.seconds).padStart(2, "0")}
      </span>
    );
  }

  if (ms === null) {
    return (
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[72px] w-[60px] rounded-xl border border-sand-200 bg-white min-[360px]:w-[68px]" />
        ))}
      </div>
    );
  }

  if (ms <= 0) {
    return (
      <p className="rounded-xl border border-alert-800/30 bg-alert-100 px-4 py-3 text-sm font-semibold text-alert-800">
        {he ? "ההרשמה לעונה זו נסגרה." : "Registration for this season has closed."}
      </p>
    );
  }

  const t = split(ms);
  const cells: [number, string][] = he
    ? [
        [t.days, "ימים"],
        [t.hours, "שעות"],
        [t.minutes, "דקות"],
        [t.seconds, "שניות"],
      ]
    : [
        [t.days, "days"],
        [t.hours, "hours"],
        [t.minutes, "min"],
        [t.seconds, "sec"],
      ];

  return (
    <div>
      <div className="flex gap-2">
        {cells.map(([value, label]) => (
          <div
            key={label}
            className="flex h-[72px] w-[60px] flex-col items-center justify-center rounded-xl border border-sand-200 bg-white shadow-card min-[360px]:w-[68px]"
          >
            <span className="tnum font-display text-[1.75rem] font-bold leading-none text-ink-950">
              {String(value).padStart(2, "0")}
            </span>
            <span className={`mt-1.5 font-bold text-esrog-800 ${he ? "text-[11px]" : "text-[10px] uppercase tracking-[0.16em]"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[13px] text-ink-700" dir={he ? "rtl" : "ltr"}>
        {he ? "ההזמנות נסגרות במוצאי שבת, 5 בספטמבר, 8:30 בערב (שעון ניו יורק)" : `Orders close ${SEASON.deadlineLabelEt}`}
      </p>
    </div>
  );
}
