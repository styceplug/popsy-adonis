export function normalizeVendorSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Turns a Nigerian number like 0803 123 4567 into a wa.me link (234...). */
export function whatsappHref(number: string) {
  let digits = number.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

export function telHref(number: string) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

export function instagramHref(handleOrUrl: string) {
  const value = handleOrUrl.trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `https://instagram.com/${value.replace(/^@/, "")}`;
}

export function instagramLabel(handleOrUrl: string) {
  const value = handleOrUrl.trim();
  const fromUrl = value.match(/instagram\.com\/([^/?#]+)/i)?.[1];
  return `@${(fromUrl ?? value).replace(/^@/, "")}`;
}

export function websiteHref(url: string) {
  const value = url.trim();
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/** Cloudinary video URLs can show a still frame by swapping the extension to .jpg. */
export function videoPosterUrl(url: string) {
  if (!url.includes("/video/upload/")) return undefined;
  return url.replace(/\.[a-z0-9]+(\?.*)?$/i, ".jpg");
}
