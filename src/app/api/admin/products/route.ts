import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(2).max(80),
  size: z.string().trim().max(30).optional().nullable(),
  color: z.string().trim().max(60).optional().nullable(),
  priceNaira: z.number().positive(),
  stock: z.number().int().min(0).max(100_000),
});

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140),
  description: z.string().trim().min(10),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  images: z.array(z.string().trim().min(1)).min(1),
  variants: z.array(variantSchema).min(1),
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
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter valid product details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const slug = normalizeSlug(data.slug);

  const product = await prisma.product.upsert({
    where: { id: data.id ?? `new-${crypto.randomUUID()}` },
    update: {
      name: data.name,
      slug,
      description: data.description,
      status: data.status,
      images: data.images,
    },
    create: {
      id: data.id,
      name: data.name,
      slug,
      description: data.description,
      status: data.status,
      images: data.images,
    },
  });

  for (const variant of data.variants) {
    await prisma.productVariant.upsert({
      where: { id: variant.id ?? `new-${crypto.randomUUID()}` },
      update: {
        sku: variant.sku,
        size: variant.size || null,
        color: variant.color || null,
        priceKobo: Math.round(variant.priceNaira * 100),
        stock: variant.stock,
      },
      create: {
        id: variant.id,
        productId: product.id,
        sku: variant.sku,
        size: variant.size || null,
        color: variant.color || null,
        priceKobo: Math.round(variant.priceNaira * 100),
        stock: variant.stock,
      },
    });
  }

  await createAdminAuditLog({
    actorName: session.name,
    action: data.id ? "product.updated" : "product.created",
    entityType: "Product",
    entityId: product.id,
    metadata: {
      name: product.name,
      slug: product.slug,
      status: product.status,
      variants: data.variants.length,
    },
    request,
  });

  return NextResponse.json({ product });
}
