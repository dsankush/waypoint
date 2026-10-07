import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a second dev/build run use its own folder (NEXT_DIST_DIR=.next-test) without clobbering the main one.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["pdf-parse", "mammoth"],
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
