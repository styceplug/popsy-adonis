import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const priceSchema = z.object({
  ticketTierId: z.string().min(1),
  priceNaira: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = priceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter a valid ticket price.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const priceKobo = Math.round(parsed.data.priceNaira * 100);
  const existingTier = await prisma.ticketTier.findUnique({
    where: { id: parsed.data.ticketTierId },
    include: { event: { select: { title: true } } },
  });

  if (!existingTier) {
    return NextResponse.json({ message: "Ticket tier not found." }, { status: 404 });
  }

  const tier = await prisma.ticketTier.update({
    where: { id: parsed.data.ticketTierId },
    data: { priceKobo },
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: "ticketTier.price.updated",
    entityType: "TicketTier",
    entityId: tier.id,
    metadata: {
      event: existingTier.event.title,
      tier: existingTier.name,
      previousPriceKobo: existingTier.priceKobo,
      priceKobo,
    },
    request,
  });

  return NextResponse.json({ tier });
}

