import type { Metadata } from "next";
import { aboutCopy, brand, songs } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "About Popsy Adonis | EKSU Media, Music & Culture",
  description:
    "Learn about Popsy Adonis, the EKSU-rooted media, music, events, and entertainment platform shaping student culture in Ekiti and beyond.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell grid gap-12 pb-16 md:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase text-gold">Media. Music. EKSU culture.</p>
          <h1 className="display-title mt-4 text-6xl md:text-8xl">{brand.siteName} is a culture engine.</h1>
        </div>
        <div className="grid gap-5 text-lg leading-9 text-paper/68">
          {aboutCopy.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="section-shell pb-20">
        <div className="grid gap-4 md:grid-cols-[1.1fr_.9fr]">
          <div
            className="min-h-[520px] rounded-ui border border-white/10 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(5,5,5,.12), rgba(5,5,5,.82)), url(/EVENTS/EKSU%20FEST%2B400.jpg)",
            }}
          />
          <div className="rounded-ui border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-black uppercase text-gold">Discography</p>
            <h2 className="mt-3 font-display text-4xl font-black md:text-5xl">Songs and collaborations</h2>
            <div className="mt-8 grid gap-3">
              {songs.map((song) => (
                <div key={song.title} className="rounded-ui border border-white/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-display text-2xl font-black">{song.title}</p>
                    <p className="text-xs font-black uppercase text-gold">{song.date}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-paper/62">{song.artists}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
