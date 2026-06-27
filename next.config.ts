import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the Next dev server to serve chunks/assets when reached through a
  // Cloudflare quick tunnel (the subdomain changes on every run, so use a wildcard).
  allowedDevOrigins: ["*.trycloudflare.com"],

  webpack(config) {
    // Cesium 1.142 pulls in @spz-loader/core (Gaussian-splat decoder), which
    // inlines its WASM as a raw binary string. The production SWC minifier turns
    // that string into a template literal, and its NUL bytes become illegal octal
    // escapes ("Octal escape sequences are not allowed in template strings"),
    // crashing the whole map at runtime. We never render .spz splats, so the
    // decoder is only loaded lazily and is safe to stub out of the bundle.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@spz-loader/core": false,
    };
    return config;
  },
};

export default nextConfig;
