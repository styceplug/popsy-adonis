import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { normalizeTicketCode } from "@/lib/ticket-code";

const checkInSchema = z.object({
  code: z.string().min(8),
  // The gate day picked on the check-in screen. Only matters for multi-day tiers.
  day: z.string().trim().max(40).optional(),
});

type TierInfo = { name: string; entryDays: string[] } | null;

function sameDay(a: string, b: string) {
  return a.trim().toLowerCase().replace(/\s+/g, " ") === b.trim().toLowerCase().replace(/\s+/g, " ");
}

function serializeTicket(ticket: Awaited<ReturnType<typeof getTicketByQrCode>>, tier?: TierInfo) {
  if (!ticket) return null;

  return {
    id: ticket.id,
    qrCode: ticket.qrCode,
    attendeeName: ticket.attendeeName,
    attendeeEmail: ticket.attendeeEmail,
    checkedInAt: ticket.checkedInAt,
    checkInDays: ticket.checkInDays,
    tierName: tier?.name ?? null,
    entryDays: tier?.entryDays ?? [],
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

  const tier: TierInfo = await prisma.ticketTier.findUnique({
    where: { id: ticket.tierId },
    select: { name: true, entryDays: true },
  });

  // Multi-day tier: one entry per listed day, checked against the gate day.
  if (tier && tier.entryDays.length > 0) {
    const day = parsed.data.day ? tier.entryDays.find((entryDay) => sameDay(entryDay, parsed.data.day!)) : undefined;
    const daysText = tier.entryDays.join(", ");

    if (parsed.data.day && !day) {
      await createAdminAuditLog({
        actorName: session.name,
        action: "ticket.checkin.wrong_day",
        entityType: "Ticket",
        entityId: ticket.id,
        metadata: { qrCode, gateDay: parsed.data.day, entryDays: tier.entryDays },
        request,
      });

      return NextResponse.json(
        {
          status: "wrong_day",
          message: `Not valid for ${parsed.data.day}. ${tier.name} gets in on: ${daysText}.`,
          ticket: serializeTicket(ticket, tier),
        },
        { status: 409 },
      );
    }

    // Without a gate day we cannot tell a Day 1 ticket from a Day 3 one, so never guess.
    if (!day) {
      return NextResponse.json(
        {
          status: "choose_day",
          message: `This ticket covers ${daysText}. Pick today's gate day above, then scan again.`,
          ticket: serializeTicket(ticket, tier),
        },
        { status: 409 },
      );
    }

    // Only succeeds if this day is not recorded yet, so two quick scans cannot both get in.
    const marked = await prisma.ticket.updateMany({
      where: { id: ticket.id, NOT: { checkInDays: { has: day } } },
      data: { checkInDays: { push: day } },
    });

    if (marked.count === 0) {
      await createAdminAuditLog({
        actorName: session.name,
        action: "ticket.checkin.duplicate",
        entityType: "Ticket",
        entityId: ticket.id,
        metadata: { qrCode, day },
        request,
      });

      return NextResponse.json(
        { status: "duplicate", message: `Already checked in for ${day}.`, ticket: serializeTicket(ticket, tier) },
        { status: 409 },
      );
    }

    await prisma.ticket.updateMany({ where: { id: ticket.id, checkedInAt: null }, data: { checkedInAt: new Date() } });
    const updated = await getTicketByQrCode(qrCode);

    await createAdminAuditLog({
      actorName: session.name,
      action: "ticket.checkin.success",
      entityType: "Ticket",
      entityId: ticket.id,
      metadata: {
        qrCode,
        day,
        eventId: ticket.eventId,
        eventTitle: ticket.event.title,
        attendeeName: ticket.attendeeName,
        reference: ticket.order.transaction?.reference,
      },
      request,
    });

    return NextResponse.json({
      status: "success",
      message: `Checked in for ${day}.`,
      ticket: serializeTicket(updated, tier),
    });
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
      { status: "duplicate", message: "Ticket has already been checked in.", ticket: serializeTicket(ticket, tier) },
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
    ticket: serializeTicket(updatedTicket, tier),
  });
}
