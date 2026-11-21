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
  entryDays: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
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
  dateLabel: z.string().trim().max(80).optional().nullable(),
  highlights: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
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

  // Check the two unique rules up front so admins get a clear message instead of a 500.
  const tierNames = data.ticketTiers.map((tier) => tier.name.trim().toLowerCase());
  const duplicateName = data.ticketTiers.find((tier, index) => tierNames.indexOf(tier.name.trim().toLowerCase()) !== index);
  if (duplicateName) {
    return NextResponse.json(
      { message: `Two ticket tiers are both called "${duplicateName.name}". Give each tier a different name.` },
      { status: 400 },
    );
  }

  const slugOwner = await prisma.event.findUnique({ where: { slug }, select: { id: true, title: true } });
  if (slugOwner && slugOwner.id !== data.id) {
    return NextResponse.json(
      { message: `The link name "${slug}" is already used by "${slugOwner.title}". Change the link name.` },
      { status: 409 },
    );
  }

  try {

  // One transaction: if any tier fails, nothing is half-saved.
  const event = await prisma.$transaction(async (tx) => {
  const saved = await tx.event.upsert({
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
      dateLabel: data.dateLabel || null,
      highlights: data.highlights,
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
      dateLabel: data.dateLabel || null,
      highlights: data.highlights,
    },
  });

  for (const tier of data.ticketTiers) {
    await tx.ticketTier.upsert({
      where: { id: tier.id ?? `new-${crypto.randomUUID()}` },
      update: {
        name: tier.name,
        priceKobo: Math.round(tier.priceNaira * 100),
        capacity: tier.capacity,
        perks: tier.perks,
        entryDays: tier.entryDays,
        isActive: tier.isActive,
      },
      create: {
        id: tier.id,
        eventId: saved.id,
        name: tier.name,
        priceKobo: Math.round(tier.priceNaira * 100),
        capacity: tier.capacity,
        perks: tier.perks,
        entryDays: tier.entryDays,
        isActive: tier.isActive,
      },
    });
  }

  return saved;
  }, { maxWait: 10_000, timeout: 20_000 });

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
  } catch (error) {
    console.error("Unable to save event", error);
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
    const message =
      code === "P2002"
        ? "Two ticket tiers have the same name, or the link name is taken. Rename and try again."
        : `Unable to save event: ${error instanceof Error ? error.message.split("\n").filter(Boolean).pop() : "unknown error"}`;
    return NextResponse.json({ message }, { status: code === "P2002" ? 409 : 500 });
  }
}
