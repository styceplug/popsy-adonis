import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const capacitySchema = z.object({
  ticketTierId: z.string().min(1),
  capacity: z.number().int().positive().max(1_000_000),
});

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = capacitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter a valid ticket capacity.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existingTier = await prisma.ticketTier.findUnique({
    where: { id: parsed.data.ticketTierId },
    include: { event: { select: { title: true } } },
  });

  if (!existingTier) {
    return NextResponse.json({ message: "Ticket tier not found." }, { status: 404 });
  }

  if (parsed.data.capacity < existingTier.soldCount) {
    return NextResponse.json(
      { message: `Capacity can't be less than the ${existingTier.soldCount} tickets already sold.` },
      { status: 400 },
    );
  }

  const tier = await prisma.ticketTier.update({
    where: { id: parsed.data.ticketTierId },
    data: { capacity: parsed.data.capacity },
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: "ticketTier.capacity.updated",
    entityType: "TicketTier",
    entityId: tier.id,
    metadata: {
      event: existingTier.event.title,
      tier: existingTier.name,
      previousCapacity: existingTier.capacity,
      capacity: parsed.data.capacity,
    },
    request,
  });

  return NextResponse.json({ tier });
}
