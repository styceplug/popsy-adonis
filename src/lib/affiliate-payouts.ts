import { getTransferBalanceKobo, initiateTransfer, PaystackApiError } from "@/lib/paystack-transfers";
import { prisma } from "@/lib/prisma";

const failedStatuses = new Set(["failed", "reversed", "abandoned", "blocked", "rejected"]);

/**
 * Maps a Paystack transfer status onto a withdrawal. A failed or reversed transfer puts the
 * request back in the queue (still reserved) rather than dropping it; only an admin cancels.
 * Used by the withdraw request, the
 * webhook, and the admin recheck, so all three agree on what each status means.
 */
export async function applyTransferStatus(
  reference: string,
  transfer: { status: string; transfer_code?: string; gateway_response?: string; reason?: string },
) {
  const withdrawal = await prisma.affiliateWithdrawal.findUnique({ where: { reference } });
  if (!withdrawal) return null;

  if (transfer.status === "success") {
    // Money left the account, so this wins even over an earlier FAILED mark.
    return prisma.affiliateWithdrawal.update({
      where: { reference },
      data: {
        status: "PAID",
        paidAt: withdrawal.paidAt ?? new Date(),
        failureReason: null,
        transferCode: transfer.transfer_code ?? withdrawal.transferCode,
      },
    });
  }

  if (withdrawal.status === "PAID" && transfer.status !== "reversed") return withdrawal;

  if (transfer.status === "otp") {
    return prisma.affiliateWithdrawal.update({
      where: { reference },
      data: {
        status: "QUEUED",
        transferCode: transfer.transfer_code ?? withdrawal.transferCode,
        failureReason: "Paystack asked for a transfer OTP. Disable transfer OTP in the Paystack dashboard.",
      },
    });
  }

  if (failedStatuses.has(transfer.status)) {
    return prisma.affiliateWithdrawal.update({
      where: { reference },
      data: {
        status: "QUEUED",
        transferCode: transfer.transfer_code ?? withdrawal.transferCode,
        failureReason: transfer.gateway_response ?? transfer.reason ?? `Transfer ${transfer.status}.`,
      },
    });
  }

  // pending, processing, received, queued: still in flight.
  return prisma.affiliateWithdrawal.update({
    where: { reference },
    data: { transferCode: transfer.transfer_code ?? withdrawal.transferCode },
  });
}

export async function handleTransferWebhook(event: { event: string; data?: Record<string, unknown> }) {
  const reference = typeof event.data?.reference === "string" ? event.data.reference : null;
  if (!reference) return null;

  const status = event.event === "transfer.success" ? "success" : event.event === "transfer.reversed" ? "reversed" : "failed";

  return applyTransferStatus(reference, {
    status,
    transfer_code: typeof event.data?.transfer_code === "string" ? event.data.transfer_code : undefined,
    gateway_response: typeof event.data?.gateway_response === "string" ? event.data.gateway_response : undefined,
    reason: typeof event.data?.reason === "string" ? event.data.reason : undefined,
  });
}

/**
 * Tries to pay a QUEUED withdrawal from the Paystack balance. If the balance is short or
 * Paystack refuses, the request stays QUEUED (still reserved) for an admin to retry, top up,
 * or settle by hand. Only one caller can move a request out of QUEUED, so it is never paid twice.
 */
export async function attemptPayout(withdrawalId: string) {
  const withdrawal = await prisma.affiliateWithdrawal.findUnique({
    where: { id: withdrawalId },
    include: { affiliate: { select: { paystackRecipientCode: true } } },
  });

  if (!withdrawal || withdrawal.status !== "QUEUED") {
    return { status: withdrawal?.status ?? null, sent: false, reason: "This payout is not waiting to be paid." };
  }

  const recipientCode = withdrawal.affiliate.paystackRecipientCode;
  if (!recipientCode) {
    await prisma.affiliateWithdrawal.update({
      where: { id: withdrawal.id },
      data: { failureReason: "Affiliate has no verified bank account." },
    });
    return { status: "QUEUED" as const, sent: false, reason: "Affiliate has no verified bank account." };
  }

  try {
    const balanceKobo = await getTransferBalanceKobo();
    if (balanceKobo < withdrawal.amountKobo) {
      const reason = `Paystack balance too low (has ${balanceKobo / 100} NGN).`;
      await prisma.affiliateWithdrawal.update({ where: { id: withdrawal.id }, data: { failureReason: reason } });
      return { status: "QUEUED" as const, sent: false, reason };
    }
  } catch (error) {
    // Could not read the balance; let the transfer itself decide.
    console.error("Unable to read Paystack balance", error);
  }

  const claimed = await prisma.affiliateWithdrawal.updateMany({
    where: { id: withdrawal.id, status: "QUEUED" },
    data: { status: "PROCESSING", failureReason: null },
  });
  if (claimed.count === 0) {
    return { status: null, sent: false, reason: "This payout is already being handled." };
  }

  try {
    const transfer = await initiateTransfer({
      amountKobo: withdrawal.amountKobo,
      recipientCode,
      reference: withdrawal.reference,
      reason: "Popsy Adonis affiliate payout",
    });

    if (transfer.status === "otp" || failedStatuses.has(transfer.status)) {
      const reason =
        transfer.status === "otp"
          ? "Paystack asked for a transfer OTP. Disable transfer OTP in the Paystack dashboard."
          : (transfer.gateway_response ?? transfer.reason ?? `Transfer ${transfer.status}.`);
      await prisma.affiliateWithdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "QUEUED", failureReason: reason, transferCode: transfer.transfer_code ?? null },
      });
      return { status: "QUEUED" as const, sent: false, reason };
    }

    const updated = await applyTransferStatus(withdrawal.reference, transfer);
    return { status: updated?.status ?? "PROCESSING", sent: true, reason: null };
  } catch (error) {
    if (error instanceof PaystackApiError) {
      // A clean refusal (e.g. insufficient balance): nothing was sent, so put it back in the queue.
      await prisma.affiliateWithdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "QUEUED", failureReason: error.message },
      });
      return { status: "QUEUED" as const, sent: false, reason: error.message };
    }

    // No clear answer; the transfer may exist. Leave it PROCESSING for the webhook or a recheck.
    console.error("Affiliate transfer outcome unknown", error);
    return { status: "PROCESSING" as const, sent: false, reason: "Paystack did not answer clearly. Recheck shortly." };
  }
}
