import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAffiliateFromRequest } from "@/lib/affiliate-auth";
import { attemptPayout } from "@/lib/affiliate-payouts";
import { getAffiliateBalance, getMinimumWithdrawalKobo } from "@/lib/affiliates";
import { formatNaira } from "@/lib/format-money";
import { prisma } from "@/lib/prisma";

const withdrawalSchema = z.object({
  amountKobo: z.number().int().positive(),
});

class WithdrawalRejected extends Error {}

/**
 * An affiliate asks to be paid. The amount is reserved straight away as a QUEUED request,
 * then paid from the Paystack balance if it can cover it. Otherwise it waits for an admin.
 */
export async function POST(request: NextRequest) {
  const affiliate = await getAffiliateFromRequest(request);
  if (!affiliate) return NextResponse.json({ message: "Log in first." }, { status: 401 });

  const parsed = withdrawalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Enter an amount to withdraw." }, { status: 400 });

  const { amountKobo } = parsed.data;
  const minimumKobo = getMinimumWithdrawalKobo();

  if (affiliate.status !== "APPROVED") {
    return NextResponse.json({ message: "Your affiliate account is not active." }, { status: 403 });
  }

  if (!affiliate.paystackRecipientCode || !affiliate.bankName || !affiliate.accountNumber || !affiliate.accountName) {
    return NextResponse.json({ message: "Add your bank details before withdrawing." }, { status: 400 });
  }

  if (amountKobo < minimumKobo) {
    return NextResponse.json({ message: `The minimum withdrawal is ${formatNaira(minimumKobo)}.` }, { status: 400 });
  }

  const reference = `adonis_wd_${crypto.randomBytes(12).toString("hex")}`;
  const { bankName, accountNumber, accountName } = affiliate;
  let withdrawalId: string;

  try {
    withdrawalId = await prisma.$transaction(async (tx) => {
      // Touching the affiliate row locks it, so two requests cannot both pass the balance check.
      await tx.affiliate.update({ where: { id: affiliate.id }, data: { updatedAt: new Date() } });

      const open = await tx.affiliateWithdrawal.count({
        where: { affiliateId: affiliate.id, status: { in: ["QUEUED", "PROCESSING"] } },
      });
      if (open > 0) throw new WithdrawalRejected("You already have a payout request open.");

      const balance = await getAffiliateBalance(affiliate.id, tx);
      if (amountKobo > balance.availableKobo) {
        throw new WithdrawalRejected(`You can withdraw up to ${formatNaira(balance.availableKobo)}.`);
      }

      const created = await tx.affiliateWithdrawal.create({
        data: { affiliateId: affiliate.id, amountKobo, reference, bankName, accountNumber, accountName, status: "QUEUED" },
      });
      return created.id;
    });
  } catch (error) {
    if (error instanceof WithdrawalRejected) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unable to create affiliate withdrawal", error);
    return NextResponse.json({ message: "Unable to submit the request. Try again." }, { status: 500 });
  }

  const result = await attemptPayout(withdrawalId);

  if (result.status === "PAID" || result.status === "PROCESSING") {
    return NextResponse.json({
      status: result.status,
      message: `${formatNaira(amountKobo)} is on its way to your bank account.`,
    });
  }

  return NextResponse.json({
    status: "QUEUED",
    message: `Request received. ${formatNaira(amountKobo)} will be paid to your bank account shortly.`,
  });
}
