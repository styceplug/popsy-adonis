import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, asJpeg, OG_SIZE, getOgFonts, getOgImageSrc, getOgLogo, ogColors } from "@/lib/og";
import { prisma } from "@/lib/prisma";

export const alt = "PA FLUX store by Popsy Adonis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// Shows what is on sale right now, so read the database on every request.
export const dynamic = "force-dynamic";

export default async function Image() {
  const products = await prisma.product
    .findMany({
      where: { status: "ACTIVE", variants: { some: {} } },
      select: { images: true },
      orderBy: { createdAt: "asc" },
      take: 4,
    })
    .catch(() => []);

  const [fonts, logo, ...photos] = await Promise.all([
    getOgFonts(),
    getOgLogo(),
    ...products.map((product) => getOgImageSrc(product.images[0])),
  ]);
  const tiles = photos.filter((photo): photo is string => Boolean(photo));
  const tileSize = tiles.length > 1 ? 232 : 480;

  return asJpeg(new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 64px 0 80px",
          background: ogColors.bone,
          fontFamily: "Inter",
          color: ogColors.ink,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 520 }}>
          <div style={{ fontSize: 24, color: ogColors.lava, letterSpacing: 4, textTransform: "uppercase" }}>
            Popsy Adonis clothing
          </div>
          <div style={{ fontSize: 132, lineHeight: 0.95, marginTop: 18, letterSpacing: -5 }}>PA FLUX</div>
          <div style={{ fontSize: 40, marginTop: 22, color: ogColors.lava }}>Stay in Flux.</div>
          <div style={{ fontSize: 28, lineHeight: 1.4, marginTop: 24, color: "rgba(5,5,5,0.62)" }}>
            Streetwear from Popsy Adonis. Pick your colour, choose your size.
          </div>
          <div style={{ fontSize: 26, marginTop: 44, color: "rgba(5,5,5,0.5)" }}>popsyadonis.com/paflux</div>
        </div>

        {tiles.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, width: tileSize * 2 + 16, justifyContent: "flex-end" }}>
            {tiles.map((tile, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  width: tileSize,
                  height: tileSize,
                  borderRadius: 20,
                  background: "#ffffff",
                  border: "1px solid rgba(5,5,5,0.08)",
                  overflow: "hidden",
                }}
              >
                <img src={tile} width={tileSize} height={tileSize} alt="" style={{ objectFit: "contain" }} />
              </div>
            ))}
          </div>
        ) : logo ? (
          <img src={logo} width={420} height={420} alt="" style={{ borderRadius: 36 }} />
        ) : null}
      </div>
    ),
    { ...size, fonts },
  ));
}
