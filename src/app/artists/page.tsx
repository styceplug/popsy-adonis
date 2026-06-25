import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { artists, brand } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Artists Catalog | Popsy Adonis",
  description:
    "Explore the Popsy Adonis artists catalog: musicians, performers, DJs, collaborators, and campus culture talent available for bookings and promotions.",
  alternates: {
    canonical: "/artists",
  },
};

export default function ArtistsPage() {
  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell pb-20">
        <p className="text-xs font-black uppercase text-gold">Artist portfolio</p>
        <h1 className="display-title mt-4 max-w-5xl text-6xl md:text-8xl">Artists Catalog</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/64">
          A curated portfolio for {brand.siteName} talent, DJs, performers, and collaborators available for events,
          campaigns, releases, and brand activations.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {artists.map((artist) => (
            <Link
              key={artist.slug}
              href={`/artists/${artist.slug}`}
              className="group overflow-hidden rounded-ui border border-white/10 bg-white/[0.035] transition hover:border-gold"
            >
              <div
                className="min-h-[390px] bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(5,5,5,.04), rgba(5,5,5,.64)), url(${artist.image})`,
                }}
              />
              <div className="p-5">
                <p className="text-xs font-black uppercase text-gold">{artist.role}</p>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <h2 className="font-display text-3xl font-black">{artist.name}</h2>
                  <ArrowUpRight className="mt-1 text-paper/45 group-hover:text-gold" size={18} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-paper/62">{artist.bio}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
