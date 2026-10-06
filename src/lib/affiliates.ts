import type { Prisma, PrismaClient } from "@prisma/client";
import { getAppBaseUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export const MAX_AFFILIATE_COMMISSION_BPS = 5_000;
export const AFFILIATE_REF_COOKIE_DAYS = 30;

type Db = PrismaClient | Prisma.TransactionClient;

export function getMinimumWithdrawalKobo() {
  const configured = Number(process.env.AFFILIATE_MIN_WITHDRAWAL_KOBO);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 100_000;
}

export function clampCommissionBps(bps: number) {
  if (!Number.isFinite(bps)) return 0;
  return Math.min(Math.max(Math.round(bps), 0), MAX_AFFILIATE_COMMISSION_BPS);
}

/** An affiliate's own rate, when set, replaces the event rate. */
export function getEffectiveCommissionBps(eventBps: number, overrideBps?: number | null) {
  return clampCommissionBps(overrideBps ?? eventBps);
}

export function formatBps(bps: number) {
  return `${Number((bps / 100).toFixed(2))}%`;
}

export function buildAffiliateLink(eventSlug: string, code: string) {
  return `${getAppBaseUrl()}/events/${eventSlug}?ref=${encodeURIComponent(code)}`;
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "Buyer";
  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

/**
 * Balance is derived, never stored: earned commissions minus every withdrawal that is paid
 * or still in flight. A failed withdrawal drops out of the sum, which returns the money.
 */
export async function getAffiliateBalance(affiliateId: string, db: Db = prisma) {
  const earned = await db.affiliateCommission.aggregate({
    where: { affiliateId, status: "EARNED" },
    _sum: { amountKobo: true, ticketSubtotalKobo: true, ticketCount: true },
  });
  const paid = await db.affiliateWithdrawal.aggregate({
    where: { affiliateId, status: "PAID" },
    _sum: { amountKobo: true },
  });
  const processing = await db.affiliateWithdrawal.aggregate({
    where: { affiliateId, status: "PROCESSING" },
    _sum: { amountKobo: true },
  });

  const earnedKobo = earned._sum.amountKobo ?? 0;
  const paidKobo = paid._sum.amountKobo ?? 0;
  const processingKobo = processing._sum.amountKobo ?? 0;

  return {
    earnedKobo,
    paidKobo,
    processingKobo,
    availableKobo: Math.max(earnedKobo - paidKobo - processingKobo, 0),
    salesKobo: earned._sum.ticketSubtotalKobo ?? 0,
    ticketsSold: earned._sum.ticketCount ?? 0,
  };
}
