import crypto from "node:crypto";
import QRCode from "qrcode";
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
  let receipt:
    | {
        to: string;
        reference: string;
        subtotalKobo: number;
        transactionFeeKobo: number;
        totalKobo: number;
        items: Array<{ title: string; quantity: number; totalKobo: number }>;
      }
    | undefined;

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { reference },
      include: { order: { include: { items: true } } },
    });

    if (!transaction || transaction.status === "SUCCESS") return;

    receipt = {
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

    await tx.transaction.update({
      where: { reference },
      data: {
        status: "SUCCESS",
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        gatewayResponse: gatewayResponse as object,
      },
    });

    await tx.order.update({
      where: { id: transaction.orderId },
      data: { status: "PAID" },
    });

    for (const item of transaction.order.items) {
      if (item.itemType === "product" && item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      if (item.itemType === "ticket" && item.ticketTierId) {
        const metadata = item.metadata as TicketMetadata;

        await tx.ticketTier.update({
          where: { id: item.ticketTierId },
          data: { soldCount: { increment: item.quantity } },
        });

        for (let index = 0; index < item.quantity; index += 1) {
          const qrCode = crypto.randomBytes(24).toString("hex");
          const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tickets/${qrCode}`;
          const qrImageHttpUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/tickets/${qrCode}/qr`;
          const qrImageUrl = await QRCode.toDataURL(ticketUrl, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 320,
          });

          const ticket = await tx.ticket.create({
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
  });

  if (!receipt) {
    return { fulfilled: false, reason: "Transaction already fulfilled or not found." };
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
