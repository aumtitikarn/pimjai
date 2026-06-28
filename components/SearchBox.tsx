"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, MapPin, X } from "lucide-react";

export interface SearchResult {
  label: string;
  lat: number;
  lng: number;
}

interface SearchBoxProps {
  onSelect: (result: SearchResult) => void;
}

/**
 * Photon (komoot) returns GeoJSON. Unlike Nominatim it does typo-tolerant,
 * prefix/as-you-type matching, so a small misspelling still finds the place.
 */
interface PhotonFeature {
  geometry: { coordinates: [number, number] }; // [lng, lat]
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

/** Human-readable address line, e.g. "Tokyo Tower, Minato, Tokyo, Japan". */
function describe(f: PhotonFeature): string {
  const p = f.properties;
  const parts = [
    [p.housenumber, p.street].filter(Boolean).join(" ") || p.name,
    p.district,
    p.city,
    p.county,
    p.state,
    p.country,
  ].filter(Boolean) as string[];
  // Collapse consecutive duplicates (e.g. name === city for a city result).
  return parts.filter((part, i) => part !== parts[i - 1]).join(", ");
}

export default function SearchBox({ onSelect }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced geocoding search.
  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?limit=6&q=${encodeURIComponent(q)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } },
        );
        if (!res.ok) throw new Error("search failed");
        const data: { features?: PhotonFeature[] } = await res.json();
        setResults(data.features ?? []);
        setOpen(true);
      } catch {
        // ignore aborted/failed lookups
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function choose(item: PhotonFeature) {
    const full = describe(item);
    const [lng, lat] = item.geometry.coordinates;
    onSelect({
      label: full.split(",").slice(0, 2).join(", "),
      lat,
      lng,
    });
    setQuery(item.properties.name || full.split(",")[0]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="pointer-events-auto relative w-full">
      <div className="pimjai-card flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg">
        <Search size={18} className="shrink-0 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search a place… (e.g. Tokyo Tower)"
          className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
        />
        {loading && <Loader2 size={16} className="shrink-0 animate-spin text-slate-400" />}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            aria-label="Clear"
            className="shrink-0 text-slate-400 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="pimjai-card absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto rounded-2xl py-1 shadow-xl">
          {results.map((item, i) => (
            <li key={`${item.properties.osm_type ?? "x"}${item.properties.osm_id ?? i}`}>
              <button
                onClick={() => choose(item)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-fuchsia-500/10"
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-fuchsia-500" />
                <span className="line-clamp-2">{describe(item)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
