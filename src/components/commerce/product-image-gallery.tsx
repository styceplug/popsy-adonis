"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ProductImageGalleryProps = {
  images: string[];
  name: string;
};

// Swipe between photos on phones; arrows and thumbnails on larger screens.
export function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = images.length;

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track || count === 0) return;
    const next = (index + count) % count;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    setActiveIndex(next);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== activeIndex) setActiveIndex(index);
  }

  if (count === 0) {
    return <div className="aspect-square rounded-ui border border-ink/10 bg-white" role="img" aria-label={name} />;
  }

  return (
    <div className="grid gap-3">
      <div className="group relative overflow-hidden rounded-ui border border-ink/10 bg-white">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <div key={image} className="relative aspect-square w-full shrink-0 snap-center">
              <Image
                src={image}
                alt={`${name}, photo ${index + 1} of ${count}`}
                fill
                sizes="(min-width: 1280px) 640px, (min-width: 1024px) 52vw, 100vw"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                className="object-contain"
              />
            </div>
          ))}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous photo"
              className="focus-ring absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-ink/10 bg-paper/90 text-ink opacity-0 shadow-sm transition hover:bg-ink hover:text-paper focus-visible:opacity-100 group-hover:opacity-100 md:grid"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next photo"
              className="focus-ring absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-ink/10 bg-paper/90 text-ink opacity-0 shadow-sm transition hover:bg-ink hover:text-paper focus-visible:opacity-100 group-hover:opacity-100 md:grid"
            >
              <ChevronRight size={20} />
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
              {images.map((image, index) => (
                <span
                  key={image}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? "w-5 bg-ink" : "w-1.5 bg-ink/25"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="hidden grid-cols-5 gap-2 md:grid">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`focus-ring relative aspect-square overflow-hidden rounded-ui border bg-white transition ${
                activeIndex === index ? "border-ink ring-2 ring-ink/20" : "border-ink/10 opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={image} alt="" fill sizes="120px" className="object-contain" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
