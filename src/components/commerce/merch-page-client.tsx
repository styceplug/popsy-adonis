"use client";

import { useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import { ComingSoonModal } from "@/components/commerce/coming-soon-modal";
import { ProductCard } from "@/components/commerce/product-card";
import { brand } from "@/lib/sample-data";
import { products } from "@/lib/sample-data";

export function MerchPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <main className="bg-bone pt-28 text-ink">
        <section className="section-shell pb-20">
          <p className="text-xs font-black uppercase text-lava">
            Exclusive clothing line
          </p>
          <h1 className="display-title mt-4 max-w-4xl text-6xl md:text-8xl">
            {brand.merchName}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/62">
            The first PA FLUX drop is live. Two tees, two chapters, one reminder:
            stay in flux and keep evolving.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-12 rounded-ui border border-ink/10 bg-ink p-6 text-paper md:flex md:items-center md:justify-between md:gap-8">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-ui bg-gold/15 text-gold">
                <Mail size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-gold">PA FLUX newsletter</p>
                <h2 className="mt-2 font-display text-3xl font-black">Stay close to the next drop</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-paper/58">
                  The store is live, but subscribers still get future release notes, restock alerts, and early access updates.
                </p>
              </div>
            </div>
              <button
                onClick={() => setIsModalOpen(true)}
              className="focus-ring mt-5 inline-flex h-12 shrink-0 items-center gap-2 rounded-ui bg-gold px-6 text-sm font-black text-ink transition hover:bg-paper md:mt-0"
              >
                Join newsletter
                <ArrowUpRight size={17} />
              </button>
          </div>
        </section>
      </main>

      <ComingSoonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
