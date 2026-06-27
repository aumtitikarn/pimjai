import { ImageResponse } from "next/og";

export const alt = "พิมพ์ใจ (Pimjai) — ฝากข้อความถึงใครก็ได้บนแผนที่โลก";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(circle at 75% 25%, #1e3a5f 0%, #0b1220 55%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: 34,
            color: "#7dd3fc",
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 9999,
              background: "#38bdf8",
              display: "flex",
            }}
          />
          พิมพ์ใจ · Pimjai
        </div>
        <div
          style={{
            marginTop: 36,
            display: "flex",
            flexDirection: "column",
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.25,
            maxWidth: 980,
          }}
        >
          <span>ฝากข้อความถึงใครก็ได้</span>
          <span>บนแผนที่โลก</span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            color: "#94a3b8",
            lineHeight: 1.4,
            maxWidth: 980,
          }}
        >
          ปักหมุดข้อความและความลับที่ล็อกด้วยรหัสผ่าน ไว้ที่ไหนก็ได้บนโลก
          แบบไม่ระบุตัวตน
        </div>
      </div>
    ),
    { ...size },
  );
}
