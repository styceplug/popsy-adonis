import { NextResponse, type NextRequest } from "next/server";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/admin/promos/[promoId]">,
) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const { promoId } = await context.params;
  const promo = await prisma.ticketPromo.delete({
    where: { id: promoId },
    include: {
      ticketTier: {
        select: {
          name: true,
          event: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: "promo.deleted",
    entityType: "TicketPromo",
    entityId: promo.id,
    metadata: {
      name: promo.name,
      tier: promo.ticketTier.name,
      event: promo.ticketTier.event.title,
      promoPriceKobo: promo.promoPriceKobo,
      startsAt: promo.startsAt.toISOString(),
      endsAt: promo.endsAt?.toISOString() ?? null,
      quantityLimit: promo.quantityLimit,
      maxPerBuyer: promo.maxPerBuyer,
    },
    request,
  });

  return NextResponse.json({ promo });
}
