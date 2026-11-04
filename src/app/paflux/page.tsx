import type { Metadata } from "next";
import { MerchPageClient } from "@/components/commerce/merch-page-client";
import { prisma } from "@/lib/prisma";
import { toStoreProduct } from "@/lib/store-products";

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
    where: { status: "ACTIVE", variants: { some: {} } },
    include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } },
    orderBy: { createdAt: "asc" },
  });

  return <MerchPageClient products={products.map(toStoreProduct)} />;
}
