import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "พิมพ์ใจ (Pimjai) — ฝากข้อความถึงใครก็ได้บนแผนที่โลก",
    short_name: "พิมพ์ใจ",
    description:
      "ฝากข้อความและความลับที่ล็อกด้วยรหัสผ่านไว้บนแผนที่โลกแบบไม่ระบุตัวตน",
    lang: "th-TH",
    dir: "ltr",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    orientation: "any",
    categories: ["social", "maps", "navigation"],
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
