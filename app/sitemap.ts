import type { MetadataRoute } from "next";
import { LEVELS, SITES } from "@/lib/data";

const BASE = "https://4minimset.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/he`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...LEVELS.map((l) => ({
      url: `${BASE}/sets/${l.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...SITES.map((s) => ({
      url: `${BASE}/${s.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
