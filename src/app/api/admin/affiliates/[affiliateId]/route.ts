import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { MAX_AFFILIATE_COMMISSION_BPS } from "@/lib/affiliates";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["APPROVED", "SUSPENDED"]).optional(),
  // null clears the personal rate so the affiliate goes back to each event's rate.
  commissionPercentOverride: z.number().min(0).max(MAX_AFFILIATE_COMMISSION_BPS / 100).nullable().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ affiliateId: string }> }) {
  const session = getAdminSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "Admin session required." }, { status: 401 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid affiliate update." }, { status: 400 });

  const { affiliateId } = await params;
  const existing = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
  if (!existing) return NextResponse.json({ message: "Affiliate not found." }, { status: 404 });

  const { status, commissionPercentOverride } = parsed.data;
  const affiliate = await prisma.affiliate.update({
    where: { id: affiliateId },
    data: {
      ...(status ? { status } : {}),
      ...(status === "APPROVED" && !existing.approvedAt ? { approvedAt: new Date(), approvedBy: session.name } : {}),
      ...(commissionPercentOverride !== undefined
        ? { commissionBpsOverride: commissionPercentOverride === null ? null : Math.round(commissionPercentOverride * 100) }
        : {}),
    },
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: status ? `affiliate.${status.toLowerCase()}` : "affiliate.rateChanged",
    entityType: "Affiliate",
    entityId: affiliate.id,
    metadata: {
      email: affiliate.email,
      code: affiliate.code,
      status: affiliate.status,
      commissionBpsOverride: affiliate.commissionBpsOverride,
    },
    request,
  });

  return NextResponse.json({ ok: true, status: affiliate.status });
}
