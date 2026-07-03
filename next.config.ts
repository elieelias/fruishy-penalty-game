import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The game is tested both locally and from a phone on the same network.
  // Next.js blocks its development client for unlisted origins by default.
  allowedDevOrigins: ["127.0.0.1", "192.168.0.102"],
};

export default nextConfig;
