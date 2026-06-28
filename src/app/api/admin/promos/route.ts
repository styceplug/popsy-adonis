import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getPromoFallbackEndAt } from "@/lib/ticket-promos";

const promoSchema = z.object({
  id: z.string().optional(),
  ticketTierId: z.string().min(1),
  name: z.string().trim().min(3).max(80),
  promoPriceNaira: z.number().positive(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable().optional(),
  quantityLimit: z.number().int().positive().max(100_000),
  maxPerBuyer: z.number().int().positive().max(100),
  isActive: z.boolean().default(true),
});

function makePromoCode(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = promoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter valid promo details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const startsAt = new Date(data.startsAt);
  const endsAt = data.endsAt ? new Date(data.endsAt) : getPromoFallbackEndAt(startsAt);

  if (endsAt && endsAt <= startsAt) {
    return NextResponse.json({ message: "Promo end time must be after the start time." }, { status: 400 });
  }

  const tier = await prisma.ticketTier.findUnique({
    where: { id: data.ticketTierId },
    include: { event: { select: { title: true } } },
  });

  if (!tier) {
    return NextResponse.json({ message: "Ticket tier not found." }, { status: 404 });
  }

  const promoPriceKobo = Math.round(data.promoPriceNaira * 100);

  if (promoPriceKobo >= tier.priceKobo) {
    return NextResponse.json({ message: "Promo price should be lower than the base ticket price." }, { status: 400 });
  }

  const promo = data.id
    ? await prisma.ticketPromo.update({
        where: { id: data.id },
        data: {
          ticketTierId: data.ticketTierId,
          name: data.name,
          promoPriceKobo,
          startsAt,
          endsAt,
          quantityLimit: data.quantityLimit,
          maxPerBuyer: data.maxPerBuyer,
          isActive: data.isActive,
        },
      })
    : await prisma.ticketPromo.create({
        data: {
          ticketTierId: data.ticketTierId,
          name: data.name,
          code: makePromoCode(data.name),
          promoPriceKobo,
          startsAt,
          endsAt,
          quantityLimit: data.quantityLimit,
          maxPerBuyer: data.maxPerBuyer,
          isActive: data.isActive,
          createdBy: session.name,
        },
      });

  await createAdminAuditLog({
    actorName: session.name,
    action: data.id ? "promo.updated" : "promo.created",
    entityType: "TicketPromo",
    entityId: promo.id,
    metadata: {
      name: promo.name,
      tier: tier.name,
      event: tier.event.title,
      promoPriceKobo,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt?.toISOString() ?? null,
      quantityLimit: data.quantityLimit,
      maxPerBuyer: data.maxPerBuyer,
      isActive: data.isActive,
    },
    request,
  });

  return NextResponse.json({ promo });
}
