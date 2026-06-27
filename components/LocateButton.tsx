"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MapPin } from "@/components/animate-ui/icons/map-pin";

interface LocateButtonProps {
  onLocate: (lat: number, lng: number) => void;
}

export default function LocateButton({ onLocate }: LocateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  function handleClick() {
    if (loading) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    setError(null);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onLocate(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLoading(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "กรุณาอนุญาตให้เข้าถึงตำแหน่ง"
            : "ไม่สามารถระบุตำแหน่งได้",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="fixed right-5 bottom-[calc(var(--footer-h)+1rem)] z-[900] flex flex-col items-end gap-2">
      {error && (
        <span className="rounded-lg bg-black/70 px-3 py-1.5 text-xs text-rose-200 shadow-lg">
          {error}
        </span>
      )}
      <button
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        disabled={loading}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600 px-4 py-3 font-bold text-white shadow-[0_0_25px_rgba(157,77,255,0.6)] transition active:scale-95 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <MapPin size={18} animate={hover} />
        )}
        <span className="hidden sm:inline">ตำแหน่งปัจจุบันของคุณ</span>
        <span className="sm:hidden">ตำแหน่งของฉัน</span>
      </button>
    </div>
  );
}
