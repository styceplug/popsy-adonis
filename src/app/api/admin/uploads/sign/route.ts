import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function sign(params: Record<string, string>, secret: string, algorithm: "sha1" | "sha256") {
  const payload = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash(algorithm).update(`${payload}${secret}`).digest("hex");
}

/**
 * Lets the admin browser upload photos and videos straight to Cloudinary. Large videos never pass
 * through this server (or nginx's body-size limit); the server only signs the request.
 */
export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "Admin session required." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const folder = String(body?.folder || "popsy-adonis/uploads")
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/^\/+|\/+$/g, "");

  const cloudName = readEnv("CLOUDINARY_CLOUD_NAME") ?? readEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const apiKey = readEnv("CLOUDINARY_API_KEY");
  const apiSecret = readEnv("CLOUDINARY_API_SECRET");
  const uploadPreset = readEnv("CLOUDINARY_UPLOAD_PRESET");

  if (!cloudName || (!uploadPreset && (!apiKey || !apiSecret))) {
    return NextResponse.json({ message: "Cloudinary is not configured on the server." }, { status: 500 });
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  if (uploadPreset) {
    return NextResponse.json({ uploadUrl, fields: { upload_preset: uploadPreset, folder } });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { folder, timestamp };

  return NextResponse.json({
    uploadUrl,
    fields: { api_key: apiKey, folder, timestamp, signature: sign(params, apiSecret!, "sha1") },
    // Some Cloudinary accounts are set to SHA-256 signatures; the browser retries with this one.
    fallbackSignature: sign(params, apiSecret!, "sha256"),
  });
}
