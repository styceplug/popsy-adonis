import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const payload = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ message: "Cloudinary is not configured." }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") || "popsy-adonis/events");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Select an image to upload." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "Only image uploads are supported." }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ message: "Image must be 8MB or smaller." }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const paramsToSign = { folder, timestamp };
  const uploadBody = new FormData();

  uploadBody.set("file", file);
  uploadBody.set("api_key", apiKey);
  uploadBody.set("timestamp", timestamp);
  uploadBody.set("folder", folder);
  uploadBody.set("signature", signCloudinaryParams(paramsToSign, apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: uploadBody,
  });
  const payload = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { message: payload.error?.message ?? "Unable to upload image." },
      { status: 502 },
    );
  }

  await createAdminAuditLog({
    actorName: session.name,
    action: "image.uploaded",
    entityType: "CloudinaryAsset",
    entityId: payload.public_id,
    metadata: {
      folder,
      secureUrl: payload.secure_url,
      originalFilename: file.name,
      bytes: file.size,
    },
    request,
  });

  return NextResponse.json({
    publicId: payload.public_id,
    secureUrl: payload.secure_url,
    width: payload.width,
    height: payload.height,
  });
}
