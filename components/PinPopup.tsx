"use client";

import { useEffect, useState } from "react";
import {
  Lock,
  Share2,
  Link as LinkIcon,
  Check,
  Unlock,
  X,
  Trash2,
  Clock,
  MessageCircle,
  Send,
} from "lucide-react";
import { type Pin, type ReactionType, pinColor, pinEmoji } from "@/schemas/pinSchema";
import { decryptMessage } from "@/utils/crypto";
import { reverseGeocode } from "@/utils/geocode";
import {
  useDeletePin,
  useMyPinIds,
  usePinReactions,
  useToggleReaction,
} from "@/hooks/usePins";
import { useReplies, useCreateReply, useDeleteReply } from "@/hooks/useReplies";
import { useAuth, startLineLogin } from "@/hooks/useAuth";
import { REPLY_MAX_LEN } from "@/schemas/replySchema";
import ShareDialog from "./ShareDialog";
import RepliesDialog, { ReplyItem } from "./RepliesDialog";

/** How many replies to preview inline before "ดูทั้งหมด". */
const REPLY_PREVIEW = 3;

/** Sent date + time, e.g. "28 มิ.ย. 69 14:30". */
function formatSentAt(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "pat", emoji: "🫶", label: "ตบบ่า" },
  { type: "hug", emoji: "🤗", label: "กอดปลอบ" },
  { type: "agree", emoji: "👍", label: "เห็นด้วย" },
];

export default function PinPopup({ pin, onClose }: { pin: Pin; onClose?: () => void }) {
  const [password, setPassword] = useState("");
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [locationLabel, setLocationLabel] = useState(
    `${pin.lat.toFixed(3)}, ${pin.lng.toFixed(3)}`,
  );

  useEffect(() => {
    reverseGeocode(pin.lat, pin.lng).then(setLocationLabel);
  }, [pin.lat, pin.lng]);

  const deletePin = useDeletePin();
  const myPinIds = useMyPinIds();
  const isOwner = myPinIds.has(pin.id);

  // Optimistic ids start with "optimistic-" and aren't persisted yet, so skip
  // reactions until the real id arrives.
  const reactable = !pin.id.startsWith("optimistic-");
  const reactions = usePinReactions(reactable ? pin.id : null);
  const toggleReaction = useToggleReaction(pin.id);
  // Authoritative once loaded; until then fall back to the counts on the pin.
  const counts = reactions.data?.counts ?? {
    pat: pin.pat_count ?? 0,
    hug: pin.hug_count ?? 0,
    agree: pin.agree_count ?? 0,
  };
  const mine = reactions.data?.mine ?? [];

  // Replies — public comments under the letter, members only. Loaded lazily once
  // the letter is readable (a real, persisted id).
  const { isAuthenticated } = useAuth();
  const replies = useReplies(reactable ? pin.id : null);
  const createReply = useCreateReply(pin.id);
  const deleteReply = useDeleteReply(pin.id);
  const [replyText, setReplyText] = useState("");
  const [revealReply, setRevealReply] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const replyList = replies.data ?? [];
  // Preview only the latest few inline; the rest live behind "ดูทั้งหมด".
  const previewReplies = replyList.slice(-REPLY_PREVIEW);

  const isUnlocked = !pin.is_locked || decrypted !== null;
  const displayText = pin.is_locked ? decrypted ?? "" : pin.text;

  function handleSendReply() {
    const text = replyText.trim();
    if (!text || createReply.isPending) return;
    createReply.mutate(
      { text, reveal_identity: revealReply },
      { onSuccess: () => setReplyText("") },
    );
  }

  function handleDelete() {
    deletePin.mutate(pin.id, { onSuccess: () => onClose?.() });
  }

  function handleUnlock() {
    if (password.length !== 6) return;
    const result = decryptMessage(pin.text, password);
    if (result) {
      setDecrypted(result);
      setError(null);
    } else {
      setError("Wrong password.");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/?pin=${pin.id}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1800);
  }

  return (
    <div className="w-full text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{pinEmoji(pin.mood, pin.emoji)}</span>
        <div className="flex items-center gap-2">
          {pin.is_locked && !isUnlocked && (
            <span className="flex items-center gap-1 text-xs text-fuchsia-600">
              <Lock size={12} /> locked
            </span>
          )}
          {pin.is_locked && isUnlocked && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Unlock size={12} /> unlocked
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-slate-400 transition hover:text-slate-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {pin.author_name && (
        <div className="mb-2 flex items-start gap-2">
          {pin.author_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pin.author_avatar}
              alt=""
              className="mt-0.5 h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-black/10"
            />
          ) : (
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15 text-[10px] font-bold text-fuchsia-700">
              {pin.author_name.trim().charAt(0).toUpperCase() || "?"}
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-slate-700">
              {pin.author_name}
            </div>
            {pin.author_bio && (
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">
                {pin.author_bio}
              </p>
            )}
          </div>
        </div>
      )}

      {pin.is_locked && !isUnlocked ? (
        <div className={shake ? "pimjai-shake" : ""}>
          <p className="mb-2 text-slate-600">
            🔓 Hint: <span className="font-semibold text-slate-800">{pin.hint}</span>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6-char password"
              className="w-full flex-1 rounded-lg border border-slate-300 bg-white/70 px-2 py-1.5 text-slate-800 outline-none focus:border-fuchsia-400"
            />
            <button
              onClick={handleUnlock}
              className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 px-3 py-1.5 font-semibold text-white"
            >
              Crack
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      ) : (
        <p className="pimjai-fade-in leading-snug break-words text-slate-800">{displayText}</p>
      )}

      {pin.created_at && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
          <Clock size={11} /> ส่งเมื่อ {formatSentAt(pin.created_at)}
        </p>
      )}

      {reactable && (
        <div className="mt-3 flex gap-1.5">
          {REACTIONS.map((r) => {
            const active = mine.includes(r.type);
            const count = counts[r.type];
            return (
              <button
                key={r.type}
                onClick={() => toggleReaction.mutate(r.type)}
                disabled={toggleReaction.isPending}
                aria-pressed={active}
                aria-label={r.label}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 transition disabled:opacity-60 ${
                  active
                    ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-1 leading-none">
                  <span className="text-base">{r.emoji}</span>
                  {count > 0 && (
                    <span className="text-xs font-semibold tabular-nums">{count}</span>
                  )}
                </span>
                <span className="text-[10px] leading-none">{r.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {reactable && isUnlocked && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <MessageCircle size={13} />
            คำตอบกลับ
            {replyList.length > 0 && (
              <span className="text-slate-400">({replyList.length})</span>
            )}
          </div>

          {replyList.length > 0 && (
            <div className="mb-2 flex flex-col gap-2">
              {replyList.length > REPLY_PREVIEW && (
                <button
                  onClick={() => setRepliesOpen(true)}
                  className="self-start text-[11px] font-semibold text-fuchsia-600 transition hover:text-fuchsia-700"
                >
                  ดูทั้งหมด {replyList.length} คำตอบ
                </button>
              )}
              {previewReplies.map((r) => (
                <ReplyItem key={r.id} reply={r} onDelete={(id) => deleteReply.mutate(id)} />
              ))}
            </div>
          )}

          {isAuthenticated ? (
            <div>
              <div className="flex items-end gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  maxLength={REPLY_MAX_LEN}
                  rows={2}
                  placeholder="เขียนคำตอบกลับ..."
                  className="w-full flex-1 resize-none rounded-lg border border-slate-300 bg-white/70 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-fuchsia-400"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || createReply.isPending}
                  aria-label="ส่งคำตอบ"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </div>
              <label className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                <input
                  type="checkbox"
                  checked={revealReply}
                  onChange={(e) => setRevealReply(e.target.checked)}
                  className="h-3 w-3 accent-fuchsia-500"
                />
                เปิดเผยชื่อของฉัน (ไม่ติ๊ก = ตอบแบบนิรนาม)
              </label>
              {createReply.isError && (
                <p className="mt-1 text-[11px] text-red-500">ส่งคำตอบไม่สำเร็จ ลองใหม่อีกครั้ง</p>
              )}
            </div>
          ) : (
            <button
              onClick={startLineLogin}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
            >
              เข้าสู่ระบบ LINE เพื่อตอบกลับ
            </button>
          )}
        </div>
      )}

      {isUnlocked && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShareOpen(true)}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-2 py-1.5 text-xs font-bold text-white"
          >
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-600"
          >
            {linkCopied ? <Check size={14} /> : <LinkIcon size={14} />}
          </button>
        </div>
      )}

      {pin.is_locked && !isUnlocked && (
        <div className="mt-3">
          <button
            onClick={() => setShareOpen(true)}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-600"
          >
            <Share2 size={14} /> Tease this secret
          </button>
        </div>
      )}

      {isOwner && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={deletePin.isPending}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-500 px-2 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <Trash2 size={14} /> {deletePin.isPending ? "กำลังลบ..." : "ยืนยันลบ"}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deletePin.isPending}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-50"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
            >
              <Trash2 size={14} /> ลบจดหมายนี้
            </button>
          )}
          {deletePin.isError && (
            <p className="mt-1 text-xs text-red-500">ลบไม่สำเร็จ ลองใหม่อีกครั้ง</p>
          )}
        </div>
      )}

      <RepliesDialog
        open={repliesOpen}
        onClose={() => setRepliesOpen(false)}
        replies={replyList}
        onDelete={(id) => deleteReply.mutate(id)}
      />

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        text={displayText}
        mood={pin.mood}
        initialColor={pinColor(pin.mood, pin.color)}
        locationLabel={locationLabel}
        isLocked={pin.is_locked}
        isDecrypted={isUnlocked}
        hint={pin.hint}
        authorName={pin.author_name}
        authorAvatar={pin.author_avatar}
        counts={counts}
      />
    </div>
  );
}
