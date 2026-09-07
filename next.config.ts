import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"], qualities: [60, 70, 75], minimumCacheTTL: 2592000 },
  typedRoutes: false,
  turbopack: {
    root: path.resolve("."),
  },
};

export default nextConfig;
