import type { Prisma } from "@prisma/client";
import type { Product } from "@/lib/sample-data";

type ProductWithVariants = Prisma.ProductGetPayload<{ include: { variants: true } }>;

/** Shapes a database product (with its variants, ordered) into what the store components render. */
export function toStoreProduct(product: ProductWithVariants): Product {
  const firstVariant = product.variants[0];

  return {
    id: product.id,
    defaultVariantId: firstVariant?.id ?? "",
    name: product.name,
    slug: product.slug,
    description: product.description,
    priceKobo: firstVariant?.priceKobo ?? 0,
    images: product.images,
    colors: [...new Set(product.variants.map((variant) => variant.color).filter(Boolean))] as string[],
    sizes: sortSizes([...new Set(product.variants.map((variant) => variant.size).filter(Boolean))] as string[]),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size ?? "",
      color: variant.color ?? "",
      priceKobo: variant.priceKobo,
      stock: variant.stock,
    })),
    tag: "PA FLUX",
  };
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL"];

// Variants come back sorted alphabetically (L, XL, XXL happens to work, but S, M, L would not).
function sortSizes(sizes: string[]) {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.toUpperCase());
    const bi = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ai === -1 && bi === -1) return a.localeCompare(b, undefined, { numeric: true });
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}
