import type { Metadata } from "next";
import { MerchPageClient } from "@/components/commerce/merch-page-client";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "PA FLUX Store | Popsy Adonis",
  description:
    "PA FLUX is the official Popsy Adonis clothing line: premium streetwear, limited drops, and culture-led merchandise from Nigeria's entertainment scene.",
  alternates: {
    canonical: "/paflux",
  },
};

export const dynamic = "force-dynamic";

export default async function MerchPage() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <MerchPageClient
      products={products.map((product) => {
        const firstVariant = product.variants[0];

        return {
          id: product.id,
          defaultVariantId: firstVariant?.id ?? "",
          name: product.name,
          slug: product.slug,
          description: product.description,
          priceKobo: firstVariant?.priceKobo ?? 0,
          images: product.images,
          colors: [...new Set(product.variants.map((variant) => variant.color).filter(Boolean))] as string[],
          sizes: [...new Set(product.variants.map((variant) => variant.size).filter(Boolean))] as string[],
          variants: product.variants.map((variant) => ({
            id: variant.id,
            size: variant.size ?? "",
            color: variant.color ?? "",
            priceKobo: variant.priceKobo,
            stock: variant.stock,
          })),
          tag: "PA FLUX",
        };
      })}
    />
  );
}
