import crypto from "node:crypto";
import QRCode from "qrcode";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendPurchaseReceipt, sendTicketReceipt } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

type TicketMetadata = {
  eventId: string;
  ticketTierId: string;
  attendeeNames?: string[];
};

export async function fulfillSuccessfulTransaction(reference: string, gatewayResponse: unknown, paidAt?: string | Date) {
  const issuedTickets: Array<{
    eventTitle: string;
    venue?: string;
    startsAt?: Date | string;
    attendeeName?: string | null;
    qrCode: string;
    qrImageUrl?: string | null;
    qrImageHttpUrl?: string;
    ticketUrl: string;
  }> = [];
  const transaction = await prisma.transaction.findUnique({
    where: { reference },
    include: { order: { include: { items: true } } },
  });

  if (!transaction) {
    return { fulfilled: false, reason: "Transaction not found." };
  }

  if (transaction.status === "SUCCESS") {
    return { fulfilled: false, reason: "Transaction already fulfilled." };
  }

  const receipt = {
    to: transaction.order.email,
    reference,
    subtotalKobo: transaction.order.subtotalKobo,
    transactionFeeKobo: transaction.order.transactionFeeKobo,
    totalKobo: transaction.order.totalKobo,
    items: transaction.order.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      totalKobo: item.totalKobo,
    })),
  };

  await prisma.transaction.update({
    where: { reference },
    data: {
      status: "SUCCESS",
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      gatewayResponse: gatewayResponse as object,
    },
  });

  await prisma.order.update({
    where: { id: transaction.orderId },
    data: { status: "PAID" },
  });

  for (const item of transaction.order.items) {
    if (item.itemType === "product" && item.variantId) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    if (item.itemType === "ticket" && item.ticketTierId) {
      const metadata = item.metadata as TicketMetadata;
      const existingTickets = await prisma.ticket.findMany({
        where: {
          orderId: transaction.orderId,
          tierId: item.ticketTierId,
        },
        include: {
          event: {
            select: {
              title: true,
              venue: true,
              startsAt: true,
            },
          },
        },
      });

      for (const ticket of existingTickets) {
        issuedTickets.push({
          eventTitle: ticket.event.title,
          venue: ticket.event.venue,
          startsAt: ticket.event.startsAt,
          attendeeName: ticket.attendeeName,
          qrCode: ticket.qrCode,
          qrImageUrl: ticket.qrImageUrl,
          qrImageHttpUrl: `${getAppBaseUrl()}/api/tickets/${ticket.qrCode}/qr`,
          ticketUrl: `${getAppBaseUrl()}/tickets/${ticket.qrCode}`,
        });
      }

      const ticketsToIssue = item.quantity - existingTickets.length;

      if (ticketsToIssue <= 0) continue;

      await prisma.ticketTier.update({
        where: { id: item.ticketTierId },
        data: { soldCount: { increment: ticketsToIssue } },
      });

      for (let index = existingTickets.length; index < item.quantity; index += 1) {
        const qrCode = crypto.randomBytes(24).toString("hex");
        const ticketUrl = `${getAppBaseUrl()}/tickets/${qrCode}`;
        const qrImageHttpUrl = `${getAppBaseUrl()}/api/tickets/${qrCode}/qr`;
        const qrImageUrl = await QRCode.toDataURL(ticketUrl, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 320,
        });

        const ticket = await prisma.ticket.create({
          data: {
            orderId: transaction.orderId,
            eventId: metadata.eventId,
            tierId: metadata.ticketTierId,
            attendeeName: metadata.attendeeNames?.[index],
            attendeeEmail: transaction.order.email,
            qrCode,
            qrImageUrl,
          },
          include: {
            event: {
              select: {
                title: true,
                venue: true,
                startsAt: true,
              },
            },
          },
        });

        issuedTickets.push({
          eventTitle: ticket.event.title,
          venue: ticket.event.venue,
          startsAt: ticket.event.startsAt,
          attendeeName: ticket.attendeeName,
          qrCode: ticket.qrCode,
          qrImageUrl: ticket.qrImageUrl,
          qrImageHttpUrl,
          ticketUrl,
        });
      }
    }
  }

  await sendPurchaseReceipt(receipt).catch((mailError) => {
    console.error("Unable to send purchase receipt", mailError);
  });

  if (issuedTickets.length > 0) {
    await sendTicketReceipt({ ...receipt, tickets: issuedTickets }).catch((mailError) => {
      console.error("Unable to send ticket receipt", mailError);
    });
  }

  return { fulfilled: true, ticketsIssued: issuedTickets.length };
}
