import { NextResponse, type NextRequest } from "next/server";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/**
 * Deletes a ticket tier, but only one nobody has bought or started buying. Tiers with sales
 * stay for the records and the gate; untick "On sale" to stop selling those instead.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ tierId: string }> }) {
  const session = getAdminSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "Admin session required." }, { status: 401 });

  const { tierId } = await params;
  const tier = await prisma.ticketTier.findUnique({
    where: { id: tierId },
    include: { event: { select: { title: true } } },
  });
  if (!tier) return NextResponse.json({ message: "Ticket tier not found." }, { status: 404 });

  const [tickets, orderItems] = await Promise.all([
    prisma.ticket.count({ where: { tierId } }),
    prisma.orderItem.count({ where: { ticketTierId: tierId } }),
  ]);

  if (tier.soldCount > 0 || tickets > 0 || orderItems > 0) {
    return NextResponse.json(
      {
        message: `"${tier.name}" has orders, so it can't be deleted. Untick "On sale" to stop selling it.`,
      },
      { status: 409 },
    );
  }

  // Promos on this tier are removed with it (cascade).
  await prisma.ticketTier.delete({ where: { id: tierId } });

  await createAdminAuditLog({
    actorName: session.name,
    action: "ticketTier.deleted",
    entityType: "TicketTier",
    entityId: tierId,
    metadata: { name: tier.name, event: tier.event.title, priceKobo: tier.priceKobo },
    request,
  });

  return NextResponse.json({ ok: true });
}
