"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { OrderStatus } from "@/lib/data";

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-sand-300 bg-white">
      <button
        type="button"
        aria-label={`Remove one ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-semibold text-leaf-800 transition hover:bg-sand-100 disabled:opacity-30"
      >
        -
      </button>
      <span className="tnum w-9 text-center font-display text-lg font-bold text-ink-950">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Add one ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-semibold text-leaf-800 transition hover:bg-sand-100 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

const STATUS_STYLE: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", className: "bg-esrog-100 text-esrog-800 ring-esrog-300" },
  PAID: { label: "Paid in full", className: "bg-leaf-50 text-leaf-800 ring-leaf-200" },
  SHIPPED: { label: "Shipped", className: "bg-esrog-200 text-esrog-900 ring-esrog-300" },
  DELIVERED: { label: "Delivered", className: "bg-leaf-100 text-leaf-900 ring-leaf-700/40" },
  CANCELLED_REFUNDED: { label: "Cancelled, refunded", className: "bg-sand-100 text-ink-500 ring-sand-300" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ${s.className}`}
    >
      {s.label}
    </span>
  );
}

export function QrBlock({ code, size = 160 }: { code: string; size?: number }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/order/${code}`
        : `/order/${code}`;
    QRCode.toDataURL(url, {
      width: size * 2,
      margin: 1,
      color: { dark: "#153F29", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then((data) => {
        if (alive) setSrc(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [code, size]);

  return (
    <div
      className="flex items-center justify-center rounded-lg border border-sand-200 bg-white"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`QR code for order ${code}`} width={size} height={size} />
      ) : null}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-esrog-800">{children}</p>
  );
}

export function GoldRule({ className = "" }: { className?: string }) {
  return <div className={`rule-gold h-px w-full ${className}`} />;
}
