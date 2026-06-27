"use client";

import { useEffect, useRef } from "react";
import { Lock, Mail } from "lucide-react";
import { useAuth, startLineLogin } from "@/hooks/useAuth";

interface PostConfirmDialogProps {
  isLocked: boolean;
  /** Author chose to reveal their LINE identity (signed-in only). */
  revealIdentity: boolean;
  /** Author chose to let the letter self-destruct after 24h. */
  ephemeral: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Final gate before a letter is dropped. Summarizes the author's identity and
 * lifetime choices so the consequences are explicit, and points anonymous guests
 * at LINE Login if they want those choices (and the ability to manage the letter).
 */
export default function PostConfirmDialog({
  isLocked,
  revealIdentity,
  ephemeral,
  isPending,
  onConfirm,
  onCancel,
}: PostConfirmDialogProps) {
  const { user, isAuthenticated } = useAuth();
  // Anonymous guests can't reveal identity or keep a letter permanently.
  const willReveal = isAuthenticated && revealIdentity;
  const willVanish = isAuthenticated ? ephemeral : true;
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPending, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => !isPending && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="post-confirm-title"
        aria-describedby="post-confirm-body"
        onClick={(e) => e.stopPropagation()}
        className="pimjai-card pimjai-pop max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500/12 text-fuchsia-600">
            {isLocked ? <Lock size={20} /> : <Mail size={20} />}
          </span>
          <div className="min-w-0">
            <h2 id="post-confirm-title" className="text-base font-bold text-slate-900">
              ส่งจดหมายนี้เลยไหม?
            </h2>
            <p id="post-confirm-body" className="mt-1.5 text-sm leading-relaxed text-slate-700">
              {isAuthenticated ? (
                <>
                  จดหมายนี้จะ{" "}
                  <strong className="font-semibold text-slate-900">
                    {willVanish ? "หายไปใน 24 ชั่วโมง" : "ถูกเก็บถาวร"}
                  </strong>{" "}
                  {willReveal ? (
                    <>
                      ในนาม{" "}
                      <strong className="font-semibold text-fuchsia-700">
                        {user?.displayName}
                      </strong>
                    </>
                  ) : (
                    <>แบบ<strong className="font-semibold text-slate-900">ไม่ระบุตัวตน</strong></>
                  )}{" "}
                  และคุณจัดการหรือลบได้ภายหลัง
                </>
              ) : (
                <>
                  จดหมายแบบไม่ระบุตัวตนจะ{" "}
                  <strong className="font-semibold text-slate-900">หายไปใน 24 ชั่วโมง</strong>{" "}
                  และลบเองไม่ได้ — หากต้องการเลือกเปิดเผยตัวตน ให้อยู่ถาวร และลบได้ภายหลัง กรุณาเข้าสู่ระบบผ่าน LINE ก่อนส่ง
                </>
              )}
            </p>
          </div>
        </div>

        {!isAuthenticated && (
          <button
            type="button"
            onClick={startLineLogin}
            disabled={isPending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] py-2.5 text-sm font-semibold text-white transition hover:bg-[#05b54c] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 5.69 2 10.23c0 4.07 3.55 7.48 8.35 8.12.32.07.77.21.88.49.1.25.07.64.03.9l-.14.85c-.04.25-.2.99.87.54 1.07-.45 5.77-3.4 7.87-5.82C21.36 13.68 22 12.03 22 10.23 22 5.69 17.52 2 12 2Z" />
            </svg>
            เข้าสู่ระบบด้วย LINE ก่อนส่ง
          </button>
        )}

        <div className="mt-3 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl bg-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-sm shadow-fuchsia-500/30 transition hover:bg-fuchsia-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {isPending
              ? "กำลังส่ง..."
              : isAuthenticated
                ? "ส่งเลย"
                : "ส่งแบบไม่ระบุตัวตน (24 ชม.)"}
          </button>
        </div>
      </div>
    </div>
  );
}
