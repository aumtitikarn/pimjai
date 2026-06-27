import type { NextConfig } from "next";
import path from "node:path";

// Cesium's @cesium/engine statically imports @spz-loader/core (a Gaussian-splat
// decoder) which inlines its WASM as a raw binary string. The production minifier
// turns that string into a template literal, and its NUL bytes become illegal
// octal escapes ("Octal escape sequences are not allowed in template strings"),
// crashing the whole map at runtime. pimjai is a 2D imagery map and never decodes
// .spz splats, so we alias the package to a no-op stub for BOTH bundlers
// (Turbopack is the default in Next 16; webpack runs when built with --webpack).
const SPZ_STUB = "./stubs/spz-loader-core.js";

const nextConfig: NextConfig = {
  // Allow the Next dev server to serve chunks/assets when reached through a
  // Cloudflare quick tunnel (the subdomain changes on every run, so use a wildcard).
  allowedDevOrigins: ["*.trycloudflare.com"],

  turbopack: {
    resolveAlias: {
      "@spz-loader/core": SPZ_STUB,
    },
  },

  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@spz-loader/core": path.resolve(process.cwd(), "stubs/spz-loader-core.js"),
    };
    return config;
  },
};

export default nextConfig;
