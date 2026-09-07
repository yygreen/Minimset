"use client";

import { useEffect, useState } from "react";
import { msUntilDeadline } from "@/lib/orders";

/**
 * Renders `children` while registration is open and `closed` once the deadline
 * has passed. The pages are static, so the decision is made in the browser after
 * mount (the first paint matches the server HTML, then swaps if needed).
 */
export function OpenOnly({ children, closed = null }: { children: React.ReactNode; closed?: React.ReactNode }) {
  const [state, setState] = useState<"open" | "closed">("open");

  useEffect(() => {
    const check = () => setState(msUntilDeadline() > 0 ? "open" : "closed");
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return <>{state === "open" ? children : closed}</>;
}
