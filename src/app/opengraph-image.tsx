import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, asJpeg, OG_SIZE, getOgFonts, getOgLogo, ogColors } from "@/lib/og";

export const alt = "Popsy Adonis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Default share card for any page without its own.
export default async function Image() {
  const [fonts, logo] = await Promise.all([getOgFonts(), getOgLogo()]);

  return asJpeg(new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 80px",
          background: ogColors.ink,
          fontFamily: "Inter",
          color: ogColors.paper,
        }}
      >
        {logo ? (
          <img src={logo} width={360} height={360} alt="" style={{ borderRadius: 36, objectFit: "cover" }} />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 21, color: ogColors.gold, letterSpacing: 3, textTransform: "uppercase" }}>
            Entertainment · Events · PA FLUX
          </div>
          <div style={{ fontSize: 84, lineHeight: 1, marginTop: 24, letterSpacing: -3 }}>Popsy Adonis</div>
          <div style={{ fontSize: 32, lineHeight: 1.35, marginTop: 28, color: "rgba(255,253,248,0.68)" }}>
            Your best assured cure to boredom.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 56 }}>
            <div style={{ width: 56, height: 6, borderRadius: 3, background: ogColors.gold }} />
            <div style={{ fontSize: 28, color: ogColors.gold }}>popsyadonis.com</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  ));
}
