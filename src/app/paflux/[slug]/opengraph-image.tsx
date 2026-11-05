import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, asJpeg, OG_SIZE, formatNairaForOg, getOgFonts, getOgImageSrc, getOgLogo, ogColors } from "@/lib/og";
import { getAvailableSizes, getPriceRange, getStockState, splitProductName } from "@/lib/product-display";
import { prisma } from "@/lib/prisma";
import { toStoreProduct } from "@/lib/store-products";

export const alt = "PA FLUX product";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// Price and stock change from admin, so read the database on every request.
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await prisma.product
    .findUnique({ where: { slug }, include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } } })
    .catch(() => null);
  const product = record && record.status === "ACTIVE" && record.variants.length > 0 ? toStoreProduct(record) : null;

  const [fonts, photo, logo] = await Promise.all([getOgFonts(), getOgImageSrc(product?.images[0]), getOgLogo()]);
  const picture = photo ?? logo;

  const { family, variant } = splitProductName(product?.name ?? "PA FLUX");
  const price = product ? getPriceRange(product) : null;
  const soldOut = product ? getStockState(product) === "sold-out" : false;
  const sizes = product ? getAvailableSizes(product) : [];

  return asJpeg(new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: "Inter", background: ogColors.ink }}>
        <div style={{ display: "flex", width: 630, height: 630, background: "#ffffff" }}>
          {picture ? (
            <img src={picture} width={630} height={630} alt="" style={{ objectFit: "contain" }} />
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "0 56px",
            color: ogColors.paper,
          }}
        >
          <div style={{ fontSize: 24, color: ogColors.gold, letterSpacing: 4, textTransform: "uppercase" }}>PA FLUX</div>
          <div style={{ fontSize: 60, lineHeight: 1.02, marginTop: 18, letterSpacing: -2 }}>{family}</div>
          {variant ? <div style={{ fontSize: 34, marginTop: 14, color: "rgba(255,253,248,0.7)" }}>{variant}</div> : null}
          {price ? (
            <div style={{ fontSize: 48, marginTop: 36, color: ogColors.gold }}>
              {`${price.varies ? "From " : ""}${formatNairaForOg(price.fromKobo)}`}
            </div>
          ) : null}
          <div style={{ fontSize: 26, marginTop: 14, color: "rgba(255,253,248,0.55)" }}>
            {soldOut ? "Sold out" : sizes.length > 0 ? `Sizes ${sizes.join(" · ")}` : ""}
          </div>
          <div style={{ fontSize: 24, marginTop: 48, color: "rgba(255,253,248,0.45)" }}>popsyadonis.com/paflux</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  ));
}
