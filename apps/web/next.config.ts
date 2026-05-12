import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@wishlist/api"],
  // We externalize both the driver and our DB package to prevent
  // Next.js from trying to bundle the native better-sqlite3 binary.
  serverExternalPackages: ["@wishlist/db", "better-sqlite3"],
};

export default nextConfig;
