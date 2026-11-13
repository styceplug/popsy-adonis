import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { pafluxGallery, pafluxGalleryHighlights, pafluxGalleryPhotos } from "@/lib/paflux-gallery";

export function PaFluxGalleryTeaser() {
  return (
    <section className="bg-ink py-20 text-paper">
      <div className="section-shell">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase text-gold">PA FLUX gallery · {pafluxGallery.title}</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-black md:text-6xl">{pafluxGallery.tagline}</h2>
          </div>
          <Link
            href="/paflux#gallery"
            className="focus-ring inline-flex h-12 items-center gap-2 self-start rounded-ui border border-white/18 px-5 text-sm font-black text-paper transition hover:border-gold hover:text-gold md:self-end"
          >
            View all {pafluxGalleryPhotos.length} photos
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {pafluxGalleryHighlights.map((photo, index) => (
            <Link
              key={photo.src}
              href="/paflux#gallery"
              className={`group relative overflow-hidden rounded-ui bg-white/5 ${
                index === 0 ? "aspect-[3/4] md:row-span-2 md:aspect-auto" : "aspect-[3/4]"
              } ${index === 6 ? "hidden md:block" : ""}`}
            >
              <Image
                src={photo.src}
                alt={`${pafluxGallery.title} lookbook photo`}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
