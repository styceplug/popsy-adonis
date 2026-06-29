import { NextResponse, type NextRequest } from "next/server";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/admin/water-guns/[redemptionId]/collect">,
) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const { redemptionId } = await context.params;
  const existingRedemption = await prisma.eventAddOnRedemption.findUnique({
    where: { id: redemptionId },
    include: {
      order: { include: { transaction: true } },
      eventAddOn: {
        include: {
          event: { select: { title: true } },
        },
      },
    },
  });

  if (!existingRedemption) {
    return NextResponse.json({ message: "Water gun purchase not found." }, { status: 404 });
  }

  const isPaid =
    existingRedemption.order.status === "PAID" ||
    existingRedemption.order.transaction?.status === "SUCCESS";

  if (!isPaid) {
    return NextResponse.json({ message: "This water gun purchase is not paid yet." }, { status: 400 });
  }

  if (existingRedemption.collectedAt) {
    return NextResponse.json({ redemption: existingRedemption });
  }

  const redemption = await prisma.eventAddOnRedemption.update({
    where: { id: redemptionId },
    data: {
      collectedAt: new Date(),
      collectedBy: session.name,
    },
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: "waterGun.collected",
    entityType: "EventAddOnRedemption",
    entityId: redemption.id,
    metadata: {
      addOn: existingRedemption.eventAddOn.name,
      event: existingRedemption.eventAddOn.event.title,
      quantity: existingRedemption.quantity,
      customerEmail: existingRedemption.customerEmail,
      reference: existingRedemption.order.transaction?.reference,
    },
    request,
  });

  return NextResponse.json({ redemption });
}

