import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@wishlist/api"],
  serverExternalPackages: ["@wishlist/db", "better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
};

export default nextConfig;
