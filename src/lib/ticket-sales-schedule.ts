/**
 * Tiers that go on sale at a set time instead of straight away, keyed by ticket tier id.
 * Before that time the tier is listed with its opening time and checkout refuses it.
 */
const TICKET_SALES_OPEN_AT: Record<string, string> = {
  // FLUX Experience Movie Night - December Edition: Early Bird drops Sat 14th Nov 2026, 6PM Lagos.
  "tier-flux-movie-night-dec-2026-early-bird": "2026-11-14T17:00:00.000Z",
};

/** When the tier goes on sale, or null if it is already on sale (or has no set time). */
export function getTierSalesOpensAt(tierId: string, now = new Date()): Date | null {
  const opensAt = TICKET_SALES_OPEN_AT[tierId];
  if (!opensAt) return null;

  const date = new Date(opensAt);
  return date.getTime() > now.getTime() ? date : null;
}

/** "Sat 14 Nov, 6:00 pm" in Lagos time. */
export function formatSalesOpensAt(date: Date | string) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}
