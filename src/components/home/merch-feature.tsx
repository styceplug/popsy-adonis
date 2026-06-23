import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { brand, products } from "@/lib/sample-data";
import { ProductCard } from "@/components/commerce/product-card";

export function MerchFeature() {
  return (
    <section className="bg-bone py-20 text-ink">
      <div className="section-shell">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase text-lava">{brand.merchName} clothing line</p>
            <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">Streetwear with access energy.</h2>
          </div>
          <Link
            href="/merch"
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-ui bg-ink px-4 text-sm font-black text-paper transition hover:bg-lava"
          >
            Shop {brand.merchName}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <div key={product.slug} className="[&_*]:text-inherit">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
