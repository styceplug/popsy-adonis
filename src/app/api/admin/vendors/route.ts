import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { normalizeVendorSlug } from "@/lib/vendors";

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

const vendorSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(140).optional(),
  category: z.string().trim().min(2).max(60),
  tagline: optionalText(160),
  description: z.string().trim().min(10).max(5000),
  location: optionalText(120),
  phone: optionalText(30),
  whatsapp: optionalText(30),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal("")),
  instagram: optionalText(160),
  website: optionalText(200),
  logoUrl: optionalText(500),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  media: z
    .array(
      z.object({
        url: z.string().trim().url().max(500),
        type: z.enum(["image", "video"]),
        caption: optionalText(160),
      }),
    )
    .max(40)
    .default([]),
});

const fieldLabels: Record<string, string> = {
  name: "Business name",
  category: "Service",
  description: "About (at least 10 characters)",
  email: "Email",
  media: "Portfolio",
};

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "Admin session required." }, { status: 401 });

  const parsed = vendorSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const fields = Object.keys(parsed.error.flatten().fieldErrors).map((field) => fieldLabels[field] ?? field);
    return NextResponse.json({ message: `Check these fields: ${fields.join(", ")}.` }, { status: 400 });
  }

  const data = parsed.data;
  const slug = normalizeVendorSlug(data.slug || data.name);
  if (!slug) return NextResponse.json({ message: "Enter a business name." }, { status: 400 });

  const clash = await prisma.vendor.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== data.id) {
    return NextResponse.json({ message: "Another vendor already uses this link name. Change it slightly." }, { status: 409 });
  }

  const fields = {
    name: data.name,
    slug,
    category: data.category,
    tagline: data.tagline || null,
    description: data.description,
    location: data.location || null,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    email: data.email || null,
    instagram: data.instagram || null,
    website: data.website || null,
    logoUrl: data.logoUrl || null,
    isActive: data.isActive,
    isFeatured: data.isFeatured,
  };
  const media = data.media.map((item, index) => ({
    url: item.url,
    type: item.type,
    caption: item.caption || null,
    sortOrder: index,
  }));

  const vendor = await prisma.$transaction(async (tx) => {
    const saved = data.id
      ? await tx.vendor.update({ where: { id: data.id }, data: fields })
      : await tx.vendor.create({ data: fields });

    // The editor always sends the full portfolio in order, so replace it wholesale.
    await tx.vendorMedia.deleteMany({ where: { vendorId: saved.id } });
    if (media.length > 0) {
      await tx.vendorMedia.createMany({ data: media.map((item) => ({ ...item, vendorId: saved.id })) });
    }
    return saved;
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: data.id ? "vendor.updated" : "vendor.created",
    entityType: "Vendor",
    entityId: vendor.id,
    metadata: { name: vendor.name, category: vendor.category, isActive: vendor.isActive, mediaCount: media.length },
    request,
  });

  return NextResponse.json({ vendor });
}
