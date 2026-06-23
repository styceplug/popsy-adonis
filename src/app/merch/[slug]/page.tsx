import { notFound } from "next/navigation";
import { AddProductToCart } from "@/components/commerce/add-product-to-cart";
import { formatNaira } from "@/lib/format-money";
import { products } from "@/lib/sample-data";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) notFound();

  return (
    <main className="bg-bone pt-24 text-ink">
      <section className="section-shell grid gap-8 py-16 md:grid-cols-[1.05fr_.95fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {product.images.map((image) => (
            <div
              key={image}
              className="min-h-[520px] rounded-ui bg-cover bg-center"
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
        </div>
        <div className="md:sticky md:top-24 md:self-start">
          <p className="text-xs font-black uppercase text-lava">{product.tag}</p>
          <h1 className="mt-3 font-display text-5xl font-black md:text-7xl">{product.name}</h1>
          <p className="mt-5 text-2xl font-black">{formatNaira(product.priceKobo)}</p>
          <p className="mt-5 max-w-md text-lg leading-8 text-ink/66">{product.description}</p>
          <AddProductToCart product={product} />
        </div>
      </section>
    </main>
  );
}
