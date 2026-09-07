import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/staff", "/staff/", "/order/"] },
    ],
    sitemap: "https://4minimset.com/sitemap.xml",
    host: "https://4minimset.com",
  };
}
