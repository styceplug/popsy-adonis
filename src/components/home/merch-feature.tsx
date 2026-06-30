import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { brand, products } from "@/lib/sample-data";

export function MerchFeature() {
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
              The first PA FLUX tees are available now: The Becoming in white and The Beginning in black. Pick your chapter, choose your size, and move.
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

          <div className="grid gap-5 md:grid-cols-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
