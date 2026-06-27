// Copies Cesium's prebuilt runtime assets into /public/cesium so they can be
// served statically. Cesium lazily fetches Workers/Assets/Widgets from
// window.CESIUM_BASE_URL at runtime — these are NOT bundled by Turbopack/webpack.
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

function resolveCesiumBuild() {
  // Resolve through the installed package so pnpm's nested paths are handled.
  const pkgPath = require.resolve("cesium/package.json");
  return join(dirname(pkgPath), "Build", "Cesium");
}

const source = resolveCesiumBuild();
const dest = join(process.cwd(), "public", "cesium");

if (!existsSync(source)) {
  console.error(`[copy-cesium] Source not found: ${source}`);
  process.exit(1);
}

const version = JSON.parse(readFileSync(require.resolve("cesium/package.json"), "utf8")).version;
const stampPath = join(dest, ".version");

// Skip if already copied for this exact version.
if (existsSync(stampPath) && readFileSync(stampPath, "utf8") === version) {
  console.log(`[copy-cesium] up to date (v${version})`);
  process.exit(0);
}

for (const dir of ["Assets", "ThirdParty", "Widgets", "Workers"]) {
  cpSync(join(source, dir), join(dest, dir), { recursive: true });
}
mkdirSync(dest, { recursive: true });
require("node:fs").writeFileSync(stampPath, version);

console.log(`[copy-cesium] copied Cesium v${version} -> public/cesium`);
