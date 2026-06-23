import Link from "next/link";
import { notFound } from "next/navigation";
import { artists } from "@/lib/sample-data";

export function generateStaticParams() {
  return artists.map((artist) => ({ slug: artist.slug }));
}

export default async function ArtistDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = artists.find((item) => item.slug === slug);

  if (!artist) notFound();

  return (
    <main className="bg-ink pt-24 text-paper">
      <section className="section-shell grid gap-10 py-16 md:grid-cols-[.9fr_1.1fr] md:items-end">
        <div
          className="min-h-[620px] rounded-ui bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(5,5,5,.04), rgba(5,5,5,.5)), url(${artist.image})`,
          }}
        />
        <div>
          <p className="text-xs font-black uppercase text-gold">{artist.role} / {artist.city}</p>
          <h1 className="display-title mt-4 text-6xl md:text-8xl">{artist.name}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/68">{artist.bio}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {artist.genres.map((genre) => (
              <span key={genre} className="rounded-ui border border-white/12 px-3 py-2 text-xs font-black uppercase text-paper/70">
                {genre}
              </span>
            ))}
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {artist.stats.map((stat) => (
              <div key={stat.label} className="rounded-ui border border-white/10 bg-white/[0.035] p-4">
                <p className="font-display text-2xl font-black">{stat.value}</p>
                <p className="mt-1 text-xs uppercase text-paper/50">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {artist.socials.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                className="focus-ring rounded-ui bg-gold px-4 py-3 text-sm font-black text-ink hover:bg-paper"
              >
                {social.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

