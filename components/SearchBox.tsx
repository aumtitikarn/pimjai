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

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

export default function SearchBox({ onSelect }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimItem[]>([]);
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
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } },
        );
        if (!res.ok) throw new Error("search failed");
        const data: NominatimItem[] = await res.json();
        setResults(data);
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

  function choose(item: NominatimItem) {
    onSelect({
      label: item.display_name.split(",").slice(0, 2).join(", "),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
    setQuery(item.display_name.split(",")[0]);
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
          {results.map((item) => (
            <li key={item.place_id}>
              <button
                onClick={() => choose(item)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-fuchsia-500/10"
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-fuchsia-500" />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
