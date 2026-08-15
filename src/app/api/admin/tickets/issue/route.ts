import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { fulfillSuccessfulTransaction } from "@/lib/fulfillment";
import { prisma } from "@/lib/prisma";

const issueSchema = z.object({
  ticketTierId: z.string().min(1),
  quantity: z.number().int().positive().max(20),
  email: z.string().email(),
  attendeeName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  paymentMethod: z.enum(["CASH", "TRANSFER", "COMPLIMENTARY"]),
  amountNaira: z.number().min(0).optional(),
  note: z.string().trim().max(300).optional(),
  joinMailingList: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = issueSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter valid ticket details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { ticketTierId, quantity, attendeeName, paymentMethod, amountNaira, note, joinMailingList } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const phone = parsed.data.phone || undefined;

  const tier = await prisma.ticketTier.findUnique({
    where: { id: ticketTierId },
    include: { event: true },
  });

  if (!tier) {
    return NextResponse.json({ message: "That ticket tier no longer exists." }, { status: 404 });
  }

  const remaining = tier.capacity - tier.soldCount;

  if (remaining < quantity) {
    return NextResponse.json(
      {
        message:
          remaining <= 0
            ? `${tier.name} is sold out. Raise "Tickets available" on the Events page before issuing more.`
            : `Only ${remaining} ${tier.name} ticket${remaining === 1 ? "" : "s"} left. Raise "Tickets available" on the Events page to issue more.`,
      },
      { status: 409 },
    );
  }

  const unitKobo =
    paymentMethod === "COMPLIMENTARY"
      ? 0
      : amountNaira !== undefined
        ? Math.round((amountNaira * 100) / quantity)
        : tier.priceKobo;
  const totalKobo = unitKobo * quantity;
  const reference = `MANUAL_${Date.now()}_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      email,
      phone,
      status: "PENDING",
      subtotalKobo: totalKobo,
      platformFeeKobo: 0,
      transactionFeeKobo: 0,
      totalKobo,
      items: {
        create: [
          {
            itemType: "ticket",
            ticketTierId: tier.id,
            title: `${tier.event.title} - ${tier.name}`,
            quantity,
            unitKobo,
            totalKobo,
            metadata: {
              eventId: tier.eventId,
              ticketTierId: tier.id,
              attendeeNames: attendeeName ? Array.from({ length: quantity }, () => attendeeName) : [],
              issuedManually: true,
              paymentMethod,
              issuedBy: session.name,
              note: note ?? null,
            },
          },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      orderId: order.id,
      gateway: "manual",
      reference,
      status: "PENDING",
      amountKobo: totalKobo,
      developerFeeKobo: 0,
      adonisAmountKobo: totalKobo,
      transactionFeeKobo: 0,
    },
  });

  const result = await fulfillSuccessfulTransaction(reference, {
    manual: true,
    paymentMethod,
    issuedBy: session.name,
    note: note ?? null,
  });

  if (!result.fulfilled) {
    return NextResponse.json({ message: result.reason ?? "Unable to issue the ticket." }, { status: 500 });
  }

  const emailSent = result.emailSent === true;

  if (joinMailingList) {
    await prisma.waitlistSubscriber
      .upsert({
        where: { email },
        update: { isActive: true },
        create: { email, source: "MANUAL_TICKET" },
      })
      .catch(() => undefined);
  }

  const tickets = await prisma.ticket.findMany({
    where: { orderId: order.id },
    select: { qrCode: true, attendeeName: true },
    orderBy: { createdAt: "asc" },
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: "ticket.issued.manual",
    entityType: "Order",
    entityId: order.id,
    metadata: {
      reference,
      email,
      eventTitle: tier.event.title,
      tierName: tier.name,
      quantity,
      paymentMethod,
      totalKobo,
      emailSent,
      note: note ?? null,
    },
    request,
  });

  return NextResponse.json({
    message: emailSent
      ? `${quantity} ticket${quantity === 1 ? "" : "s"} issued and emailed to ${email}.`
      : `${quantity} ticket${quantity === 1 ? "" : "s"} issued, but the email did not send. Open the ticket below and show the QR code.`,
    emailSent,
    emailError: result.emailError,
    reference,
    orderId: order.id,
    quantity,
    totalKobo,
    tickets,
  });
}
