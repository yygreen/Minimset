import type { Metadata } from "next";
import { StaffProvider } from "@/lib/staff-store";
import { StaffGate } from "./StaffGate";

/** Staff screens are operational tools; keep them out of search results. */
export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffProvider>
      <StaffGate>{children}</StaffGate>
    </StaffProvider>
  );
}
