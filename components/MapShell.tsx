"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usePins } from "@/hooks/usePins";
import type { FlyTarget } from "./CesiumMap";
import PinForm from "./PinForm";
import LocateButton from "./LocateButton";
import SearchBox, { SearchResult } from "./SearchBox";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MyLettersDialog from "./MyLettersDialog";
import type { Pin } from "@/schemas/pinSchema";

const CesiumMap = dynamic(() => import("./CesiumMap"), {
  ssr: false,
  loading: () => (
    <div className="pimjai-map-shell flex items-center justify-center bg-slate-900 text-cyan-200">
      <Loader2 className="animate-spin" size={28} />
    </div>
  ),
});

export default function MapShell() {
  const { data: pins = [], isLoading } = usePins();
  const searchParams = useSearchParams();

  const [draftPosition, setDraftPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const [focusPinId, setFocusPinId] = useState<string | null>(null);
  const [myLettersOpen, setMyLettersOpen] = useState(false);
  const deepLinkHandledRef = useRef(false);

  useEffect(() => {
    if (deepLinkHandledRef.current || isLoading) return;
    deepLinkHandledRef.current = true;

    const pinId = searchParams.get("pin");
    if (!pinId) return;
    const target = pins.find((p) => p.id === pinId);
    if (!target) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlyTarget({ lat: target.lat, lng: target.lng, nonce: Date.now() });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocusPinId(target.id);
  }, [isLoading, pins, searchParams]);

  function handleMapClick(lat: number, lng: number) {
    setFocusPinId(null);
    setDraftPosition({ lat, lng });
  }

  function handleLocate(lat: number, lng: number) {
    setFocusPinId(null);
    setDraftPosition(null);
    setMyLocation({ lat, lng });
    // Look straight down so the red pin lands dead-centre (an angled pitch makes
    // the ground point under the camera appear offset from the marker).
    setFlyTarget({ lat, lng, height: 1200, pitch: -90, nonce: Date.now() });
  }

  function handleSearchSelect(result: SearchResult) {
    setDraftPosition(null);
    setFocusPinId(null);
    setFlyTarget({ lat: result.lat, lng: result.lng, height: 4000, nonce: Date.now() });
  }

  function handleViewMyLetter(pin: Pin) {
    setMyLettersOpen(false);
    setDraftPosition(null);
    setFocusPinId(pin.id);
    setFlyTarget({ lat: pin.lat, lng: pin.lng, height: 2000, nonce: Date.now() });
  }

  return (
    <div className="relative h-full w-full">
      <CesiumMap
        pins={pins}
        draftPosition={draftPosition}
        myLocation={myLocation}
        onMapClick={handleMapClick}
        flyTarget={flyTarget}
        focusPinId={focusPinId}
      />

      {/* Floating glass navbar: logo + LINE login */}
      <Navbar onOpenMyLetters={() => setMyLettersOpen(true)} />

      {/* Search sits just beneath the navbar */}
      <div className="pointer-events-none fixed left-0 right-0 top-[72px] z-[900] flex flex-col items-center px-4">
        <div className="pointer-events-auto w-full max-w-md">
          <SearchBox onSelect={handleSearchSelect} />
        </div>
        <p className="mt-2 rounded-full bg-slate-900/55 px-3 py-1 text-xs font-medium text-gray-200 backdrop-blur-sm">
          👆 จิ้มที่แผนที่เพื่อเพิ่มจดหมาย
        </p>
      </div>

      <LocateButton onLocate={handleLocate} />

      <Footer />

      <MyLettersDialog
        open={myLettersOpen}
        onClose={() => setMyLettersOpen(false)}
        onView={handleViewMyLetter}
      />

      {draftPosition && (
        <PinForm
          position={draftPosition}
          onClose={() => setDraftPosition(null)}
          onSubmitted={() => setDraftPosition(null)}
        />
      )}
    </div>
  );
}
