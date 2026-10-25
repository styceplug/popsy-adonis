import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { attemptPayout } from "@/lib/affiliate-payouts";
import { prisma } from "@/lib/prisma";

const actionSchema = z.object({
  action: z.enum(["send", "markPaid", "cancel"]),
});

/**
 * Admin handling of a requested payout:
 * send     - pay it now from the Paystack balance
 * markPaid - it was paid outside Paystack (e.g. bank transfer); record it
 * cancel   - drop the request; the amount goes back to the affiliate's balance
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ withdrawalId: string }> }) {
  const session = getAdminSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "Admin session required." }, { status: 401 });

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid action." }, { status: 400 });

  const { withdrawalId } = await params;
  const withdrawal = await prisma.affiliateWithdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) return NextResponse.json({ message: "Payout request not found." }, { status: 404 });

  const { action } = parsed.data;
  let message: string;

  if (action === "send") {
    const result = await attemptPayout(withdrawal.id);
    message = result.sent ? "Sent through Paystack." : (result.reason ?? "Not sent.");
  } else {
    // Only a request nobody is paying yet can be settled by hand or cancelled.
    const updated = await prisma.affiliateWithdrawal.updateMany({
      where: { id: withdrawal.id, status: "QUEUED" },
      data:
        action === "markPaid"
          ? { status: "PAID", paidAt: new Date(), failureReason: `Paid manually, recorded by ${session.name}.` }
          : { status: "FAILED", failureReason: `Cancelled by ${session.name}.` },
    });
    if (updated.count === 0) {
      return NextResponse.json({ message: "Only a requested payout that is not being sent can be changed." }, { status: 409 });
    }
    message = action === "markPaid" ? "Recorded as paid." : "Request cancelled. The amount is back in their balance.";
  }

  await createAdminAuditLog({
    actorName: session.name,
    action: `affiliate.withdrawal.${action}`,
    entityType: "AffiliateWithdrawal",
    entityId: withdrawal.id,
    metadata: { reference: withdrawal.reference, amountKobo: withdrawal.amountKobo, result: message },
    request,
  });

  return NextResponse.json({ message });
}
