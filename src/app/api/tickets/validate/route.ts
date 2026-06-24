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

  const body = await request.json();
  const parsed = validateTicketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ valid: false, message: "Invalid QR payload." }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode: parsed.data.qrCode },
    include: { event: true },
  });

  if (!ticket) {
    return NextResponse.json({ valid: false, message: "Ticket not found." }, { status: 404 });
  }

  if (ticket.checkedInAt) {
    return NextResponse.json(
      { valid: false, message: "Ticket has already been checked in.", checkedInAt: ticket.checkedInAt },
      { status: 409 },
    );
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { checkedInAt: new Date() },
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: "ticket.validate.legacy_success",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: { qrCode: ticket.qrCode, eventId: ticket.eventId },
    request,
  });

  return NextResponse.json({
    valid: true,
    message: "Ticket validated.",
    ticket: updatedTicket,
  });
}
