"use client";

import { useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { brand } from "@/lib/sample-data";
import { ComingSoonModal } from "@/components/commerce/coming-soon-modal";

export default function MerchPage() {
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
            Product listings, variant-aware product pages, side cart, and
            checkout are structured for the {brand.merchName}
            ecommerce flow.
          </p>

          <div className="mt-12 overflow-hidden rounded-2xl border border-gold/20 bg-linear-to-br from-ink/5 to-gold/5 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
                <Sparkles className="h-10 w-10 text-gold" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-gold">
                  Coming Soon
                </p>
                <h2 className="mt-2 font-display text-4xl font-black text-ink md:text-5xl">
                  The Collection Is Loading
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-ink/50">
                {brand.merchName} is currently in production. We're crafting
                premium streetwear that embodies the energy of our community. Be
                the first to know when we drop.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="focus-ring mt-2 inline-flex h-12 items-center gap-2 rounded-ui bg-ink px-6 text-sm font-black text-paper transition hover:bg-lava"
              >
                Get Early Access
                <ArrowUpRight size={17} />
              </button>
              <p className="text-xs text-ink/30">
                No spam. Just the drop date and early access.
              </p>
            </div>
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
