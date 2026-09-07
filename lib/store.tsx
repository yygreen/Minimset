"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LevelKey } from "./data";
import { Order, OrderItem, orderTotal } from "./orders";

const STORAGE_KEY = "vsamachta.demo.v1";

/** Reserve buffer shipped per level, drawn down by Motz exchanges. */
export interface ReserveStock {
  MEHUDAR_AA: { shipped: number; used: number };
  MEHUDAR_A: { shipped: number; used: number };
  CHINUCH: { shipped: number; used: number };
}

interface DemoState {
  orders: Order[];
  reserve: ReserveStock;
}

const INITIAL_RESERVE: ReserveStock = {
  MEHUDAR_AA: { shipped: 12, used: 0 },
  MEHUDAR_A: { shipped: 18, used: 0 },
  CHINUCH: { shipped: 24, used: 0 },
};

function emptyState(): DemoState {
  return { orders: [], reserve: structuredClone(INITIAL_RESERVE) };
}

interface StoreApi extends DemoState {
  ready: boolean;
  placeOrder: (order: Order) => void;
  findOrder: (code: string) => Order | undefined;
  updateItems: (code: string, items: OrderItem[]) => void;
  cancelOrder: (code: string) => void;
  pickUp: (code: string, itemId: string, quantity: number) => void;
  undoPickup: (code: string) => void;
  recordExchange: (code: string, itemId: string, note: string) => boolean;
  markUnclaimed: (code: string) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => ({
    orders: [],
    reserve: structuredClone(INITIAL_RESERVE),
  }));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        if (parsed?.orders?.length) {
          setState(parsed);
          setReady(true);
          return;
        }
      }
    } catch {
      /* corrupted or unavailable storage: start empty */
    }
    // Empty, not seeded. Since orders live on the server this store is only a copy of what
    // THIS device ordered; seeding it would show a visitor a list of strangers' orders.
    setState(emptyState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: the demo still works in memory */
    }
  }, [state, ready]);

  const mutate = useCallback(
    (fn: (draft: DemoState) => void) => {
      setState((prev) => {
        const draft = structuredClone(prev);
        fn(draft);
        return draft;
      });
    },
    [],
  );

  const api = useMemo<StoreApi>(() => {
    return {
      ...state,
      ready,
      placeOrder: (order) =>
        mutate((d) => {
          d.orders = [order, ...d.orders];
        }),
      findOrder: (code) =>
        state.orders.find((o) => o.code.toUpperCase() === code.toUpperCase()),
      updateItems: (code, items) =>
        mutate((d) => {
          const order = d.orders.find((o) => o.code === code);
          if (!order) return;
          order.items = items;
          order.totalCents = orderTotal(items);
        }),
      cancelOrder: (code) =>
        mutate((d) => {
          const order = d.orders.find((o) => o.code === code);
          if (order) order.status = "CANCELLED_REFUNDED";
        }),
      pickUp: (code, itemId, quantity) =>
        mutate((d) => {
          const order = d.orders.find((o) => o.code === code);
          if (!order) return;
          const item = order.items.find((i) => i.id === itemId);
          if (!item) return;
          item.qtyPickedUp = Math.min(item.quantity, item.qtyPickedUp + quantity);
          const total = order.items.reduce((s, i) => s + i.quantity, 0);
          const picked = order.items.reduce((s, i) => s + i.qtyPickedUp, 0);
          order.status =
            picked === 0 ? "PAID" : picked >= total ? "FULFILLED" : "PARTIALLY_PICKED_UP";
        }),
      undoPickup: (code) =>
        mutate((d) => {
          const order = d.orders.find((o) => o.code === code);
          if (!order) return;
          order.items.forEach((i) => {
            i.qtyPickedUp = 0;
          });
          order.status = "PAID";
        }),
      recordExchange: (code, itemId, note) => {
        const order = state.orders.find((o) => o.code === code);
        const item = order?.items.find((i) => i.id === itemId);
        if (!order || !item || item.kind !== "LEVEL" || !item.levelKey) return false;
        const key = item.levelKey as LevelKey;
        const bucket = state.reserve[key];
        const available = bucket.shipped - bucket.used;
        mutate((d) => {
          const o = d.orders.find((x) => x.code === code);
          if (!o) return;
          o.exchanges.push({ itemId, at: new Date().toISOString(), note });
          if (available > 0) d.reserve[key].used += 1;
        });
        return available > 0;
      },
      markUnclaimed: (code) =>
        mutate((d) => {
          const order = d.orders.find((o) => o.code === code);
          if (order) order.status = "UNCLAIMED";
        }),
      /** Forgets this device's copies. Server orders are untouched; the code still finds them. */
      resetDemo: () => setState(emptyState()),
    };
  }, [state, ready, mutate]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
