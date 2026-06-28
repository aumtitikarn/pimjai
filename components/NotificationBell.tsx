"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications, useMarkNotificationsRead } from "@/hooks/useNotifications";

const REACTION_LABEL: Record<string, { emoji: string; label: string }> = {
  pat: { emoji: "🫶", label: "ตบบ่า" },
  hug: { emoji: "🤗", label: "กอดปลอบ" },
  agree: { emoji: "👍", label: "เห็นด้วย" },
  reply: { emoji: "💬", label: "ตอบกลับ" },
};

/** Short Thai relative time, e.g. "5 นาทีที่แล้ว". */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม.ที่แล้ว`;
  return `${Math.floor(hr / 24)} วันที่แล้ว`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unread } = useNotifications(true);
  const markRead = useMarkNotificationsRead();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markRead.mutate();
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={toggle}
        aria-label="การแจ้งเตือน"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="pimjai-pop fixed left-1/2 top-16 w-[calc(100vw-1.5rem)] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-72 sm:max-w-none sm:translate-x-0">
          <div className="border-b border-slate-100 px-4 py-2.5 text-sm font-bold text-slate-800">
            การแจ้งเตือน
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">
                ยังไม่มีการแจ้งเตือน 🔔
              </p>
            ) : (
              notifications.map((n) => {
                const r = REACTION_LABEL[n.reaction] ?? { emoji: "💌", label: "" };
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 px-4 py-2.5 ${
                      n.read ? "" : "bg-fuchsia-50/60"
                    }`}
                  >
                    <span className="text-lg leading-none">{r.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug text-slate-700">
                        <span className="font-semibold">{n.actorName ?? "ใครบางคน"}</span>{" "}
                        {r.label}จดหมายของคุณ
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
