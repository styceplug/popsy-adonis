import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

const validateTicketSchema = z.object({
  qrCode: z.string().min(16),
});

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ valid: false, message: "Admin session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = validateTicketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ valid: false, message: "Invalid QR payload." }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode: parsed.data.qrCode },
    include: { order: { include: { transaction: true } } },
  });

  if (!ticket) {
    return NextResponse.json({ valid: false, message: "Ticket not found." }, { status: 404 });
  }

  if (ticket.order.status !== "PAID" && ticket.order.transaction?.status !== "SUCCESS") {
    return NextResponse.json({ valid: false, message: "Ticket payment is not confirmed." }, { status: 409 });
  }

  const tier = await prisma.ticketTier.findUnique({ where: { id: ticket.tierId }, select: { entryDays: true } });
  if (tier?.entryDays.length) {
    return NextResponse.json(
      { valid: false, message: "Use the admin check-in screen to choose the gate day for this ticket." },
      { status: 409 },
    );
  }

  const marked = await prisma.ticket.updateMany({
    where: { id: ticket.id, checkedInAt: null },
    data: { checkedInAt: new Date() },
  });
  const updatedTicket = await prisma.ticket.findUniqueOrThrow({
    where: { id: ticket.id },
    omit: { checkInCode: true },
  });

  if (marked.count === 0) {
    return NextResponse.json(
      { valid: false, message: "Ticket has already been checked in.", checkedInAt: updatedTicket.checkedInAt },
      { status: 409 },
    );
  }

  await createAdminAuditLog({
    actorName: session.name,
    action: "ticket.validate.legacy_success",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: { method: "qr", eventId: ticket.eventId },
    request,
  });

  return NextResponse.json({
    valid: true,
    message: "Ticket validated.",
    ticket: updatedTicket,
  });
}
