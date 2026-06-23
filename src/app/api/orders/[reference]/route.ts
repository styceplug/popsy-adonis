import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { reference },
    include: {
      order: {
        include: {
          items: true,
          tickets: {
            select: {
              id: true,
              attendeeName: true,
              qrCode: true,
              qrImageUrl: true,
              checkedInAt: true,
              event: {
                select: {
                  title: true,
                  startsAt: true,
                  venue: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!transaction) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    reference: transaction.reference,
    transactionStatus: transaction.status,
    paidAt: transaction.paidAt,
    order: {
      id: transaction.order.id,
      status: transaction.order.status,
      email: transaction.order.email,
      subtotalKobo: transaction.order.subtotalKobo,
      transactionFeeKobo: transaction.order.transactionFeeKobo,
      totalKobo: transaction.order.totalKobo,
      items: transaction.order.items,
      tickets: transaction.order.tickets,
    },
  });
}

