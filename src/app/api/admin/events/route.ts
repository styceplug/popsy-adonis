import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const tierSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  priceNaira: z.number().min(0),
  capacity: z.number().int().positive().max(1_000_000),
  perks: z.array(z.string().trim().min(1)).default([]),
  isActive: z.boolean().default(true),
});

const eventSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).max(140),
  slug: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10),
  venue: z.string().trim().min(2).max(160),
  city: z.string().trim().min(2).max(80),
  startsAt: z.string().datetime(),
  status: z.enum(["DRAFT", "PUBLISHED", "SOLD_OUT", "COMPLETED", "CANCELLED"]),
  heroImage: z.string().trim().optional().nullable(),
  ticketTiers: z.array(tierSchema).default([]),
});

function normalizeSlug(slug: string) {
  return slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter valid event details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const slug = normalizeSlug(data.slug);

  const event = await prisma.event.upsert({
    where: { id: data.id ?? `new-${crypto.randomUUID()}` },
    update: {
      title: data.title,
      slug,
      description: data.description,
      venue: data.venue,
      city: data.city,
      startsAt: new Date(data.startsAt),
      status: data.status,
      heroImage: data.heroImage || null,
    },
    create: {
      id: data.id,
      title: data.title,
      slug,
      description: data.description,
      venue: data.venue,
      city: data.city,
      startsAt: new Date(data.startsAt),
      status: data.status,
      heroImage: data.heroImage || null,
    },
  });

  for (const tier of data.ticketTiers) {
    await prisma.ticketTier.upsert({
      where: { id: tier.id ?? `new-${crypto.randomUUID()}` },
      update: {
        name: tier.name,
        priceKobo: Math.round(tier.priceNaira * 100),
        capacity: tier.capacity,
        perks: tier.perks,
        isActive: tier.isActive,
      },
      create: {
        id: tier.id,
        eventId: event.id,
        name: tier.name,
        priceKobo: Math.round(tier.priceNaira * 100),
        capacity: tier.capacity,
        perks: tier.perks,
        isActive: tier.isActive,
      },
    });
  }

  await createAdminAuditLog({
    actorName: session.name,
    action: data.id ? "event.updated" : "event.created",
    entityType: "Event",
    entityId: event.id,
    metadata: {
      title: event.title,
      slug: event.slug,
      status: event.status,
      ticketTiers: data.ticketTiers.length,
    },
    request,
  });

  return NextResponse.json({ event });
}
