import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITES, getSite } from "@/lib/data";
import { OrderFlow } from "./OrderFlow";

export function generateStaticParams() {
  return SITES.map((s) => ({ site: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ site: string }>;
}): Promise<Metadata> {
  const { site: slug } = await params;
  const site = getSite(slug);
  return { title: site ? `Order for ${site.name}` : "Order" };
}

export default async function OrderPage({ params }: { params: Promise<{ site: string }> }) {
  const { site: slug } = await params;
  const site = getSite(slug);
  if (!site) notFound();
  return <OrderFlow site={site} />;
}
