"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Order, OrderItem, orderTotal } from "./orders";

const STORAGE_KEY = "vsamachta.demo.v1";

/**
 * This device's own copy of the orders it placed, so a confirmation renders instantly and a
 * code survives a refresh. The server is still the truth; this is a convenience cache.
 */
interface DemoState {
  orders: Order[];
}

function emptyState(): DemoState {
  return { orders: [] };
}

interface StoreApi extends DemoState {
  ready: boolean;
  placeOrder: (order: Order) => void;
  findOrder: (code: string) => Order | undefined;
  updateItems: (code: string, items: OrderItem[]) => void;
  cancelOrder: (code: string) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => ({ orders: [] }));
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
          order.totalCents = orderTotal(items) + (order.shippingCents ?? 0);
        }),
      cancelOrder: (code) =>
        mutate((d) => {
          const order = d.orders.find((o) => o.code === code);
          if (order) order.status = "CANCELLED_REFUNDED";
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
