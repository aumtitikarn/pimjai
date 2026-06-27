import * as Cesium from "cesium";

export const CESIUM_BASE_URL = "/cesium";
export const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ?? "";
export const hasIonToken = ionToken.length > 0;

let configured = false;

/**
 * Must run in the browser before constructing a Cesium Viewer.
 * Points Cesium at its statically-served runtime assets and wires the ion token.
 */
export function setupCesium() {
  if (configured) return;
  if (typeof window !== "undefined") {
    (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = CESIUM_BASE_URL;
  }
  if (hasIonToken) {
    Cesium.Ion.defaultAccessToken = ionToken;
  }
  configured = true;
}

/**
 * Realistic satellite imagery.
 * - With an ion token: Cesium World Imagery (Bing aerial) — highest quality.
 * - Without: Esri World Imagery, which is free and needs no token.
 */
export async function createImageryLayer(): Promise<Cesium.ImageryLayer> {
  if (hasIonToken) {
    return Cesium.ImageryLayer.fromWorldImagery({});
  }
  const provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
    { enablePickFeatures: false },
  );
  return new Cesium.ImageryLayer(provider);
}

/**
 * Transparent reference overlay with country / city / place labels and
 * boundaries, drawn on top of the satellite imagery. Free, no token required.
 */
export async function createLabelsLayer(): Promise<Cesium.ImageryLayer> {
  const provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
    "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer",
    { enablePickFeatures: false },
  );
  return new Cesium.ImageryLayer(provider);
}

/** 3D terrain only available with an ion token; otherwise stay on the ellipsoid. */
export async function createTerrainProvider(): Promise<Cesium.TerrainProvider> {
  if (hasIonToken) {
    return Cesium.createWorldTerrainAsync();
  }
  return new Cesium.EllipsoidTerrainProvider();
}
