// Browser-side helper: uploads a file straight to Cloudinary using a signature from our server.

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export type UploadedMedia = { url: string; type: "image" | "video" };

export async function uploadToCloudinary(file: File, folder: string): Promise<UploadedMedia> {
  const isVideo = file.type.startsWith("video/");
  if (!isVideo && !file.type.startsWith("image/")) throw new Error(`${file.name}: only photos and videos can be uploaded.`);
  if (isVideo && file.size > MAX_VIDEO_BYTES) throw new Error(`${file.name}: videos must be 100MB or smaller.`);
  if (!isVideo && file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name}: photos must be 10MB or smaller.`);

  const signResponse = await fetch("/api/admin/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  const signed = await signResponse.json().catch(() => null);
  if (!signResponse.ok || !signed?.uploadUrl) throw new Error(signed?.message ?? "Could not prepare the upload.");

  async function send(signature?: string) {
    const body = new FormData();
    for (const [key, value] of Object.entries(signed.fields as Record<string, string>)) body.set(key, value);
    if (signature) body.set("signature", signature);
    body.set("file", file);
    const response = await fetch(signed.uploadUrl, { method: "POST", body });
    return { response, payload: await response.json().catch(() => null) };
  }

  let result = await send();
  const firstError: string = result.payload?.error?.message ?? "";
  if (!result.response.ok && signed.fallbackSignature && /invalid signature/i.test(firstError)) {
    result = await send(signed.fallbackSignature);
  }

  if (!result.response.ok || !result.payload?.secure_url) {
    throw new Error(`${file.name}: ${result.payload?.error?.message ?? "upload failed."}`);
  }

  return {
    url: result.payload.secure_url as string,
    type: result.payload.resource_type === "video" ? "video" : "image",
  };
}
