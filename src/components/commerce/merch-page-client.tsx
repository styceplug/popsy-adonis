"use client";

import { useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import { ComingSoonModal } from "@/components/commerce/coming-soon-modal";
import { ProductCard } from "@/components/commerce/product-card";
import { brand, type Product } from "@/lib/sample-data";

export function MerchPageClient({ products }: { products: Product[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <main className="bg-bone pt-28 text-ink">
        <section className="section-shell pb-20">
          <div className="grid gap-6 border-b border-ink/10 pb-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-xs font-black uppercase text-lava">Exclusive clothing line</p>
              <h1 className="display-title mt-4 text-6xl md:text-8xl">{brand.merchName}</h1>
            </div>
            <div className="max-w-sm md:pb-2 md:text-right">
              <p className="text-base leading-7 text-ink/62">
                Streetwear from Popsy Adonis. Pick your colour, choose your size, and stay in flux.
              </p>
              {products.length > 0 ? (
                <p className="mt-2 text-xs font-black uppercase text-ink/40">
                  {products.length} {products.length === 1 ? "piece" : "pieces"} available
                </p>
              ) : null}
            </div>
          </div>

          {products.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-ui border border-dashed border-ink/20 px-6 py-16 text-center">
              <p className="font-display text-3xl font-black">New pieces are on the way</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/60">
                The last drop has sold through. Join the list below to hear first when the next one lands.
              </p>
            </div>
          )}

          <div className="mt-16 rounded-ui border border-ink/10 bg-ink p-6 text-paper md:flex md:items-center md:justify-between md:gap-8">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-ui bg-gold/15 text-gold">
                <Mail size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-gold">PA FLUX newsletter</p>
                <h2 className="mt-2 font-display text-3xl font-black">Stay close to the next drop</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-paper/58">
                  Subscribers get release notes, restock alerts, and early access to new pieces.
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

      <ComingSoonModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
