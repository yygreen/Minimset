"use client";

/**
 * The staff screens' data source. Same shape as the old browser store on purpose, so the
 * three screens read exactly as they did - only now the orders are the real ones on the
 * server, every action is a request, and two volunteers at one table see the same truth.
 *
 * Optimistic where it helps (a pickup shows instantly, then the server's copy replaces it)
 * and honest where it matters: a failed action says so and rolls back.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { LevelKey } from "./data";
import type { Order } from "./orders";

export interface ReserveStock {
  MEHUDAR_AA: { shipped: number; used: number };
  MEHUDAR_A: { shipped: number; used: number };
  CHINUCH: { shipped: number; used: number };
}

export const EMPTY_RESERVE: ReserveStock = {
  MEHUDAR_AA: { shipped: 0, used: 0 },
  MEHUDAR_A: { shipped: 0, used: 0 },
  CHINUCH: { shipped: 0, used: 0 },
};

interface StaffApi {
  orders: Order[];
  reserve: ReserveStock;
  reserveBySite: Record<string, ReserveStock>;
  ready: boolean;
  error: string;
  signedIn: boolean;
  locked: boolean;
  configured: boolean;
  /** "admin" sees every site; "rep" is pinned to repSite. Mirrors the server's enforcement. */
  role: "admin" | "rep";
  repSite: string | null;
  reload: () => Promise<void>;
  signIn: (pin: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  pickUp: (code: string, itemId: string, quantity: number) => void;
  undoPickup: (code: string) => void;
  recordExchange: (code: string, itemId: string, note: string) => boolean;
  markUnclaimed: (code: string) => void;
  seedDemo: () => Promise<void>;
  clearDemo: () => Promise<void>;
  setShipped: (siteSlug: string, level: LevelKey, shipped: number) => Promise<void>;
}

const Ctx = createContext<StaffApi | null>(null);

/** Mirrors the server's rule exactly, so an optimistic badge never contradicts the truth. */
function deriveStatus(items: Order["items"]): Order["status"] {
  const total = items.reduce((n, i) => n + i.quantity, 0);
  const taken = items.reduce((n, i) => n + i.qtyPickedUp, 0);
  if (taken === 0) return "PAID";
  return taken >= total ? "FULFILLED" : "PARTIALLY_PICKED_UP";
}

function sumReserve(bySite: Record<string, ReserveStock>): ReserveStock {
  const out: ReserveStock = structuredClone(EMPTY_RESERVE);
  for (const r of Object.values(bySite)) {
    for (const k of Object.keys(out) as LevelKey[]) {
      out[k].shipped += r[k]?.shipped ?? 0;
      out[k].used += r[k]?.used ?? 0;
    }
  }
  return out;
}

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reserveBySite, setReserveBySite] = useState<Record<string, ReserveStock>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [locked, setLocked] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [role, setRole] = useState<"admin" | "rep">("admin");
  const [repSite, setRepSite] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const status = await fetch("/api/status").then((r) => r.json());
      setLocked(Boolean(status.staffLocked));
      setSignedIn(Boolean(status.staffSignedIn));
      setConfigured(Boolean(status.store));
      setRole(status.staffRole === "rep" ? "rep" : "admin");
      setRepSite(status.staffSite ?? null);
      if (!status.staffSignedIn) {
        setReady(true);
        return;
      }
      const [o, r] = await Promise.all([
        fetch("/api/staff/orders?full=1").then((x) => x.json()),
        fetch("/api/staff/reserve").then((x) => x.json()),
      ]);
      setOrders((o.orders ?? []) as Order[]);
      setReserveBySite((r.reserve ?? {}) as Record<string, ReserveStock>);
    } catch {
      setError("Could not reach the server.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * One order, one action at a time.
   *
   * "Mark as Picked Up" fires a request per remaining item, and a Motz exchange can land in
   * the middle of a pickup. Sent in parallel, each response carries a whole order and the
   * slowest one wins, quietly undoing the others - a set marked handed over that silently
   * un-marks itself. Chaining per code makes every response the newest truth.
   */
  const chains = useRef(new Map<string, Promise<unknown>>());
  /** How many actions are still queued or in flight for each order. */
  const pending = useRef(new Map<string, number>());

  const send = useCallback(
    async (code: string, body: Record<string, unknown>) => {
      try {
        const res = await fetch(`/api/staff/orders/${encodeURIComponent(code)}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as {
          order?: Order;
          reserve?: ReserveStock;
          error?: string;
        };
        const left = (pending.current.get(code) ?? 1) - 1;
        pending.current.set(code, left);

        if (!res.ok || !data.order) {
          setError(data.error || "That action did not go through.");
          void load();
          return null;
        }
        setError("");
        /**
         * Only the LAST outstanding action for this order may replace what is on screen.
         * An earlier response carries a whole order from before the newer action, so
         * applying it would erase an exchange or a pickup the volunteer has already made
         * and watched appear. The final response is always the true state.
         */
        if (left <= 0) {
          setOrders((cur) => cur.map((o) => (o.code === data.order!.code ? data.order! : o)));
        }
        return data;
      } catch {
        pending.current.set(code, Math.max(0, (pending.current.get(code) ?? 1) - 1));
        setError("Could not reach the server.");
        void load();
        return null;
      }
    },
    [load],
  );

  const act = useCallback(
    async (code: string, body: Record<string, unknown>) => {
      pending.current.set(code, (pending.current.get(code) ?? 0) + 1);
      const prior = chains.current.get(code) ?? Promise.resolve();
      const run = prior.then(() => send(code, body));
      chains.current.set(
        code,
        run.catch(() => undefined),
      );
      return run;
    },
    [send],
  );

  const api = useMemo<StaffApi>(
    () => ({
      orders,
      reserveBySite,
      reserve: sumReserve(reserveBySite),
      ready,
      error,
      signedIn,
      locked,
      configured,
      role,
      repSite,
      reload: load,
      async signIn(pin) {
        const res = await fetch("/api/staff/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pin }),
        });
        if (!res.ok) return false;
        setSignedIn(true);
        await load();
        return true;
      },
      async signOut() {
        await fetch("/api/staff/login", { method: "DELETE" });
        setSignedIn(false);
        setOrders([]);
      },
      pickUp(code, itemId, quantity) {
        // Optimistic, status included: the table moves at the speed of the queue in front of
        // it, not the network. The server's copy replaces this a moment later either way.
        setOrders((cur) =>
          cur.map((o) => {
            if (o.code !== code) return o;
            const items = o.items.map((i) =>
              i.id === itemId ? { ...i, qtyPickedUp: Math.min(i.quantity, i.qtyPickedUp + quantity) } : i,
            );
            return { ...o, items, status: deriveStatus(items) };
          }),
        );
        void act(code, { action: "pickup", itemId, quantity });
      },
      undoPickup(code) {
        setOrders((cur) =>
          cur.map((o) => {
            if (o.code !== code) return o;
            const items = o.items.map((i) => ({ ...i, qtyPickedUp: 0 }));
            return { ...o, items, status: deriveStatus(items) };
          }),
        );
        void act(code, { action: "undo" });
      },
      recordExchange(code, itemId, note) {
        setOrders((cur) =>
          cur.map((o) =>
            o.code === code
              ? { ...o, exchanges: [...o.exchanges, { itemId, at: new Date().toISOString(), note }] }
              : o,
          ),
        );
        void act(code, { action: "exchange", itemId, note }).then((d) => {
          if (d?.reserve) {
            setReserveBySite((cur) => {
              const order = orders.find((o) => o.code === code);
              return order ? { ...cur, [order.siteSlug]: d.reserve! } : cur;
            });
          }
        });
        return true;
      },
      markUnclaimed(code) {
        setOrders((cur) => cur.map((o) => (o.code === code ? { ...o, status: "UNCLAIMED" } : o)));
        void act(code, { action: "unclaimed" });
      },
      async seedDemo() {
        await fetch("/api/staff/demo", { method: "POST" });
        await load();
      },
      async clearDemo() {
        await fetch("/api/staff/demo", { method: "DELETE" });
        await load();
      },
      async setShipped(siteSlug, level, shipped) {
        const res = await fetch("/api/staff/reserve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ siteSlug, level, shipped }),
        });
        const data = (await res.json().catch(() => ({}))) as { reserve?: ReserveStock };
        if (data.reserve) setReserveBySite((cur) => ({ ...cur, [siteSlug]: data.reserve! }));
      },
    }),
    [orders, reserveBySite, ready, error, signedIn, locked, configured, role, repSite, load, act],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** Named useStore so the staff screens read exactly as they did before the server existed. */
export function useStore(): StaffApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore (staff) must be used inside StaffProvider");
  return v;
}
