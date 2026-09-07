import type { Metadata } from "next";

/** Order lookup and order status pages are personal; keep them out of the index. */
export const metadata: Metadata = {
  title: "Find your order",
  robots: { index: false, follow: true },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
