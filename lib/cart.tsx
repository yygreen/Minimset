"use client";

/**
 * The cart, on this site.
 *
 * Shopify is the till, not the shop window, and that holds for the cart too:
 * the customer builds an order here -- a Mehudar A-A for himself, three Chinuch
 * sets for the boys -- and meets Shopify once, at checkout, with the whole
 * thing already in it. A cart permalink carries every line
 * (/cart/<variant>:<qty>,<variant>:<qty>), so nothing is lost in the handover
 * and no line-item editing has to happen on a storefront the program does not
 * control.
 *
 * Lines are keyed by level plus the pitom choice, because Mehudar A-A with a
 * pitom and without are two different variants at two different prices.
 *
 * Persisted to localStorage so a cart survives a refresh or a phone locking.
 * The store is per-device and holds no personal data -- names and addresses are
 * Shopify's, collected at checkout.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LEVELS, type LevelKey, getLevel } from "./data";
import { variantIdFor } from "./shopify";

const STORAGE_KEY = "vsamachta.cart.v1";

export interface CartLine {
  levelKey: LevelKey;
  /** Only meaningful for MEHUDAR_AA; always true for the single-variant levels. */
  withPitom: boolean;
  qty: number;
}

export interface PricedLine extends CartLine {
  key: string;
  name: string;
  unitPriceCents: number;
  lineTotalCents: number;
  variantId: string | null;
}

interface CartApi {
  lines: PricedLine[];
  count: number;
  subtotalCents: number;
  ready: boolean;
  add: (levelKey: LevelKey, withPitom?: boolean, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  setPitom: (key: string, withPitom: boolean) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** True while the drawer is open. */
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartApi | null>(null);

const lineKey = (l: CartLine) => `${l.levelKey}${l.withPitom ? ":pitom" : ""}`;

/** Only MEHUDAR_AA charges for a pitom; the others ignore the flag entirely. */
function unitPrice(levelKey: LevelKey, withPitom: boolean): number {
  const level = getLevel(levelKey);
  const surcharge = level.pitomSurchargeCents ?? 0;
  return level.basePriceCents + (surcharge && withPitom ? surcharge : 0);
}

function label(levelKey: LevelKey, withPitom: boolean): string {
  const level = getLevel(levelKey);
  if (level.pitomSurchargeCents) return `${level.name}, ${withPitom ? "with pitom" : "no pitom"}`;
  return level.name;
}

const MAX_QTY = 20;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [raw, setRaw] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartLine[];
        if (Array.isArray(parsed)) {
          setRaw(
            parsed.filter(
              (l) =>
                LEVELS.some((x) => x.key === l.levelKey) &&
                Number.isInteger(l.qty) &&
                l.qty > 0 &&
                l.qty <= MAX_QTY,
            ),
          );
        }
      }
    } catch {
      /* a private window, or cleared site data. An empty cart is the right answer. */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch {
      /* storage full or blocked: the cart still works for this page view */
    }
  }, [raw, ready]);

  const add = useCallback((levelKey: LevelKey, withPitom = true, qty = 1) => {
    setRaw((cur) => {
      const k = lineKey({ levelKey, withPitom, qty });
      const found = cur.find((l) => lineKey(l) === k);
      if (found) {
        return cur.map((l) =>
          lineKey(l) === k ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l,
        );
      }
      return [...cur, { levelKey, withPitom, qty: Math.min(MAX_QTY, qty) }];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setRaw((cur) =>
      qty <= 0
        ? cur.filter((l) => lineKey(l) !== key)
        : cur.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    );
  }, []);

  /* Changing the pitom choice is a change of variant, so it may collide with a
     line that already exists; merge rather than end up with two of the same. */
  const setPitom = useCallback((key: string, withPitom: boolean) => {
    setRaw((cur) => {
      const line = cur.find((l) => lineKey(l) === key);
      if (!line) return cur;
      const target = lineKey({ ...line, withPitom });
      const existing = cur.find((l) => lineKey(l) === target);
      if (existing) {
        return cur
          .filter((l) => lineKey(l) !== key)
          .map((l) =>
            lineKey(l) === target ? { ...l, qty: Math.min(MAX_QTY, l.qty + line.qty) } : l,
          );
      }
      return cur.map((l) => (lineKey(l) === key ? { ...l, withPitom } : l));
    });
  }, []);

  const remove = useCallback((key: string) => {
    setRaw((cur) => cur.filter((l) => lineKey(l) !== key));
  }, []);

  const clear = useCallback(() => setRaw([]), []);

  const api = useMemo<CartApi>(() => {
    const lines: PricedLine[] = raw.map((l) => {
      const unitPriceCents = unitPrice(l.levelKey, l.withPitom);
      return {
        ...l,
        key: lineKey(l),
        name: label(l.levelKey, l.withPitom),
        unitPriceCents,
        lineTotalCents: unitPriceCents * l.qty,
        variantId: variantIdFor(l.levelKey, l.withPitom),
      };
    });
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotalCents: lines.reduce((n, l) => n + l.lineTotalCents, 0),
      ready,
      add,
      setQty,
      setPitom,
      remove,
      clear,
      open,
      setOpen,
    };
  }, [raw, ready, open, add, setQty, setPitom, remove, clear]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart(): CartApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside <CartProvider>");
  return v;
}
