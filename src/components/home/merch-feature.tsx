import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { brand } from "@/lib/sample-data";
import { prisma } from "@/lib/prisma";

export async function MerchFeature() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } },
    orderBy: { createdAt: "asc" },
    take: 6,
  });

  return (
    <section className="overflow-hidden bg-bone py-24 text-ink">
      <div className="section-shell">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-lava">
              {brand.merchName} live drop
            </p>
            <h2 className="mt-4 max-w-xl font-display text-5xl font-black leading-none md:text-7xl">
              Stay in Flux.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-ink/58">
              The first PA FLUX pieces are available now: tees, joggers, and a reminder to keep becoming. Pick your chapter, choose your size, and move.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/merch"
                className="focus-ring inline-flex h-12 items-center gap-2 rounded-ui bg-ink px-6 text-sm font-black text-paper transition hover:bg-lava"
              >
                Shop collection
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const firstVariant = product.variants[0];

              return (
                <ProductCard
                  key={product.id}
                  product={{
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
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
