"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { pafluxGallery, pafluxGalleryPhotos } from "@/lib/paflux-gallery";

const INITIAL_COUNT = 12;

/** The full PA FLUX lookbook: a photo grid that opens each shot in a full-screen viewer. */
export function PaFluxGallery() {
  const [showAll, setShowAll] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const photos = showAll ? pafluxGalleryPhotos : pafluxGalleryPhotos.slice(0, INITIAL_COUNT);
  const total = pafluxGalleryPhotos.length;

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => setOpenIndex((index) => (index === null ? null : (index + delta + total) % total)),
    [total],
  );

  useEffect(() => {
    if (openIndex === null) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [openIndex, close, step]);

  const openPhoto = openIndex === null ? null : pafluxGalleryPhotos[openIndex];

  return (
    <section id="gallery" className="scroll-mt-20 bg-ink py-20 text-paper">
      <div className="section-shell">
        <div className="grid gap-6 border-b border-white/10 pb-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase text-gold">PA FLUX gallery · {pafluxGallery.title}</p>
            <h2 className="mt-4 max-w-3xl font-display text-5xl font-black leading-none md:text-7xl">
              {pafluxGallery.tagline}
            </h2>
          </div>
          <p className="text-xs font-black uppercase text-paper/45 md:pb-2 md:text-right">
            {total} photos · {pafluxGallery.credit}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setOpenIndex(index)}
              className="focus-ring group relative aspect-[3/4] overflow-hidden rounded-ui bg-white/5"
              aria-label={`Open photo ${index + 1} of ${total}`}
            >
              <Image
                src={photo.src}
                alt={`${pafluxGallery.title} lookbook photo ${index + 1}`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            </button>
          ))}
        </div>

        {!showAll && total > INITIAL_COUNT ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="focus-ring inline-flex h-12 items-center rounded-ui border border-white/18 px-6 text-sm font-black text-paper transition hover:border-gold hover:text-gold"
            >
              Show all {total} photos
            </button>
          </div>
        ) : null}
      </div>

      {openPhoto && openIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${pafluxGallery.title} photo ${openIndex + 1} of ${total}`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4"
          onClick={close}
        >
          <div className="relative h-full max-h-[92vh] w-full max-w-[52vh]" onClick={(event) => event.stopPropagation()}>
            <Image
              src={openPhoto.src}
              alt={`${pafluxGallery.title} lookbook photo ${openIndex + 1}`}
              fill
              sizes="52vh"
              className="object-contain"
              loading="eager"
            />
          </div>
          <p className="absolute left-4 top-4 text-xs font-black uppercase text-paper/60">
            {openIndex + 1} / {total}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="focus-ring absolute right-4 top-4 grid size-11 place-items-center rounded-ui border border-white/15 text-paper transition hover:border-gold hover:text-gold"
          >
            <X size={20} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
            className="focus-ring absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-ui border border-white/15 bg-ink/60 text-paper transition hover:border-gold hover:text-gold"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
            className="focus-ring absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-ui border border-white/15 bg-ink/60 text-paper transition hover:border-gold hover:text-gold"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
