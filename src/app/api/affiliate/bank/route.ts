import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAffiliateFromRequest } from "@/lib/affiliate-auth";
import { createTransferRecipient, listBanks, PaystackApiError, resolveBankAccount } from "@/lib/paystack-transfers";
import { prisma } from "@/lib/prisma";

const bankSchema = z.object({
  bankCode: z.string().trim().min(2).max(12),
  accountNumber: z.string().trim().regex(/^\d{10}$/),
});

/** Verifies the account with Paystack, then saves it as the affiliate's payout account. */
export async function POST(request: NextRequest) {
  const affiliate = await getAffiliateFromRequest(request);
  if (!affiliate) return NextResponse.json({ message: "Log in first." }, { status: 401 });

  const parsed = bankSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a bank and enter a 10-digit account number." }, { status: 400 });
  }

  const pending = await prisma.affiliateWithdrawal.count({
    where: { affiliateId: affiliate.id, status: "PROCESSING" },
  });
  if (pending > 0) {
    return NextResponse.json({ message: "Wait for your current withdrawal to finish before changing bank details." }, { status: 409 });
  }

  try {
    const { bankCode, accountNumber } = parsed.data;
    const bank = (await listBanks()).find((item) => item.code === bankCode);
    if (!bank) return NextResponse.json({ message: "That bank is not supported." }, { status: 400 });

    const account = await resolveBankAccount(accountNumber, bankCode);
    const recipient = await createTransferRecipient({ name: account.account_name, accountNumber, bankCode });

    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        bankCode,
        bankName: bank.name,
        accountNumber,
        accountName: account.account_name,
        paystackRecipientCode: recipient.recipient_code,
      },
    });

    return NextResponse.json({ bankName: bank.name, accountNumber, accountName: account.account_name });
  } catch (error) {
    console.error("Unable to save affiliate bank details", error);
    const message =
      error instanceof PaystackApiError
        ? "We could not verify that account. Check the bank and account number."
        : "Unable to verify the account right now. Try again.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
