import type { MetadataRoute } from "next";

const BASE = "https://4minimset.com";

/**
 * The site is one page plus two standing documents. The questions page was
 * folded into the homepage too; /faq redirects to /#faq for anything that
 * still links to it. The product pages were
 * folded into the homepage (their content lives at /#mehudar-aa and so on), the
 * per-community pages were retired with the pickup model, and the Hebrew home
 * was retired too; none of them should be offered to a crawler any more.
 *
 * Order pages are deliberately absent: they carry noindex so a customer's
 * confirmation can never surface in a search result.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/policies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
