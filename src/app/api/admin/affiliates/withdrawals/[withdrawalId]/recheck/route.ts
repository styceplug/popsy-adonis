import { NextResponse, type NextRequest } from "next/server";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { applyTransferStatus } from "@/lib/affiliate-payouts";
import { PaystackApiError, verifyTransfer } from "@/lib/paystack-transfers";
import { prisma } from "@/lib/prisma";

/** Asks Paystack what really happened to a withdrawal that is stuck in PROCESSING. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ withdrawalId: string }> }) {
  const session = getAdminSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "Admin session required." }, { status: 401 });

  const { withdrawalId } = await params;
  const withdrawal = await prisma.affiliateWithdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) return NextResponse.json({ message: "Withdrawal not found." }, { status: 404 });

  try {
    const transfer = await verifyTransfer(withdrawal.reference);
    const updated = await applyTransferStatus(withdrawal.reference, transfer);

    await createAdminAuditLog({
      actorName: session.name,
      action: "affiliate.withdrawalRechecked",
      entityType: "AffiliateWithdrawal",
      entityId: withdrawal.id,
      metadata: { reference: withdrawal.reference, paystackStatus: transfer.status, status: updated?.status },
      request,
    });

    return NextResponse.json({ status: updated?.status, paystackStatus: transfer.status });
  } catch (error) {
    // Paystack has no record of the transfer, so it was never created and the money is safe to release.
    if (error instanceof PaystackApiError && /not found/i.test(error.message)) {
      const updated = await prisma.affiliateWithdrawal.update({
        where: { id: withdrawal.id },
        data: withdrawal.status === "PROCESSING" ? { status: "FAILED", failureReason: "Paystack has no record of this transfer." } : {},
      });
      return NextResponse.json({ status: updated.status, paystackStatus: "not_found" });
    }

    console.error("Unable to recheck affiliate withdrawal", error);
    return NextResponse.json({ message: "Unable to reach Paystack. Try again." }, { status: 502 });
  }
}
