import { ProductCard } from "@/components/commerce/product-card";
import { brand, products } from "@/lib/sample-data";

export default function MerchPage() {
  return (
    <main className="bg-bone pt-28 text-ink">
      <section className="section-shell pb-20">
        <p className="text-xs font-black uppercase text-lava">Exclusive clothing line</p>
        <h1 className="display-title mt-4 max-w-4xl text-6xl md:text-8xl">{brand.merchName}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/62">
          Product listings, variant-aware product pages, side cart, and checkout are structured for the {brand.merchName}
          ecommerce flow.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <div key={product.slug} className="[&_*]:text-inherit">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
