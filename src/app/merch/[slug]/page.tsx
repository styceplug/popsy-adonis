import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AddProductToCart } from "@/components/commerce/add-product-to-cart";
import { ProductImageGallery } from "@/components/commerce/product-image-gallery";
import { formatNaira } from "@/lib/format-money";
import { products } from "@/lib/sample-data";

const SITE_URL = "https://popsyadonis.com";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return {
      title: "PA FLUX Product Not Found | Popsy Adonis",
    };
  }

  const title = `${product.name} | PA FLUX`;
  const imageUrl = `${SITE_URL}${product.images[0]}`;

  return {
    title,
    description: product.description,
    alternates: {
      canonical: `/merch/${product.slug}`,
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/merch/${product.slug}`,
      title,
      description: product.description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.description,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) notFound();

  const descriptionParagraphs = product.description.split(/(?<=\.)\s+/).filter(Boolean);

  return (
    <main className="bg-bone pt-24 text-ink">
      <section className="section-shell pt-8">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-ui border border-ink/10">
          <Image
            src="/PA%20FLUX/header.jpeg"
            alt="PA FLUX collection header"
            width={1280}
            height={1280}
            sizes="(min-width: 1024px) 768px, calc(100vw - 32px)"
            className="h-auto w-full"
            priority
          />
        </div>
      </section>

      <section className="section-shell grid gap-10 py-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)] lg:py-14">
        <ProductImageGallery images={product.images} name={product.name} />
        <div className="md:sticky md:top-24 md:self-start">
          <p className="text-xs font-black uppercase text-lava">{product.tag}</p>
          <h1 className="mt-3 font-display text-5xl font-black md:text-7xl">{product.name}</h1>
          <p className="mt-5 text-2xl font-black">{formatNaira(product.priceKobo)}</p>
          <div className="mt-6 grid max-w-md gap-4 text-base leading-7 text-ink/66">
            {descriptionParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <AddProductToCart product={product} />
        </div>
      </section>
    </main>
  );
}
