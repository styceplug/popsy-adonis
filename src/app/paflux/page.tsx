import type { Metadata } from "next";
import { MerchPageClient } from "@/components/commerce/merch-page-client";
import { prisma } from "@/lib/prisma";
import { toStoreProduct } from "@/lib/store-products";
import { openGraphFor } from "@/lib/seo";

const pageTitle = "PA FLUX Store | Popsy Adonis";
const pageDescription =
  "PA FLUX is the official Popsy Adonis clothing line: premium streetwear, limited drops, and culture-led merchandise from Nigeria's entertainment scene.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/paflux",
  },
  openGraph: openGraphFor({ title: pageTitle, description: pageDescription, path: "/paflux", image: { url: "/paflux/opengraph-image", width: 1200, height: 630, alt: "PA FLUX store by Popsy Adonis" } }),
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
