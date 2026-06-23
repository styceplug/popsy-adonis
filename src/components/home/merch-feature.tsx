"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { brand, products } from "@/lib/sample-data";
import { ProductCard } from "@/components/commerce/product-card";
import { ComingSoonModal } from "@/components/commerce/coming-soon-modal";

export function MerchFeature() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShopClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <section className="bg-bone py-20 text-ink">
        <div className="section-shell">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase text-lava">
                {brand.merchName} clothing line
              </p>
              <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">
                Streetwear with access energy.
              </h2>
            </div>
            <Link
              href="/merch"
              onClick={handleShopClick}
              className="focus-ring inline-flex h-11 items-center gap-2 rounded-ui bg-ink px-4 text-sm font-black text-paper transition hover:bg-lava"
            >
              Shop {brand.merchName}
              <ArrowUpRight size={17} />
            </Link>
          </div>

          <div className="relative">
            <div className="grid gap-4 md:grid-cols-3">
              {products.map((product) => (
                <div key={product.slug} className="**:text-inherit">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink/90 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
                  <Sparkles className="h-8 w-8 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-gold">
                    Coming Soon
                  </p>
                  <h3 className="mt-1 font-display text-3xl font-black text-paper">
                    The Drop Is Loading
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="focus-ring mt-2 inline-flex h-11 items-center gap-2 rounded-ui bg-gold px-6 text-sm font-black text-ink transition hover:bg-paper"
                >
                  Get Notified
                  <ArrowUpRight size={17} />
                </button>
                <p className="max-w-xs text-xs text-paper/50">
                  Our exclusive collection is being crafted. Sign up for early
                  access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ComingSoonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
