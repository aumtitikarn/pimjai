// Stub for @spz-loader/core (Cesium's Gaussian-splat decoder).
//
// The real package inlines its WASM as a raw binary string, which the production
// minifier turns into a template literal with illegal octal escapes — crashing
// the whole map. pimjai is a 2D imagery map and never loads .spz splats, so we
// alias the package to this no-op (see next.config.ts). Cesium's GltfSpzLoader
// imports `loadSpz` statically but only calls it when decoding a splat, which
// never happens here.

export function loadSpz() {
  return Promise.reject(
    new Error("Gaussian splat (.spz) decoding is disabled in pimjai."),
  );
}
