import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { brand } from "@/lib/sample-data";

export function HeroShowcase() {
  return (
    <section className="image-grain relative min-h-[92vh] overflow-hidden pt-24">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/hero-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,.98)_0%,rgba(5,5,5,.72)_42%,rgba(5,5,5,.36)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(200,162,74,.2),transparent_34%)]" />
      <div className="section-shell relative flex min-h-[calc(92vh-6rem)] items-end pb-14">
        <div className="grid w-full gap-8 md:grid-cols-[1.15fr_.85fr] md:items-end">
          <div>
            <p className="mb-5 inline-flex rounded-ui border border-white/14 px-3 py-1 text-xs font-bold uppercase text-gold">
              Pop culture. Artists. Events. {brand.merchName}.
            </p>
            <h1 className="display-title max-w-4xl text-6xl text-paper sm:text-7xl lg:text-8xl">
              {brand.siteName} moves the room before the lights come on.
            </h1>
          </div>
          <div className="max-w-md md:justify-self-end">
            <p className="text-lg leading-8 text-paper/72">
              A Nigerian entertainment and lifestyle agency pushing trends, artist development, premium event hosting,
              and exclusive {brand.merchName} drops.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/events"
                className="focus-ring inline-flex h-12 items-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink transition hover:bg-paper"
              >
                <CalendarDays size={17} />
                View Events
              </Link>
              <Link
                href="/trends"
                className="focus-ring inline-flex h-12 items-center gap-2 rounded-ui border border-white/18 px-5 text-sm font-bold text-paper transition hover:border-paper"
              >
                Read Trends
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
