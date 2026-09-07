import type { Metadata } from "next";
import { StaffHome } from "./StaffHome";

export const metadata: Metadata = {
  title: "Staff",
};

export default function StaffPage() {
  return <StaffHome />;
}
