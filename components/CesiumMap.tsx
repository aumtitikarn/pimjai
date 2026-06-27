"use client";

import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import { type Pin, pinColor, pinEmoji } from "@/schemas/pinSchema";
import {
  setupCesium,
  createImageryLayer,
  createLabelsLayer,
  createTerrainProvider,
} from "@/utils/cesiumConfig";
import { pinBillboard, draftBillboard, glowTier } from "./cesiumMarkers";
import { MapPin } from "@/components/animate-ui/icons/map-pin";
import PinPopup from "./PinPopup";

export interface FlyTarget {
  lat: number;
  lng: number;
  height?: number;
  /** Camera pitch in degrees (negative = looking down). Default -55 (angled). */
  pitch?: number;
  nonce: number;
}

interface CesiumMapProps {
  pins: Pin[];
  draftPosition: { lat: number; lng: number } | null;
  myLocation: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  flyTarget: FlyTarget | null;
  focusPinId: string | null;
}

const DRAFT_ID = "__draft__";
const MY_LOCATION_ID = "__my_location__";

export default function CesiumMap({
  pins,
  draftPosition,
  myLocation,
  onMapClick,
  flyTarget,
  focusPinId,
}: CesiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const locationOverlayRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const pinDataRef = useRef<Map<string, Pin>>(new Map());
  const onMapClickRef = useRef(onMapClick);
  const selectedRef = useRef<Pin | null>(null);
  const myLocationRef = useRef<{ lat: number; lng: number } | null>(myLocation);

  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    selectedRef.current = selectedPin;
  }, [selectedPin]);

  // ---- Mount: build the viewer once ----
  useEffect(() => {
    if (!containerRef.current) return;
    setupCesium();

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayer: false,
      geocoder: false,
      timeline: false,
      animation: false,
      homeButton: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      infoBox: false,
      selectionIndicator: false,
      creditContainer: undefined,
    });
    viewerRef.current = viewer;

    // Realistic, fully-lit globe with atmosphere (no day/night darkening).
    viewer.scene.globe.enableLighting = false;
    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
    viewer.scene.fog.enabled = true;

    let cancelled = false;
    (async () => {
      try {
        const imagery = await createImageryLayer();
        if (cancelled) return;
        viewer.imageryLayers.add(imagery);

        // Transparent place-name / boundary labels on top of the satellite imagery.
        const labels = await createLabelsLayer();
        if (cancelled) return;
        viewer.imageryLayers.add(labels);

        const terrain = await createTerrainProvider();
        if (cancelled) return;
        viewer.terrainProvider = terrain;
      } catch (err) {
        console.error("[CesiumMap] imagery/terrain failed", err);
      }
    })();

    // Opening world view, gently angled over SE Asia.
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(100.5, 13.75, 9_000_000),
    });

    // Disable the default double-click "track entity" behaviour.
    viewer.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = viewer.scene.pick(movement.position);
      const id = picked?.id?.id as string | undefined;

      if (id && pinDataRef.current.has(id)) {
        setSelectedPin(pinDataRef.current.get(id) ?? null);
        return;
      }

      const ray = viewer.camera.getPickRay(movement.position);
      const cartesian = ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined;
      if (cartesian) {
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        onMapClickRef.current(
          Cesium.Math.toDegrees(carto.latitude),
          Cesium.Math.toDegrees(carto.longitude),
        );
        setSelectedPin(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Keep HTML overlays glued to their world points every frame. Hide them when
    // the point is on the far side of the globe (surface normal facing away).
    const scratchNormal = new Cesium.Cartesian3();
    const scratchToCamera = new Cesium.Cartesian3();
    const placeOverlay = (
      overlay: HTMLDivElement,
      lng: number,
      lat: number,
      offset: string,
    ) => {
      const world = Cesium.Cartesian3.fromDegrees(lng, lat);
      const cameraPos = viewer.scene.camera.positionWC;
      Cesium.Cartesian3.normalize(world, scratchNormal);
      Cesium.Cartesian3.subtract(cameraPos, world, scratchToCamera);
      const facingCamera = Cesium.Cartesian3.dot(scratchNormal, scratchToCamera) > 0;
      const win = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, world);
      if (facingCamera && win) {
        overlay.style.display = "block";
        overlay.style.transform = `${offset} translate(${win.x}px, ${win.y}px)`;
      } else {
        overlay.style.display = "none";
      }
    };
    const onPostRender = () => {
      const overlay = overlayRef.current;
      const pin = selectedRef.current;
      if (overlay) {
        if (pin) placeOverlay(overlay, pin.lng, pin.lat, "translate(-50%, calc(-100% - 46px))");
        else overlay.style.display = "none";
      }

      const locOverlay = locationOverlayRef.current;
      const loc = myLocationRef.current;
      if (locOverlay) {
        // Anchor the pin's tip at the GPS point (overlay bottom-centre).
        if (loc) placeOverlay(locOverlay, loc.lng, loc.lat, "translate(-50%, -100%)");
        else locOverlay.style.display = "none";
      }
    };
    viewer.scene.postRender.addEventListener(onPostRender);

    setReady(true);

    return () => {
      cancelled = true;
      viewer.scene.postRender.removeEventListener(onPostRender);
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // ---- Sync pin entities ----
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;

    const dataMap = pinDataRef.current;
    const seen = new Set<string>();

    for (const pin of pins) {
      seen.add(pin.id);
      const prev = dataMap.get(pin.id);
      dataMap.set(pin.id, pin);
      const tier = glowTier(pin.agree_count ?? 0);
      const existing = viewer.entities.getById(pin.id);

      if (existing) {
        // Only repaint when the glow tier actually changed (e.g. a new reaction
        // pushed it over a threshold), to avoid churning billboard textures.
        const prevTier = glowTier(prev?.agree_count ?? 0);
        if (prevTier !== tier && existing.billboard) {
          existing.billboard.image = new Cesium.ConstantProperty(
            pinBillboard(
              pinColor(pin.mood, pin.color),
              pinEmoji(pin.mood, pin.emoji),
              pin.is_locked,
              tier,
            ),
          );
          viewer.scene.requestRender();
        }
        continue;
      }

      viewer.entities.add({
        id: pin.id,
        position: Cesium.Cartesian3.fromDegrees(pin.lng, pin.lat),
        billboard: {
          image: pinBillboard(
            pinColor(pin.mood, pin.color),
            pinEmoji(pin.mood, pin.emoji),
            pin.is_locked,
            tier,
          ),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.45),
          disableDepthTestDistance: 5000,
        },
      });
    }

    // Remove entities for pins no longer present (and keep the draft entity).
    const toRemove: string[] = [];
    for (const entity of viewer.entities.values) {
      if (entity.id === DRAFT_ID || entity.id === MY_LOCATION_ID) continue;
      if (!seen.has(entity.id)) toRemove.push(entity.id);
    }
    for (const id of toRemove) {
      viewer.entities.removeById(id);
      dataMap.delete(id);
    }
  }, [pins, ready]);

  // ---- Draft marker ----
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;

    viewer.entities.removeById(DRAFT_ID);
    if (draftPosition) {
      viewer.entities.add({
        id: DRAFT_ID,
        position: Cesium.Cartesian3.fromDegrees(draftPosition.lng, draftPosition.lat),
        billboard: {
          image: draftBillboard(),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }, [draftPosition, ready]);

  // ---- "You are here" marker (current GPS location) ----
  // Rendered as an HTML overlay (animated MapPin) glued to the GPS point in
  // onPostRender, rather than a WebGL billboard, so the icon can animate.
  useEffect(() => {
    myLocationRef.current = myLocation;
    // Nudge a render so the overlay repositions immediately, even when idle.
    viewerRef.current?.scene.requestRender();
  }, [myLocation, ready]);

  // ---- Fly-to (warp / deep link / search) ----
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready || !flyTarget) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        flyTarget.lng,
        flyTarget.lat,
        flyTarget.height ?? 2500,
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(flyTarget.pitch ?? -55),
        roll: 0,
      },
      duration: 2.6,
    });
  }, [flyTarget, ready]);

  // ---- Open a specific pin's popup (warp / deep link) ----
  useEffect(() => {
    if (!ready || !focusPinId) return;
    const pin = pinDataRef.current.get(focusPinId);
    if (pin) setSelectedPin(pin);
  }, [focusPinId, ready]);

  return (
    <div className="pimjai-map-shell">
      <div ref={containerRef} className="h-full w-full" />
      <div
        ref={overlayRef}
        className="pointer-events-auto absolute left-0 top-0 z-[500]"
        style={{ display: "none" }}
      >
        {selectedPin && (
          <div className="pimjai-card pimjai-pop relative w-[280px] rounded-2xl p-4 text-sm shadow-xl">
            <PinPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />
            <div className="pimjai-card-tail" />
          </div>
        )}
      </div>

      {/* Animated "you are here" pin, glued to the GPS point in onPostRender. */}
      <div
        ref={locationOverlayRef}
        className="pointer-events-none absolute left-0 top-0 z-[400] drop-shadow-[0_3px_4px_rgba(0,0,0,0.45)]"
        style={{ display: "none" }}
      >
        {myLocation && (
          <MapPin
            size={40}
            animateOnHover
            animation="default"
            className="pointer-events-auto text-red-600"
          />
        )}
      </div>
    </div>
  );
}
