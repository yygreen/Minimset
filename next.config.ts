import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"], qualities: [60, 70, 75], minimumCacheTTL: 2592000 },
  typedRoutes: false,
  turbopack: {
    root: path.resolve("."),
  },
  /* /faq was a real page and may be bookmarked, shared or indexed. Its content
     is now the homepage FAQ section, so send people to it rather than a 404. */
  async redirects() {
    return [{ source: "/faq", destination: "/#faq", permanent: true }];
  },
};

export default nextConfig;
