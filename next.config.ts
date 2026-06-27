import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the Next dev server to serve chunks/assets when reached through a
  // Cloudflare quick tunnel (the subdomain changes on every run, so use a wildcard).
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
