import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mic } from "lucide-react";
import { isMixRoomCastingOpen, mixRoom, mixRoomApplyHref, mixRoomCasting } from "@/lib/mix-room";

/** Homepage section for THE MIX ROOM podcast, with the hosts casting call while it is open. */
export function MixRoomFeature() {
  const castingOpen = isMixRoomCastingOpen();

  return (
    <section className="relative overflow-hidden bg-coal py-20 text-paper">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(200,240,49,.12),transparent_40%)]" />
      <div className="section-shell relative grid gap-10 md:grid-cols-[1.1fr_.9fr] md:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#c8f031]">
            <Mic size={14} />
            {mixRoom.kicker}
          </p>
          <h2 className="mt-4 font-display text-5xl font-black leading-none md:text-7xl">{mixRoom.name}</h2>
          <p className="mt-5 text-xl font-black text-paper/85">{mixRoom.tagline}</p>
          <p className="mt-3 max-w-lg text-base leading-7 text-paper/62">
            {mixRoom.description} {mixRoom.closer}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/the-mix-room"
              className="focus-ring inline-flex h-12 items-center gap-2 rounded-ui bg-[#c8f031] px-5 text-sm font-black text-ink transition hover:bg-paper"
            >
              Enter the room
              <ArrowUpRight size={17} />
            </Link>
            {castingOpen ? (
              <a
                href={mixRoomApplyHref()}
                className="focus-ring inline-flex h-12 items-center gap-2 rounded-ui border border-white/18 px-5 text-sm font-bold text-paper transition hover:border-[#c8f031] hover:text-[#c8f031]"
              >
                Apply to host
              </a>
            ) : null}
          </div>
        </div>

        {castingOpen ? (
          <Link
            href="/the-mix-room#casting"
            className="group grid gap-4 rounded-ui border border-[#c8f031]/30 bg-ink/60 p-4 transition hover:border-[#c8f031] sm:grid-cols-[180px_1fr] sm:items-center"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-ui">
              <Image src={mixRoomCasting.flyer} alt={mixRoomCasting.title} fill sizes="180px" className="object-cover" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-[#c8f031]">Now casting</p>
              <p className="mt-2 font-display text-2xl font-black">{mixRoomCasting.title}</p>
              <p className="mt-2 text-sm leading-6 text-paper/62">
                Based in {mixRoomCasting.location}. No experience needed. Send a 30–90s audition video by{" "}
                {mixRoomCasting.deadlineLabel}.
              </p>
              <p className="mt-3 text-sm font-bold text-paper/80 group-hover:text-[#c8f031]">See how to apply</p>
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
