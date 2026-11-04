import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { brand } from "@/lib/sample-data";
import { prisma } from "@/lib/prisma";
import { toStoreProduct } from "@/lib/store-products";

export async function MerchFeature() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", variants: { some: {} } },
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
              PA FLUX pieces are available now. Pick your colour, choose your size, and keep becoming.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/paflux"
                className="focus-ring inline-flex h-12 items-center gap-2 rounded-ui bg-ink px-6 text-sm font-black text-paper transition hover:bg-lava"
              >
                Shop collection
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={toStoreProduct(product)}
                sizes="(min-width: 1280px) 260px, (min-width: 1024px) 30vw, 50vw"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
