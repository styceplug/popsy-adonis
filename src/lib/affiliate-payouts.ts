import { prisma } from "@/lib/prisma";

const failedStatuses = new Set(["failed", "reversed", "abandoned", "blocked", "rejected"]);

/**
 * Maps a Paystack transfer status onto a withdrawal. Used by the withdraw request, the
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
        status: "FAILED",
        transferCode: transfer.transfer_code ?? withdrawal.transferCode,
        failureReason: "Paystack asked for a transfer OTP. Disable transfer OTP in the Paystack dashboard.",
      },
    });
  }

  if (failedStatuses.has(transfer.status)) {
    return prisma.affiliateWithdrawal.update({
      where: { reference },
      data: {
        status: "FAILED",
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
