// Shared by the admin form (client) and server pages, so no server-only imports here.
export const merchStatusOptions = [
  { value: "CONFIRMED", label: "Order confirmed", hint: "Payment received. We have your order." },
  { value: "PROCESSING", label: "Being prepared", hint: "Your items are being packed." },
  { value: "READY", label: "Ready for pickup", hint: "Your order is ready to collect." },
  { value: "SHIPPED", label: "On its way", hint: "Your order has left us and is on its way to you." },
  { value: "DELIVERED", label: "Delivered", hint: "Your order has been delivered or collected." },
  { value: "CANCELLED", label: "Cancelled", hint: "This order was cancelled. Contact us if you have questions." },
] as const;

export type MerchStatusValue = (typeof merchStatusOptions)[number]["value"];

export function getMerchStatusOption(status: string | null | undefined) {
  return merchStatusOptions.find((option) => option.value === status) ?? merchStatusOptions[0];
}
