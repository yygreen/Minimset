"use client";

/**
 * The staff screens' data source. The orders are the real ones on the server, every action
 * is a request, and two people packing the same shipment see the same truth.
 *
 * Optimistic where it helps (a tracking number shows instantly, then the server's copy
 * replaces it) and honest where it matters: a failed action says so and reloads.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Order } from "./orders";

interface StaffApi {
  orders: Order[];
  ready: boolean;
  error: string;
  signedIn: boolean;
  locked: boolean;
  configured: boolean;
  reload: () => Promise<void>;
  signIn: (pin: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Record the carrier and tracking number, and mark the box gone. */
  markShipped: (code: string, carrier: string, trackingNumber: string) => void;
  markDelivered: (code: string) => void;
  /** Back to PAID: a tracking number keyed against the wrong order. */
  undoShipment: (code: string) => void;
  recordExchange: (code: string, itemId: string, note: string) => boolean;
  seedDemo: () => Promise<void>;
  clearDemo: () => Promise<void>;
}

const Ctx = createContext<StaffApi | null>(null);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [locked, setLocked] = useState(false);
  const [configured, setConfigured] = useState(true);

  const load = useCallback(async () => {
    setError("");
    try {
      const status = await fetch("/api/status").then((r) => r.json());
      setLocked(Boolean(status.staffLocked));
      setSignedIn(Boolean(status.staffSignedIn));
      setConfigured(Boolean(status.store));
      if (!status.staffSignedIn) {
        setReady(true);
        return;
      }
      const o = await fetch("/api/staff/orders?full=1").then((x) => x.json());
      setOrders((o.orders ?? []) as Order[]);
    } catch {
      setError("Could not reach the server.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * One order, one action at a time. Each response carries a whole order, so two actions in
   * flight together would let the slower one quietly undo the faster. Chaining per code
   * makes every response the newest truth.
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
         * applying it would erase a change already made and watched appear. The final
         * response is always the true state.
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
      ready,
      error,
      signedIn,
      locked,
      configured,
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
      markShipped(code, carrier, trackingNumber) {
        const at = new Date().toISOString();
        setOrders((cur) =>
          cur.map((o) =>
            o.code === code
              ? { ...o, status: "SHIPPED", carrier, trackingNumber, shippedAt: at }
              : o,
          ),
        );
        void act(code, { action: "ship", carrier, trackingNumber });
      },
      markDelivered(code) {
        setOrders((cur) => cur.map((o) => (o.code === code ? { ...o, status: "DELIVERED" } : o)));
        void act(code, { action: "delivered" });
      },
      undoShipment(code) {
        setOrders((cur) =>
          cur.map((o) => {
            if (o.code !== code) return o;
            const next = { ...o, status: "PAID" as const };
            delete next.carrier;
            delete next.trackingNumber;
            delete next.shippedAt;
            return next;
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
        void act(code, { action: "exchange", itemId, note });
        return true;
      },
      async seedDemo() {
        await fetch("/api/staff/demo", { method: "POST" });
        await load();
      },
      async clearDemo() {
        await fetch("/api/staff/demo", { method: "DELETE" });
        await load();
      },
    }),
    [orders, ready, error, signedIn, locked, configured, load, act],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** Named useStore so the staff screens read the same as the customer-side store. */
export function useStore(): StaffApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore (staff) must be used inside StaffProvider");
  return v;
}
