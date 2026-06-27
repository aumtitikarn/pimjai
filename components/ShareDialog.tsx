"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import { X, Download, Camera, Share2 } from "lucide-react";
import type { Mood, ReactionType } from "@/schemas/pinSchema";
import { SHARE_FRAMES, DEFAULT_FRAME_ID } from "@/lib/shareFrames";
import ShareCard from "./ShareCard";

// Card design is authored at 360×640 (9:16). Exporting at pixelRatio 3 yields a
// 1080×1920 PNG — the Instagram / TikTok story size.
const CARD_W = 360;
const CARD_H = 640;
const EXPORT_RATIO = 3;
const PREVIEW_SCALE = 0.62;

/** Default card colour seeded from the letter's mood. */
const MOOD_COLOR: Record<Mood, string> = {
  pink: "#ff2d9d",
  black: "#1a1330",
  yellow: "#ffe14d",
};

/** Quick-pick swatches shown beside the colour picker. */
const SWATCHES = [
  "#ff2d9d",
  "#ff7ad9",
  "#7c5cff",
  "#19d3c5",
  "#ffe14d",
  "#1a1330",
  "#0f172a",
  "#ffffff",
];

/** Unique, readable download name e.g. pimjai_20260627_204512.png */
function downloadName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `pimjai_${ts}.png`;
}

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  text: string;
  mood: Mood;
  /** Card colour to start from — the letter's resolved colour. */
  initialColor?: string;
  locationLabel: string;
  isLocked: boolean;
  isDecrypted: boolean;
  hint: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  counts: Record<ReactionType, number>;
}

export default function ShareDialog({
  open,
  onClose,
  text,
  mood,
  initialColor,
  locationLabel,
  isLocked,
  isDecrypted,
  hint,
  authorName,
  authorAvatar,
  counts,
}: ShareDialogProps) {
  const [frameId, setFrameId] = useState(DEFAULT_FRAME_ID);
  const [bgColor, setBgColor] = useState(initialColor ?? MOOD_COLOR[mood]);
  const [showReactions, setShowReactions] = useState(true);
  const [busy, setBusy] = useState<null | "download" | "story">(null);
  const [note, setNote] = useState<string | null>(null);
  // Pre-embedded copies of the logo + avatar. html-to-image can only inline
  // images it can fetch same-origin, so we fetch them up front (the avatar via
  // our proxy) and hand the card data URLs — otherwise they export blank.
  const [logoData, setLogoData] = useState<string | undefined>(undefined);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const toData = (blob: Blob) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    (async () => {
      try {
        const logo = await fetch("/logo.png").then((r) => r.blob()).then(toData);
        if (!cancelled) setLogoData(logo);
      } catch {
        /* keep the /logo.png fallback */
      }
      if (authorAvatar) {
        try {
          const res = await fetch(`/api/avatar?u=${encodeURIComponent(authorAvatar)}`);
          if (!res.ok) throw new Error("proxy failed");
          const data = await toData(await res.blob());
          if (!cancelled) setAvatarData(data);
        } catch {
          /* fall back to initials in the card */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, authorAvatar]);

  if (!open || typeof document === "undefined") return null;

  async function buildImage(): Promise<string | null> {
    const node = cardRef.current;
    if (!node) return null;
    // html-to-image renders blank for images that haven't finished decoding, so
    // wait for every <img> first. A warm-up capture then defeats the known bug
    // where the first call still drops freshly-decoded images.
    await Promise.all(
      Array.from(node.querySelectorAll("img")).map((img) => img.decode().catch(() => {})),
    );
    const opts = { pixelRatio: EXPORT_RATIO, width: CARD_W, height: CARD_H };
    await toPng(node, opts);
    return toPng(node, opts);
  }

  async function handleDownload() {
    setBusy("download");
    setNote(null);
    try {
      const dataUrl = await buildImage();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = downloadName();
      link.href = dataUrl;
      link.click();
      setNote("บันทึกรูปแล้ว 💾");
    } catch {
      setNote("สร้างรูปไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(null);
    }
  }

  async function handleStory() {
    setBusy("story");
    setNote(null);
    try {
      const dataUrl = await buildImage();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], downloadName(), { type: "image/png" });

      // Web Share API → on mobile the share sheet lets the user pick
      // Instagram → Stories. There is no direct browser API to post a story.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "พิมพ์ใจ — Pimjai",
          text: "ฝากข้อความไว้ที่ไหนสักแห่งบนโลก 🌏",
        });
        return;
      }

      // Desktop / unsupported: download and guide the user.
      const link = document.createElement("a");
      link.download = downloadName();
      link.href = dataUrl;
      link.click();
      setNote("บันทึกรูปแล้ว — เปิดอินสตาแกรมแล้วเลือกรูปนี้ลงสตอรี่ได้เลย 📲");
    } catch {
      // user cancelled the share sheet, or it failed — stay silent on cancel
    } finally {
      setBusy(null);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="pimjai-pop max-h-[92vh] w-full max-w-[360px] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">แชร์จดหมายนี้ 💌</h2>
            <p className="text-[10px] text-slate-400">ขนาดสตอรี่ 1080 × 1920</p>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="text-slate-400 transition hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Full-res card rendered at natural size, scaled down only for display */}
        <div
          className="mx-auto overflow-hidden rounded-xl shadow-md"
          style={{ width: CARD_W * PREVIEW_SCALE, height: CARD_H * PREVIEW_SCALE }}
        >
          <div
            style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}
          >
            <ShareCard
              ref={cardRef}
              text={text}
              bgColor={bgColor}
              locationLabel={locationLabel}
              isLocked={isLocked}
              isDecrypted={isDecrypted}
              hint={hint}
              frameId={frameId}
              authorName={authorName}
              authorAvatar={avatarData ?? authorAvatar}
              logoSrc={logoData}
              counts={counts}
              showReactions={showReactions}
            />
          </div>
        </div>

        {/* Free frame picker */}
        <p className="mt-3 mb-1.5 text-center text-[11px] font-semibold text-emerald-600">
          ✨ เลือกกรอบได้ฟรีทุกแบบ
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {SHARE_FRAMES.map((f) => {
            const active = f.id === frameId;
            return (
              <button
                key={f.id}
                onClick={() => setFrameId(f.id)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-0.5 rounded-lg border px-2.5 py-1 transition ${
                  active
                    ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg leading-none">{f.icon}</span>
                <span className="text-[10px] leading-none">{f.name}</span>
              </button>
            );
          })}
        </div>

        {/* Card background colour */}
        <p className="mt-3 mb-1.5 text-center text-[11px] font-semibold text-slate-500">
          🎨 สีพื้นหลังการ์ด
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {SWATCHES.map((c) => {
            const active = c.toLowerCase() === bgColor.toLowerCase();
            return (
              <button
                key={c}
                onClick={() => setBgColor(c)}
                aria-label={`สี ${c}`}
                aria-pressed={active}
                className={`h-7 w-7 rounded-full border transition ${
                  active
                    ? "border-fuchsia-500 ring-2 ring-fuchsia-300"
                    : "border-slate-300 hover:scale-110"
                }`}
                style={{ background: c }}
              />
            );
          })}
          {/* Custom colour picker */}
          <label
            className="flex h-7 cursor-pointer items-center gap-1 rounded-full border border-slate-300 bg-white px-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
            title="เลือกสีเอง"
          >
            <span
              className="h-4 w-4 rounded-full border border-slate-300"
              style={{ background: bgColor }}
            />
            กำหนดเอง
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="absolute h-0 w-0 opacity-0"
            />
          </label>
        </div>

        {/* Toggle: show reaction tallies on the card */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
          <span className="text-xs font-semibold text-slate-600">
            แสดงยอดความรู้สึก 🫶
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={showReactions}
            aria-label="แสดงยอดความรู้สึก"
            onClick={() => setShowReactions((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              showReactions ? "bg-fuchsia-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                showReactions ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleDownload}
            disabled={busy !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Download size={16} />
            {busy === "download" ? "กำลังสร้าง..." : "ดาวน์โหลดรูป"}
          </button>
        </div>

        {/* Generic native share fallback hint */}
        {typeof navigator !== "undefined" && !navigator.share && (
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-slate-400">
            <Share2 size={11} /> บนมือถือจะแชร์ตรงเข้าแอปได้เลย
          </p>
        )}

        {note && (
          <p className="mt-2 text-center text-[11px] font-medium text-fuchsia-600">
            {note}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
