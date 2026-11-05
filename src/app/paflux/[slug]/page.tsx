import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { AddProductToCart } from "@/components/commerce/add-product-to-cart";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductImageGallery } from "@/components/commerce/product-image-gallery";
import { formatNaira } from "@/lib/format-money";
import { getPriceRange, getStockState, parseDescription, splitProductName } from "@/lib/product-display";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/sample-data";
import { openGraphFor } from "@/lib/seo";
import { toStoreProduct } from "@/lib/store-products";

const SITE_URL = "https://popsyadonis.com";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getActiveProduct(slug);

  if (!product) {
    return { title: "PA FLUX Product Not Found | Popsy Adonis" };
  }

  const title = `${product.name} | PA FLUX`;
  const description = summarise(product.description);

  return {
    title,
    description,
    alternates: { canonical: `/paflux/${product.slug}` },
    // The card is drawn by ./opengraph-image.tsx: photo, name, colour and price at 1200x630.
    openGraph: openGraphFor({
      title,
      description,
      path: `/paflux/${product.slug}`,
      image: { url: `/paflux/${product.slug}/opengraph-image`, width: 1200, height: 630, alt: product.name },
    }),
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getActiveProduct(slug);

  // Archived or unknown pieces (old links, past drops) go back to the store instead of a dead end.
  if (!product) redirect("/paflux");

  const { family, variant } = splitProductName(product.name);
  const { fromKobo, varies } = getPriceRange(product);
  const blocks = parseDescription(product.description);
  const soldOut = getStockState(product) === "sold-out";

  const storeProducts = (
    await prisma.product.findMany({
      where: { status: "ACTIVE", variants: { some: {} } },
      include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } },
      orderBy: { createdAt: "asc" },
    })
  ).map(toStoreProduct);
  // Colourways are separate products that share a name before the " - ".
  const colourways = variant ? storeProducts.filter((item) => splitProductName(item.name).family === family) : [];
  const hasColourways = colourways.length > 1;
  const moreFromStore = storeProducts
    .filter((item) => item.id !== product.id && !colourways.some((colourway) => colourway.id === item.id))
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: summarise(product.description),
    image: product.images.map((image) => `${SITE_URL}${image}`),
    brand: { "@type": "Brand", name: "PA FLUX" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/paflux/${product.slug}`,
      priceCurrency: "NGN",
      price: (fromKobo / 100).toFixed(2),
      availability: soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <main className="bg-bone pb-20 pt-24 text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="section-shell pt-6">
        <Link
          href="/paflux"
          className="focus-ring inline-flex items-center gap-2 rounded-ui text-xs font-black uppercase text-ink/55 transition hover:text-lava"
        >
          <ArrowLeft size={15} />
          PA FLUX store
        </Link>
      </div>

      <section className="section-shell grid gap-8 pt-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)] lg:gap-14">
        <ProductImageGallery key={product.slug} images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-black uppercase text-lava">{product.tag}</p>
          <h1 className="mt-2 font-display text-4xl font-black leading-[0.95] md:text-5xl">{variant ? family : product.name}</h1>
          {variant ? <p className="mt-2 text-lg font-bold text-ink/60">{variant}</p> : null}
          <p className="mt-5 text-2xl font-black">
            {varies ? "From " : ""}
            {formatNaira(fromKobo)}
          </p>

          {hasColourways ? (
            <div className="mt-8">
              <p className="text-sm font-black uppercase">
                Colour <span className="ml-1 font-bold normal-case text-ink/55">{variant}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colourways.map((item) => {
                  const isCurrent = item.id === product.id;
                  const label = splitProductName(item.name).variant ?? item.name;
                  const itemSoldOut = getStockState(item) === "sold-out";
                  return (
                    <Link
                      key={item.id}
                      href={`/paflux/${item.slug}`}
                      aria-current={isCurrent ? "page" : undefined}
                      aria-label={itemSoldOut ? `${label}, sold out` : label}
                      title={label}
                      className={`focus-ring relative size-16 overflow-hidden rounded-ui border bg-white transition ${
                        isCurrent ? "border-ink ring-2 ring-ink" : "border-ink/12 hover:border-ink/60"
                      } ${itemSoldOut ? "opacity-40" : ""}`}
                    >
                      {item.images[0] ? (
                        <Image src={item.images[0]} alt="" fill sizes="64px" className="object-contain p-1" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          <AddProductToCart key={product.slug} product={product} showColorPicker={!hasColourways} />

          <p className="mt-4 flex items-center gap-2 text-xs font-bold text-ink/45">
            <Lock size={13} />
            Secure payment with Paystack
          </p>

          {blocks.length > 0 ? (
            <div className="mt-10 border-t border-ink/10 pt-8">
              {blocks.map((block, index) => {
                if (block.type === "heading") {
                  return (
                    <h2 key={index} className="mt-8 text-xs font-black uppercase text-lava first:mt-0">
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === "list") {
                  return (
                    <ul key={index} className="mt-4 grid gap-2.5 first:mt-0">
                      {block.items.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-6 text-ink/72">
                          <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-lava" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={index} className="mt-4 text-base leading-7 text-ink/68 first:mt-0">
                    {block.text}
                  </p>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      {moreFromStore.length > 0 ? (
        <section className="section-shell mt-20 border-t border-ink/10 pt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-black">More from PA FLUX</h2>
            <Link href="/paflux" className="focus-ring rounded-ui text-sm font-black text-lava hover:text-ink">
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {moreFromStore.map((item) => (
              <ProductCard key={item.id} product={item} sizes="(min-width: 1280px) 300px, (min-width: 768px) 25vw, 50vw" />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

async function getActiveProduct(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } },
  });

  if (!product || product.status !== "ACTIVE" || product.variants.length === 0) return null;
  return toStoreProduct(product);
}

/** First paragraph of the description, for search results and link previews. */
function summarise(description: string) {
  const firstParagraph = parseDescription(description).find((block) => block.type === "paragraph");
  const text = firstParagraph?.type === "paragraph" ? firstParagraph.text : description;
  return text.length > 200 ? `${text.slice(0, 197).trimEnd()}...` : text;
}
