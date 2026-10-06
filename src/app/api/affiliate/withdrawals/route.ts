import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAffiliateFromRequest } from "@/lib/affiliate-auth";
import { applyTransferStatus } from "@/lib/affiliate-payouts";
import { getAffiliateBalance, getMinimumWithdrawalKobo } from "@/lib/affiliates";
import { formatNaira } from "@/lib/format-money";
import { initiateTransfer, PaystackApiError } from "@/lib/paystack-transfers";
import { prisma } from "@/lib/prisma";

const withdrawalSchema = z.object({
  amountKobo: z.number().int().positive(),
});

class WithdrawalRejected extends Error {}

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
  const { bankName, accountNumber, accountName, paystackRecipientCode } = affiliate;

  try {
    await prisma.$transaction(async (tx) => {
      // Touching the affiliate row locks it, so two requests cannot both pass the balance check.
      await tx.affiliate.update({ where: { id: affiliate.id }, data: { updatedAt: new Date() } });

      const inFlight = await tx.affiliateWithdrawal.count({
        where: { affiliateId: affiliate.id, status: "PROCESSING" },
      });
      if (inFlight > 0) throw new WithdrawalRejected("You already have a withdrawal in progress.");

      const balance = await getAffiliateBalance(affiliate.id, tx);
      if (amountKobo > balance.availableKobo) {
        throw new WithdrawalRejected(`You can withdraw up to ${formatNaira(balance.availableKobo)}.`);
      }

      await tx.affiliateWithdrawal.create({
        data: { affiliateId: affiliate.id, amountKobo, reference, bankName, accountNumber, accountName },
      });
    });
  } catch (error) {
    if (error instanceof WithdrawalRejected) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unable to create affiliate withdrawal", error);
    return NextResponse.json({ message: "Unable to start the withdrawal. Try again." }, { status: 500 });
  }

  try {
    const transfer = await initiateTransfer({
      amountKobo,
      recipientCode: paystackRecipientCode,
      reference,
      reason: "Popsy Adonis affiliate payout",
    });
    const withdrawal = await applyTransferStatus(reference, transfer);

    if (withdrawal?.status === "FAILED") {
      return NextResponse.json(
        { message: "The payout could not be sent right now. Your balance is unchanged." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      status: withdrawal?.status ?? "PROCESSING",
      message:
        withdrawal?.status === "PAID"
          ? `${formatNaira(amountKobo)} sent to your bank account.`
          : `${formatNaira(amountKobo)} is on its way to your bank account.`,
    });
  } catch (error) {
    console.error("Affiliate transfer failed", error);

    if (error instanceof PaystackApiError) {
      await prisma.affiliateWithdrawal.update({
        where: { reference },
        data: { status: "FAILED", failureReason: error.message },
      });
      return NextResponse.json(
        { message: "The payout could not be sent right now. Your balance is unchanged." },
        { status: 502 },
      );
    }

    // No clear answer from Paystack. The transfer may exist, so the amount stays reserved
    // until the webhook or an admin recheck settles it.
    return NextResponse.json({
      status: "PROCESSING",
      message: "Your withdrawal is being processed. Check back shortly.",
    });
  }
}
