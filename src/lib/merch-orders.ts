import { getAppBaseUrl } from "@/lib/app-url";

export { getMerchStatusOption, merchStatusOptions } from "@/lib/merch-status";

/** Public page where a buyer follows their order. The payment reference is the access key. */
export function getOrderStatusUrl(reference: string) {
  return `${getAppBaseUrl()}/orders/${encodeURIComponent(reference)}`;
}

export function getMerchNotifyEmail() {
  return process.env.MERCH_NOTIFY_EMAIL?.trim() || "popsyadonis@gmail.com";
}
