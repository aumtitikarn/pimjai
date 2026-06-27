"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Lock } from "lucide-react";
import { useUpdateProfile } from "@/hooks/useProfile";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  name: string;
  bio: string;
  avatar?: string;
}

export default function ProfileDialog({ open, onClose, name, bio, avatar }: ProfileDialogProps) {
  const [displayName, setDisplayName] = useState(name);
  const [bioText, setBioText] = useState(bio);
  const update = useUpdateProfile();

  if (!open || typeof document === "undefined") return null;

  const canSave = displayName.trim().length > 0 && !update.isPending;

  function handleSave() {
    update.mutate(
      { displayName: displayName.trim(), bio: bioText.trim() },
      { onSuccess: onClose },
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="pimjai-pop max-h-[90vh] w-full max-w-[360px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">แก้ไขโปรไฟล์</h2>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="text-slate-400 transition hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar — not editable */}
        <div className="mb-4 flex flex-col items-center gap-1.5">
          <div className="relative">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                className="h-20 w-20 rounded-full object-cover ring-2 ring-fuchsia-200"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-fuchsia-500/15 text-2xl font-bold text-fuchsia-700">
                {displayName.trim().charAt(0).toUpperCase() || "?"}
              </span>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white ring-2 ring-white">
              <Lock size={13} />
            </span>
          </div>
          <p className="text-[11px] text-slate-400">รูปจาก LINE · เปลี่ยนไม่ได้</p>
        </div>

        {/* Display name */}
        <label className="mb-1 block text-xs font-semibold text-slate-500">ชื่อที่แสดง</label>
        <input
          type="text"
          value={displayName}
          maxLength={40}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="ชื่อของคุณ"
          className="w-full rounded-xl border border-slate-300 bg-white/70 p-2.5 text-slate-800 outline-none focus:border-fuchsia-400"
        />

        {/* Bio */}
        <label className="mb-1 mt-3 block text-xs font-semibold text-slate-500">
          Bio <span className="font-normal text-slate-400">(ไม่บังคับ)</span>
        </label>
        <textarea
          value={bioText}
          maxLength={200}
          rows={3}
          onChange={(e) => setBioText(e.target.value)}
          placeholder="เล่าอะไรเกี่ยวกับตัวเองสักหน่อย..."
          className="w-full resize-none rounded-xl border border-slate-300 bg-white/70 p-2.5 text-slate-800 outline-none focus:border-fuchsia-400"
        />
        <div className="mt-1 text-right text-[11px] text-slate-400">{bioText.length}/200</div>

        {update.isError && (
          <p className="mt-1 text-xs text-red-500">บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง</p>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-2.5 font-bold text-white disabled:opacity-50"
        >
          <Check size={16} /> {update.isPending ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
