"use client";

import { createPortal } from "react-dom";
import { X, Trash2, MessageCircle } from "lucide-react";
import type { Reply } from "@/schemas/replySchema";

/** Short Thai relative time, e.g. "5 นาทีที่แล้ว". */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม.ที่แล้ว`;
  return `${Math.floor(hr / 24)} วันที่แล้ว`;
}

/** One reply row — shared by the inline preview and the full dialog. */
export function ReplyItem({ reply, onDelete }: { reply: Reply; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-start gap-2">
      {reply.author_avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={reply.author_avatar}
          alt=""
          className="mt-0.5 h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-black/10"
        />
      ) : (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">
          {reply.author_name ? reply.author_name.trim().charAt(0).toUpperCase() : "🕊️"}
        </span>
      )}
      <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold text-slate-600">
            {reply.author_name ?? "นิรนาม"}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="text-[10px] text-slate-400">{timeAgo(reply.created_at)}</span>
            {reply.is_mine && (
              <button
                onClick={() => onDelete(reply.id)}
                aria-label="ลบคำตอบ"
                className="text-slate-300 transition hover:text-red-500"
              >
                <Trash2 size={11} />
              </button>
            )}
          </span>
        </div>
        <p className="break-words text-xs leading-snug text-slate-800">{reply.text}</p>
      </div>
    </div>
  );
}

interface RepliesDialogProps {
  open: boolean;
  onClose: () => void;
  replies: Reply[];
  onDelete: (id: string) => void;
}

/** Full, scrollable list of every reply on a letter (newest at the bottom). */
export default function RepliesDialog({ open, onClose, replies, onDelete }: RepliesDialogProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="pimjai-pop flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="flex items-center gap-1.5 text-base font-bold text-slate-900">
            <MessageCircle size={16} /> คำตอบกลับ
            <span className="text-slate-400">({replies.length})</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="text-slate-400 transition hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {replies.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">ยังไม่มีคำตอบกลับ 💬</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {replies.map((r) => (
                <ReplyItem key={r.id} reply={r} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
