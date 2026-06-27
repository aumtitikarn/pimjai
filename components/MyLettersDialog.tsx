"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Eye, Trash2, Lock, Timer, Loader2 } from "lucide-react";
import { type Pin, pinEmoji } from "@/schemas/pinSchema";
import { useMyLetters, useDeletePin } from "@/hooks/usePins";

interface MyLettersDialogProps {
  open: boolean;
  onClose: () => void;
  /** Fly to a letter on the map (and open its popup). */
  onView: (pin: Pin) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

export default function MyLettersDialog({ open, onClose, onView }: MyLettersDialogProps) {
  const { data: letters = [], isLoading } = useMyLetters(open);
  const deletePin = useDeletePin();
  // The letter awaiting a delete confirmation (drives the confirm sub-dialog).
  const [confirmTarget, setConfirmTarget] = useState<Pin | null>(null);

  if (!open || typeof document === "undefined") return null;

  function handleConfirmDelete() {
    if (!confirmTarget) return;
    deletePin.mutate(confirmTarget.id, { onSuccess: () => setConfirmTarget(null) });
  }

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
          <h2 className="text-base font-bold text-slate-900">จดหมายของฉัน 💌</h2>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="text-slate-400 transition hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : letters.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-400">
              คุณยังไม่มีจดหมาย 📭<br />
              จิ้มที่แผนที่เพื่อฝากจดหมายแรกได้เลย
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {letters.map((pin) => {
                const reactions =
                  (pin.pat_count ?? 0) + (pin.hug_count ?? 0) + (pin.agree_count ?? 0);
                return (
                  <li key={pin.id} className="flex items-start gap-3 px-5 py-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg"
                      style={{ background: `${pin.color ?? "#ff2d9d"}22` }}
                    >
                      {pinEmoji(pin.mood, pin.emoji)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {pin.is_locked ? (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Lock size={12} /> {pin.hint || "จดหมายที่ล็อกไว้"}
                          </span>
                        ) : (
                          pin.text
                        )}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatDate(pin.created_at)}</span>
                        {reactions > 0 && <span>· 🫶 {reactions}</span>}
                        {pin.expires_at && (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            · <Timer size={11} /> 24 ชม.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => onView(pin)}
                        aria-label="ดูบนแผนที่"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmTarget(pin)}
                        aria-label="ลบ"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmTarget && (
        <div
          className="fixed inset-0 z-[1110] flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deletePin.isPending && setConfirmTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="pimjai-pop w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl"
          >
            <h3 className="text-base font-bold text-slate-900">ลบจดหมายนี้?</h3>
            <p className="mt-1.5 line-clamp-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {confirmTarget.is_locked
                ? `🔒 ${confirmTarget.hint || "จดหมายที่ล็อกไว้"}`
                : `“${confirmTarget.text}”`}
            </p>
            <p className="mt-2 text-xs text-slate-500">ลบแล้วกู้คืนไม่ได้นะ</p>

            {deletePin.isError && (
              <p className="mt-1 text-xs text-red-500">ลบไม่สำเร็จ ลองใหม่อีกครั้ง</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmTarget(null)}
                disabled={deletePin.isPending}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletePin.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 size={15} /> {deletePin.isPending ? "กำลังลบ..." : "ยืนยันลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
