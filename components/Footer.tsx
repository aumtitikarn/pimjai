"use client";

import { useState } from "react";

/**
 * Full-width credit bar pinned along the bottom of the map. The strip spans the
 * whole width (translucent so the map still reads through it) with the logo +
 * copyright centred.
 */
export default function Footer() {
  const [broken, setBroken] = useState(false);

  return (
    <footer className="fixed inset-x-0 bottom-0 z-[900] h-[var(--footer-h)] border-t border-white/10 bg-slate-900/75 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-lg items-center justify-center gap-3 px-4">
        {!broken && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/itstudentlogo.jpeg"
            alt="นักเรียนไอที"
            width={28}
            height={28}
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            className="rounded-sm object-cover"
          />
        )}
        <p className="text-xs text-gray-300">© 2026 นักเรียนไอที</p>
      </div>
    </footer>
  );
}
