// Shared pieces for the link-preview images (Open Graph cards) shown when a page is shared on
// WhatsApp, X, Facebook, Instagram DMs and so on. Rendered with next/og, which only supports
// flexbox layout and inline styles.
import { readFile } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import type { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
// JPEG keeps photo-heavy cards around 100-200 KB. WhatsApp often skips previews for big images.
export const OG_CONTENT_TYPE = "image/jpeg";

export const ogColors = {
  ink: "#050505",
  coal: "#151515",
  paper: "#fffdf8",
  bone: "#f5f0e8",
  gold: "#c8a24a",
  lava: "#f24a2e",
};

let fontData: Promise<Buffer> | null = null;

/** Inter SemiBold (SIL Open Font License), kept in the repo so the cards look the same everywhere. */
export async function getOgFonts() {
  fontData ??= readFile(join(process.cwd(), "src/assets/og/Inter-SemiBold.woff"));
  return [{ name: "Inter", data: await fontData, weight: 600 as const, style: "normal" as const }];
}

const PUBLIC_DIR = join(process.cwd(), "public");
const MIME_BY_EXTENSION: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

/**
 * Turns an image path from the site (e.g. "/paflux/x.jpg") or an uploaded Cloudinary URL into
 * something the card renderer can draw. Returns null when the image can't be used.
 */
export async function getOgImageSrc(src: string | null | undefined): Promise<string | null> {
  if (!src) return null;

  if (/^https?:\/\//i.test(src)) {
    // Ask Cloudinary for a JPEG at a sensible size; the renderer can't draw every format.
    return src.replace(/(res\.cloudinary\.com\/[^/]+\/image\/upload\/)/, "$1f_jpg,w_1000/");
  }

  const path = decodeURIComponent(src.split("?")[0]);
  const mime = MIME_BY_EXTENSION[path.split(".").pop()?.toLowerCase() ?? ""];
  if (!mime) return null;

  const filePath = normalize(join(PUBLIC_DIR, path));
  if (!filePath.startsWith(PUBLIC_DIR + sep)) return null;

  try {
    const file = await readFile(filePath);
    return `data:${mime};base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

/** The ghost logo, used on the default card and as a fallback. */
export function getOgLogo() {
  return getOgImageSrc("/favicon.jpg");
}

export function formatNairaForOg(kobo: number) {
  return `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

/** Re-encodes a rendered card as JPEG with sharp (installed alongside Next.js). Falls back to PNG. */
export async function asJpeg(image: ImageResponse) {
  const png = Buffer.from(await image.arrayBuffer());
  const headers = { "Cache-Control": "public, max-age=600, stale-while-revalidate=3600" };
  try {
    const { default: sharp } = await import("sharp");
    const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: { ...headers, "Content-Type": "image/jpeg" } });
  } catch (error) {
    console.error("Unable to convert share card to JPEG, sending PNG", error);
    return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
  }
}
