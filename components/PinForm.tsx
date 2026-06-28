"use client";

import { useState } from "react";
import { X, Lock, EyeOff, Timer } from "lucide-react";
import { pinFormSchema, type Mood, MOOD_DEFAULTS } from "@/schemas/pinSchema";
import { encryptMessage } from "@/utils/crypto";
import { useCreatePin } from "@/hooks/usePins";
import { useAuth } from "@/hooks/useAuth";
import PostConfirmDialog from "./PostConfirmDialog";

/** Quick-pick emojis for the letter pin. The author can also type their own. */
const EMOJI_CHOICES = [
  "💗", "🖤", "💛", "😀", "😭", "🥹", "😡", "🤣",
  "🌸", "⭐", "🔥", "🌈", "🍀", "☕", "🎵", "💀",
];

/** Quick-pick background colours; a custom picker sits alongside. */
const COLOR_CHOICES = [
  "#ff2d9d", "#ff7ad9", "#7c5cff", "#19d3c5",
  "#ffe14d", "#ff8a3d", "#1b1b24", "#0f172a",
];

interface PinFormProps {
  position: { lat: number; lng: number };
  onClose: () => void;
  onSubmitted: () => void;
}

export default function PinForm({ position, onClose, onSubmitted }: PinFormProps) {
  const [text, setText] = useState("");
  // Mood categories were removed from the UI; every letter is stored under a
  // single default mood. The author picks the emoji + colour directly below.
  const mood: Mood = "pink";
  const [emoji, setEmoji] = useState(MOOD_DEFAULTS.pink.emoji);
  const [color, setColor] = useState(MOOD_DEFAULTS.pink.color);
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [hint, setHint] = useState("");
  // Author choices, only meaningful (and shown) for signed-in users — anonymous
  // guests are always anonymous + 24h. Identity defaults ON (show name + avatar);
  // lifetime defaults to permanent.
  const [revealIdentity, setRevealIdentity] = useState(true);
  const [ephemeral, setEphemeral] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const createPin = useCreatePin();
  const { isAuthenticated } = useAuth();

  // Validate first; the irreversible write only happens after the user confirms
  // in the dialog (see handleConfirmedPost).
  function handleSubmit() {
    const parsed = pinFormSchema.safeParse({
      text,
      mood,
      emoji,
      color,
      lat: position.lat,
      lng: position.lng,
      isLocked,
      password: isLocked ? password : undefined,
      hint: isLocked ? hint : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setConfirming(true);
  }

  function handleConfirmedPost() {
    const payloadText = isLocked ? encryptMessage(text.trim(), password) : text.trim();

    createPin.mutate(
      {
        text: payloadText,
        lat: position.lat,
        lng: position.lng,
        mood,
        // Only persist a custom value when it differs from the category default,
        // otherwise leave null so the mood default applies (and stays in sync if
        // we ever retune the presets).
        emoji: emoji && emoji !== MOOD_DEFAULTS[mood].emoji ? emoji : null,
        color: color && color !== MOOD_DEFAULTS[mood].color ? color : null,
        is_locked: isLocked,
        hint: isLocked ? hint.trim() : null,
        // The server ignores these for anonymous guests, but keep them honest here.
        reveal_identity: isAuthenticated && revealIdentity,
        ephemeral: isAuthenticated ? ephemeral : true,
      },
      {
        onSuccess: onSubmitted,
        onError: () => setConfirming(false),
      },
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center">
      <div className="pimjai-card pimjai-fade-in max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">จดหมายของคุณ ✨</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 150))}
          maxLength={150}
          rows={3}
          placeholder="ตรงจุดนี้คุณกำลังคิดอะไรอยู่?"
          className="w-full resize-none rounded-xl border border-slate-300 bg-white/70 p-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-fuchsia-400"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>{errors.text && <span className="text-red-500">{errors.text}</span>}</span>
          <span>{text.length}/150</span>
        </div>

        {/* Custom emoji — preset grid + free input */}
        <p className="mt-4 mb-1.5 text-xs font-semibold text-slate-500">
          เลือกอีโมจิ <span className="font-normal text-slate-400">(หมุดบนแผนที่)</span>
        </p>
        {/* Single scrollable row of preset emojis */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              aria-pressed={emoji === e}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xl transition ${
                emoji === e
                  ? "border-fuchsia-400 bg-fuchsia-50 ring-2 ring-fuchsia-200"
                  : "border-slate-200 bg-white/60 hover:bg-slate-50"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        {/* Or type your own */}
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value.slice(0, 8))}
          aria-label="พิมพ์อีโมจิเอง"
          placeholder="หรือพิมพ์อีโมจิเอง"
          className="mt-1.5 h-9 w-full rounded-lg border border-slate-300 bg-white/70 px-3 text-base outline-none placeholder:text-sm placeholder:text-slate-400 focus:border-fuchsia-400"
        />

        {/* Custom colour — preset swatches + native picker */}
        <p className="mt-4 mb-1.5 text-xs font-semibold text-slate-500">
          เลือกสีการ์ด <span className="font-normal text-slate-400">(พื้นหลัง + หมุด)</span>
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {COLOR_CHOICES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`สี ${c}`}
              aria-pressed={color.toLowerCase() === c.toLowerCase()}
              className={`h-8 w-8 rounded-full border transition ${
                color.toLowerCase() === c.toLowerCase()
                  ? "border-fuchsia-500 ring-2 ring-fuchsia-300"
                  : "border-slate-300 hover:scale-110"
              }`}
              style={{ background: c }}
            />
          ))}
          <label
            className="flex h-8 cursor-pointer items-center gap-1 rounded-full border border-slate-300 bg-white px-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
            title="เลือกสีเอง"
          >
            <span
              className="h-4 w-4 rounded-full border border-slate-300"
              style={{ background: color }}
            />
            กำหนดเอง
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-0 w-0 opacity-0"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white/60 px-3 py-2">
          <span className="flex items-center gap-2 text-sm text-slate-700">
            <Lock size={14} /> ล็อกข้อความด้วยรหัสผ่าน
          </span>
          <button
            onClick={() => setIsLocked((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition ${
              isLocked ? "bg-fuchsia-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                isLocked ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {isLocked && (
          <div className="pimjai-fade-in mt-3 space-y-2">
            <input
              type="text"
              maxLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน 6 ตัวอักษร"
              className="w-full rounded-xl border border-slate-300 bg-white/70 p-2.5 text-slate-800 placeholder:text-slate-400 outline-none focus:border-fuchsia-400"
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

            <input
              type="text"
              maxLength={80}
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="คำใบ้ (เช่น 'วันครบรอบของเรา')"
              className="w-full rounded-xl border border-slate-300 bg-white/70 p-2.5 text-slate-800 placeholder:text-slate-400 outline-none focus:border-fuchsia-400"
            />
            {errors.hint && <p className="text-xs text-red-500">{errors.hint}</p>}
          </div>
        )}

        {isAuthenticated ? (
          <div className="mt-4 space-y-2">
            {/* Switch labelled "ไม่ระบุตัวตน": ON = anonymous, OFF = reveal name +
                avatar. Default is reveal, so the switch starts OFF. */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/60 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <EyeOff size={14} /> ไม่ระบุตัวตน
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={!revealIdentity}
                aria-label="ไม่ระบุตัวตน"
                onClick={() => setRevealIdentity((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition ${
                  !revealIdentity ? "bg-fuchsia-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    !revealIdentity ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/60 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <Timer size={14} /> ให้จดหมายหายไปใน 24 ชั่วโมง
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={ephemeral}
                aria-label="ให้จดหมายหายไปใน 24 ชั่วโมง"
                onClick={() => setEphemeral((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition ${
                  ephemeral ? "bg-fuchsia-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    ephemeral ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/40 px-3 py-2 text-xs text-slate-500">
            <Timer size={14} /> จดหมายแบบไม่ระบุตัวตน จะหายไปใน 24 ชั่วโมง
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={createPin.isPending}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-purple-600 py-3 font-bold text-white shadow-lg shadow-fuchsia-500/30 disabled:opacity-50"
        >
          {createPin.isPending ? "กำลังปัก..." : "ปักหมุดตรงนี้ 📍"}
        </button>
        {createPin.isError && (
          <p className="mt-2 text-center text-xs text-red-500">เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</p>
        )}
      </div>
      </div>

      {confirming && (
        <PostConfirmDialog
          isLocked={isLocked}
          revealIdentity={revealIdentity}
          ephemeral={ephemeral}
          isPending={createPin.isPending}
          onConfirm={handleConfirmedPost}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
