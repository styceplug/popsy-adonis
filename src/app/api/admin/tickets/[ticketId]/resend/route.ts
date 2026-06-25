import { NextResponse, type NextRequest } from "next/server";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendTicketReceipt } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const { ticketId } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      order: {
        include: {
          items: true,
          transaction: true,
          tickets: {
            include: {
              event: {
                select: {
                  title: true,
                  slug: true,
                  venue: true,
                  startsAt: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
  }

  const isPaid = ticket.order.status === "PAID" || ticket.order.transaction?.status === "SUCCESS";

  if (!isPaid) {
    return NextResponse.json({ message: "Only paid ticket orders can be resent." }, { status: 409 });
  }

  const appBaseUrl = getAppBaseUrl();
  const reference = ticket.order.transaction?.reference ?? ticket.order.id;

  await sendTicketReceipt({
    to: ticket.order.email,
    reference,
    subtotalKobo: ticket.order.subtotalKobo,
    transactionFeeKobo: ticket.order.transactionFeeKobo,
    totalKobo: ticket.order.totalKobo,
    items: ticket.order.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      totalKobo: item.totalKobo,
    })),
    tickets: ticket.order.tickets.map((orderTicket) => ({
      eventTitle: orderTicket.event.title,
      venue: orderTicket.event.venue,
      startsAt: orderTicket.event.slug === "summer-time-in-ekiti" ? undefined : orderTicket.event.startsAt,
      attendeeName: orderTicket.attendeeName,
      qrCode: orderTicket.qrCode,
      qrImageUrl: orderTicket.qrImageUrl,
      qrImageHttpUrl: `${appBaseUrl}/api/tickets/${orderTicket.qrCode}/qr`,
      ticketUrl: `${appBaseUrl}/tickets/${orderTicket.qrCode}`,
    })),
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: "ticket.email.resend",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: {
      orderId: ticket.orderId,
      email: ticket.order.email,
      reference,
      ticketCount: ticket.order.tickets.length,
    },
    request,
  });

  return NextResponse.json({
    message: "Ticket email resent.",
    email: ticket.order.email,
    ticketCount: ticket.order.tickets.length,
  });
}
