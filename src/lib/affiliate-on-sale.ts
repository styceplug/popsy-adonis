import type { Prisma } from "@prisma/client";

/** Keep a dated event listed until roughly the morning after it starts. */
const SELLING_GRACE_MS = 12 * 60 * 60 * 1000;

/**
 * Events with no confirmed date store a placeholder `startsAt` (year 0) so
 * they can still be sorted. That value is not the night the event happened.
 */
const UNSET_START_BEFORE = new Date("2000-01-01T00:00:00.000Z");

export function affiliateEventsOnSaleWhere(now = new Date()): Prisma.EventWhereInput {
  const stillSellingSince = new Date(now.getTime() - SELLING_GRACE_MS);

  return {
    status: "PUBLISHED",
    ticketTiers: { some: { isActive: true } },
    OR: [
      { endsAt: { gte: now } },
      { endsAt: null, startsAt: { gte: stillSellingSince } },
      { endsAt: null, startsAt: { lt: UNSET_START_BEFORE } },
    ],
  };
}
