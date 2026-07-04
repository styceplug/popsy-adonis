import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

export const runtime = "nodejs";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

type CloudinarySignatureAlgorithm = "sha1" | "sha256";

function signCloudinaryParams(
  params: Record<string, string>,
  apiSecret: string,
  algorithm: CloudinarySignatureAlgorithm,
) {
  const payload = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash(algorithm).update(`${payload}${apiSecret}`).digest("hex");
}

async function uploadToCloudinary(input: {
  cloudName: string;
  file: File;
  folder: string;
  uploadPreset?: string;
  apiKey?: string;
  apiSecret?: string;
  algorithm?: CloudinarySignatureAlgorithm;
}) {
  const uploadBody = new FormData();

  uploadBody.set("file", input.file);
  uploadBody.set("folder", input.folder);

  if (input.uploadPreset) {
    uploadBody.set("upload_preset", input.uploadPreset);
  } else {
    if (!input.apiKey || !input.apiSecret || !input.algorithm) {
      throw new Error("Cloudinary signed uploads are not configured.");
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const paramsToSign = { folder: input.folder, timestamp };

    uploadBody.set("api_key", input.apiKey);
    uploadBody.set("timestamp", timestamp);
    uploadBody.set("signature", signCloudinaryParams(paramsToSign, input.apiSecret, input.algorithm));
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${input.cloudName}/image/upload`, {
    method: "POST",
    body: uploadBody,
  });

  return {
    response,
    payload: await response.json(),
  };
}

function isInvalidSignature(message: string) {
  return message.toLowerCase().includes("invalid signature");
}

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const cloudName = readEnv("CLOUDINARY_CLOUD_NAME") ?? readEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const apiKey = readEnv("CLOUDINARY_API_KEY");
  const apiSecret = readEnv("CLOUDINARY_API_SECRET");
  const uploadPreset = readEnv("CLOUDINARY_UPLOAD_PRESET");

  if (!cloudName || (!uploadPreset && (!apiKey || !apiSecret))) {
    return NextResponse.json({ message: "Cloudinary is not configured." }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") || "popsy-adonis/events")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Select an image to upload." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "Only image uploads are supported." }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ message: "Image must be 8MB or smaller." }, { status: 400 });
  }

  let upload = await uploadToCloudinary({
    cloudName,
    file,
    folder,
    uploadPreset,
    apiKey,
    apiSecret,
    algorithm: "sha1",
  });

  if (!upload.response.ok && !uploadPreset && isInvalidSignature(upload.payload.error?.message ?? "")) {
    upload = await uploadToCloudinary({
      cloudName,
      file,
      folder,
      apiKey,
      apiSecret,
      algorithm: "sha256",
    });
  }

  if (!upload.response.ok) {
    const cloudinaryMessage = upload.payload.error?.message ?? "Unable to upload image.";
    const message = isInvalidSignature(cloudinaryMessage)
      ? "Cloudinary rejected the upload signature. Confirm the cloud name, API key, and API secret are from the same Cloudinary account, then restart the server."
      : cloudinaryMessage;

    return NextResponse.json(
      { message },
      { status: 502 },
    );
  }

  await createAdminAuditLog({
    actorName: session.name,
    action: "image.uploaded",
    entityType: "CloudinaryAsset",
    entityId: upload.payload.public_id,
    metadata: {
      folder,
      secureUrl: upload.payload.secure_url,
      originalFilename: file.name,
      bytes: file.size,
    },
    request,
  });

  return NextResponse.json({
    publicId: upload.payload.public_id,
    secureUrl: upload.payload.secure_url,
    width: upload.payload.width,
    height: upload.payload.height,
  });
}
