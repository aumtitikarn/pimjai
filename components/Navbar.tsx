"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mail, Pencil, LogOut, ChevronDown } from "lucide-react";
import { useAuth, startLineLogin, startLineLogout } from "@/hooks/useAuth";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import NotificationBell from "./NotificationBell";
import ProfileDialog from "./ProfileDialog";

/** Official LINE glyph, inlined so the login button needs no asset request. */
function LineGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.48 2 2 5.69 2 10.23c0 4.07 3.55 7.48 8.35 8.12.32.07.77.21.88.49.1.25.07.64.03.9l-.14.85c-.04.25-.2.99.87.54 1.07-.45 5.77-3.4 7.87-5.82C21.36 13.68 22 12.03 22 10.23 22 5.69 17.52 2 12 2ZM8.13 12.85H6.14a.53.53 0 0 1-.53-.53V8.36a.53.53 0 0 1 1.06 0v3.43h1.46a.53.53 0 0 1 0 1.06Zm2.08-.53a.53.53 0 0 1-1.06 0V8.36a.53.53 0 0 1 1.06 0v3.96Zm4.76 0a.53.53 0 0 1-.36.5.55.55 0 0 1-.17.03.53.53 0 0 1-.43-.21l-2.03-2.77v2.45a.53.53 0 0 1-1.06 0V8.36a.53.53 0 0 1 .36-.5.53.53 0 0 1 .6.18l2.03 2.77V8.36a.53.53 0 0 1 1.06 0v3.96Zm3.3-2.51a.53.53 0 0 1 0 1.06h-1.46v.93h1.46a.53.53 0 0 1 0 1.06h-1.99a.53.53 0 0 1-.53-.53V8.36a.53.53 0 0 1 .53-.53h1.99a.53.53 0 0 1 0 1.06h-1.46v.92h1.46Z" />
    </svg>
  );
}

/** Logo image with a graceful fallback to an inline pin-heart mark + wordmark. */
function LogoMark() {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className="flex items-center gap-2.5">
        <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"
            fill="#ff2d9d"
          />
          <path
            d="M12 7.4c.9-1.05 2.7-.78 3.18.5.27.72.03 1.55-.62 2.2L12 13l-2.56-2.9c-.65-.65-.89-1.48-.62-2.2.48-1.28 2.28-1.55 3.18-.5Z"
            fill="#fff"
          />
        </svg>
        <span className="text-base font-extrabold tracking-tight text-slate-900">พิมพ์ใจ</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Pimjai"
        onError={() => setBroken(true)}
        className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
      />
      <span className="hidden text-base font-extrabold tracking-tight text-slate-900 sm:inline">
        Pimjai
      </span>
    </span>
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setBroken(true)}
        className="h-7 w-7 rounded-full object-cover ring-1 ring-black/10"
      />
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-500/15 text-xs font-bold text-fuchsia-700">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Live "N people online" pill, fed by Supabase Realtime presence. */
function OnlinePill() {
  const count = useOnlineCount();
  if (count <= 0) return null;
  return (
    <span
      className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
      title="กำลังออนไลน์ตอนนี้"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {count} ออนไลน์
    </span>
  );
}

export default function Navbar({ onOpenMyLetters }: { onOpenMyLetters?: () => void }) {
  const { user, isLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the profile menu on an outside click.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[950] p-3">
      <nav className="pimjai-card pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl px-3 py-2 shadow-lg sm:px-4">
        {/* Brand: logo + wordmark */}
        <Link href="/" className="flex items-center" aria-label="Pimjai — home">
          <LogoMark />
        </Link>

        {/* Right: presence + notifications + auth */}
        <div className="flex items-center gap-2">
          <OnlinePill />

          {isLoading ? (
            <span className="h-9 w-28 animate-pulse rounded-full bg-slate-200/70" aria-hidden="true" />
          ) : user ? (
            <div className="flex items-center gap-1.5">
              <NotificationBell />

              {/* Profile dropdown: edit profile / my letters / logout */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="เมนูโปรไฟล์"
                  className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-slate-900/5"
                >
                  <Avatar name={user.displayName} src={user.pictureUrl} />
                  <span className="hidden max-w-[10ch] truncate text-sm font-semibold text-slate-800 sm:inline">
                    {user.displayName}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-slate-500 transition ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="pimjai-pop absolute right-0 top-12 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-2xl"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setEditing(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Pencil size={16} className="text-slate-400" /> แก้ไขโปรไฟล์
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenMyLetters?.();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Mail size={16} className="text-slate-400" /> จดหมายของฉัน
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        startLineLogout();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-50"
                    >
                      <LogOut size={16} /> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={startLineLogin}
              className="flex items-center gap-2 rounded-full bg-[#06C755] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#05b54c] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2"
            >
              <LineGlyph />
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </nav>

      {user && editing && (
        <ProfileDialog
          open
          onClose={() => setEditing(false)}
          name={user.displayName}
          bio={user.bio ?? ""}
          avatar={user.pictureUrl}
        />
      )}
    </header>
  );
}
