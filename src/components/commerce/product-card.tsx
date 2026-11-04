import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/sample-data";
import { formatNaira } from "@/lib/format-money";
import { getAvailableSizes, getPriceRange, getStockState, splitProductName } from "@/lib/product-display";

type ProductCardProps = {
  product: Product;
  /** Passed to next/image so the browser downloads the right size for the grid it sits in. */
  sizes?: string;
  priority?: boolean;
};

export function ProductCard({
  product,
  sizes = "(min-width: 1280px) 400px, (min-width: 768px) 33vw, 50vw",
  priority = false,
}: ProductCardProps) {
  const { family, variant } = splitProductName(product.name);
  const { fromKobo, varies } = getPriceRange(product);
  const stock = getStockState(product);
  const availableSizes = getAvailableSizes(product);
  const [frontImage, backImage] = product.images;

  return (
    <Link href={`/paflux/${product.slug}`} className="focus-ring group block rounded-ui">
      <div className="relative aspect-square overflow-hidden rounded-ui border border-ink/10 bg-white">
        {frontImage ? (
          <Image
            src={frontImage}
            alt={product.name}
            fill
            sizes={sizes}
            loading={priority ? "eager" : "lazy"}
            className={`object-contain transition duration-500 group-hover:scale-[1.03] ${
              backImage ? "group-hover:opacity-0" : ""
            } ${stock === "sold-out" ? "opacity-50" : ""}`}
          />
        ) : null}
        {backImage ? (
          <Image
            src={backImage}
            alt=""
            aria-hidden
            fill
            sizes={sizes}
            className="object-contain opacity-0 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
          />
        ) : null}
        {stock !== "in-stock" ? (
          <span
            className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-black uppercase sm:left-3 sm:top-3 ${
              stock === "sold-out" ? "bg-ink text-paper" : "bg-lava text-paper"
            }`}
          >
            {stock === "sold-out" ? "Sold out" : "Almost gone"}
          </span>
        ) : null}
      </div>

      <div className="mt-3 px-0.5">
        {variant ? <p className="truncate text-[11px] font-black uppercase text-ink/45">{family}</p> : null}
        <div className="mt-0.5 flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <h3 className="font-display text-base font-black leading-tight text-ink transition group-hover:text-lava sm:text-lg">
            {variant ?? product.name}
          </h3>
          <p className="whitespace-nowrap text-sm font-black text-ink/80">
            {varies ? "From " : ""}
            {formatNaira(fromKobo)}
          </p>
        </div>
        {availableSizes.length > 0 ? (
          <p className="mt-1 text-xs font-bold text-ink/45">{availableSizes.join(" · ")}</p>
        ) : null}
      </div>
    </Link>
  );
}
