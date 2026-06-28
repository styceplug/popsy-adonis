import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const promoStatusSchema = z.object({
  isActive: z.boolean(),
});

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/admin/promos/[promoId]/pause">,
) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const { promoId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = promoStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid promo status." }, { status: 400 });
  }

  const promo = await prisma.ticketPromo.update({
    where: { id: promoId },
    data: { isActive: parsed.data.isActive },
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
    action: parsed.data.isActive ? "promo.resumed" : "promo.paused",
    entityType: "TicketPromo",
    entityId: promo.id,
    metadata: {
      name: promo.name,
      tier: promo.ticketTier.name,
      event: promo.ticketTier.event.title,
      isActive: promo.isActive,
    },
    request,
  });

  return NextResponse.json({ promo });
}

