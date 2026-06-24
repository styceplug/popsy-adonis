import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { normalizeTicketCode } from "@/lib/ticket-code";

const checkInSchema = z.object({
  code: z.string().min(8),
});

function serializeTicket(ticket: Awaited<ReturnType<typeof getTicketByQrCode>>) {
  if (!ticket) return null;

  return {
    id: ticket.id,
    qrCode: ticket.qrCode,
    attendeeName: ticket.attendeeName,
    attendeeEmail: ticket.attendeeEmail,
    checkedInAt: ticket.checkedInAt,
    createdAt: ticket.createdAt,
    event: {
      title: ticket.event.title,
      venue: ticket.event.venue,
      city: ticket.event.city,
      startsAt: ticket.event.startsAt,
    },
    order: {
      email: ticket.order.email,
      status: ticket.order.status,
      reference: ticket.order.transaction?.reference,
      transactionStatus: ticket.order.transaction?.status,
    },
  };
}

async function getTicketByQrCode(qrCode: string) {
  return prisma.ticket.findUnique({
    where: { qrCode },
    include: {
      event: true,
      order: {
        include: {
          transaction: true,
        },
      },
    },
  });
}

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", message: "Enter or scan a valid ticket code." }, { status: 400 });
  }

  const qrCode = normalizeTicketCode(parsed.data.code);
  const ticket = await getTicketByQrCode(qrCode);

  if (!ticket) {
    await createAdminAuditLog({
      actorName: session.name,
      action: "ticket.checkin.not_found",
      entityType: "Ticket",
      entityId: qrCode,
      metadata: { qrCode },
      request,
    });

    return NextResponse.json({ status: "not_found", message: "Ticket not found." }, { status: 404 });
  }

  const isPaid = ticket.order.status === "PAID" || ticket.order.transaction?.status === "SUCCESS";

  if (!isPaid) {
    await createAdminAuditLog({
      actorName: session.name,
      action: "ticket.checkin.unpaid",
      entityType: "Ticket",
      entityId: ticket.id,
      metadata: { qrCode, orderStatus: ticket.order.status, transactionStatus: ticket.order.transaction?.status },
      request,
    });

    return NextResponse.json(
      { status: "unpaid", message: "Ticket payment is not confirmed.", ticket: serializeTicket(ticket) },
      { status: 409 },
    );
  }

  if (ticket.checkedInAt) {
    await createAdminAuditLog({
      actorName: session.name,
      action: "ticket.checkin.duplicate",
      entityType: "Ticket",
      entityId: ticket.id,
      metadata: { qrCode, checkedInAt: ticket.checkedInAt },
      request,
    });

    return NextResponse.json(
      { status: "duplicate", message: "Ticket has already been checked in.", ticket: serializeTicket(ticket) },
      { status: 409 },
    );
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { checkedInAt: new Date() },
    include: {
      event: true,
      order: {
        include: {
          transaction: true,
        },
      },
    },
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: "ticket.checkin.success",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: {
      qrCode,
      eventId: ticket.eventId,
      eventTitle: ticket.event.title,
      attendeeName: ticket.attendeeName,
      reference: ticket.order.transaction?.reference,
    },
    request,
  });

  return NextResponse.json({
    status: "success",
    message: "Ticket checked in.",
    ticket: serializeTicket(updatedTicket),
  });
}
