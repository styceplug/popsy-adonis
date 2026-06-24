"use client";

import { useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { brand } from "@/lib/sample-data";
import { ComingSoonModal } from "@/components/commerce/coming-soon-modal";

export function MerchFeature() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="bg-bone py-24 text-ink overflow-hidden">
        <div className="section-shell">
          <div className="flex flex-col items-center text-center gap-8">
            {/* Eyebrow */}
            <p className="text-xs font-black uppercase tracking-widest text-lava">
              {brand.merchName} clothing line
            </p>

            {/* Heading */}
            <h2 className="font-display text-5xl font-black md:text-7xl max-w-2xl leading-none">
              Campus heat. Culture uniform.
            </h2>

            {/* Animated icon lockup */}
            <div className="relative my-4 flex items-center justify-center">
              {/* Outer slow-rotating ring */}
              <div className="absolute h-28 w-28 rounded-full border border-ink/10 animate-spin" style={{ animationDuration: "12s" }} />
              {/* Dashed middle ring */}
              <div
                className="absolute h-20 w-20 rounded-full border border-dashed border-ink/15 animate-spin"
                style={{ animationDuration: "8s", animationDirection: "reverse" }}
              />
              {/* Gold accent ring with gap */}
              <div className="absolute h-36 w-36 rounded-full border border-gold/20" />
              {/* Core icon */}
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink shadow-md">
                <Sparkles className="h-7 w-7 text-gold animate-spin-slow" />
              </div>
            </div>

            {/* Coming soon badge + text */}
            <div className="flex flex-col items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                Coming Soon
              </span>
              <p className="max-w-sm text-sm leading-7 text-ink/55">
                The first drop is being shaped for the people who move the room. Sign up to know when{" "}
                <span className="font-bold text-ink">{brand.merchName}</span> lands.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="focus-ring inline-flex h-12 items-center gap-2 rounded-ui bg-ink px-6 text-sm font-black text-paper transition hover:bg-lava active:scale-95"
            >
              Get Early Access
              <ArrowUpRight size={17} />
            </button>

            {/* Stat pills */}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {[
                { label: "Limited drops", sub: "Exclusive quantities" },
                { label: "Premium quality", sub: "Built for Adonites" },
                { label: "Q2 2026", sub: "Launching soon" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-ui border border-ink/8 bg-paper/60 px-4 py-3 text-left"
                >
                  <p className="text-xs font-black text-ink">{item.label}</p>
                  <p className="mt-0.5 text-xs text-ink/45">{item.sub}</p>
                </div>
              ))}
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
