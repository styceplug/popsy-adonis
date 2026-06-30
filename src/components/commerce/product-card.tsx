import Link from "next/link";
import type { Product } from "@/lib/sample-data";
import { formatNaira } from "@/lib/format-money";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/merch/${product.slug}`} className="group block overflow-hidden rounded-ui border border-ink/10 bg-ink text-paper">
      <div
        className="min-h-[340px] bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${product.images[0]})` }}
      />
      <div className="p-5">
        <p className="text-xs font-black uppercase text-gold">{product.tag}</p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h3 className="font-display text-2xl font-black text-paper">{product.name}</h3>
          <p className="whitespace-nowrap text-sm font-black text-paper/72">{formatNaira(product.priceKobo)}</p>
        </div>
      </div>
    </Link>
  );
}
