import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { MAX_AFFILIATE_COMMISSION_BPS } from "@/lib/affiliates";
import { prisma } from "@/lib/prisma";

const rateSchema = z.object({
  eventId: z.string().min(1),
  percent: z.number().min(0).max(MAX_AFFILIATE_COMMISSION_BPS / 100),
});

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "Admin session required." }, { status: 401 });

  const parsed = rateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: `Enter a commission between 0 and ${MAX_AFFILIATE_COMMISSION_BPS / 100}%.` },
      { status: 400 },
    );
  }

  const existing = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
  if (!existing) return NextResponse.json({ message: "Event not found." }, { status: 404 });

  const affiliateCommissionBps = Math.round(parsed.data.percent * 100);
  const event = await prisma.event.update({
    where: { id: existing.id },
    data: { affiliateCommissionBps },
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: "affiliate.eventRateChanged",
    entityType: "Event",
    entityId: event.id,
    metadata: { event: event.title, fromBps: existing.affiliateCommissionBps, toBps: affiliateCommissionBps },
    request,
  });

  return NextResponse.json({ ok: true, affiliateCommissionBps });
}
