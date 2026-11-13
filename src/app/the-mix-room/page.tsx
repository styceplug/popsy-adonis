import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail, Mic } from "lucide-react";
import { SocialLinks } from "@/components/layout/social-links";
import { isMixRoomCastingOpen, mixRoom, mixRoomApplyHref, mixRoomCasting } from "@/lib/mix-room";
import { brand } from "@/lib/sample-data";
import { openGraphFor } from "@/lib/seo";

const pageTitle = "THE MIX ROOM Podcast | Popsy Adonis";
const pageDescription = `${mixRoom.tagline} ${mixRoom.description} ${mixRoom.closer}`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/the-mix-room",
  },
  openGraph: openGraphFor({ title: pageTitle, description: pageDescription, path: "/the-mix-room" }),
};

// The casting call closes on a set date, so decide on every visit whether to show it.
export const dynamic = "force-dynamic";

const lime = "text-[#c8f031]";

export default function MixRoomPage() {
  const castingOpen = isMixRoomCastingOpen();

  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_10%,rgba(200,240,49,.14),transparent_45%)]" />
        <div className="section-shell relative pb-16">
          <p className={`inline-flex items-center gap-2 text-xs font-black uppercase ${lime}`}>
            <Mic size={14} />
            {mixRoom.kicker}
          </p>
          <h1 className="display-title mt-4 text-6xl md:text-9xl">{mixRoom.name}</h1>
          <p className="mt-6 text-2xl font-black text-paper/90 md:text-3xl">🎙️ {mixRoom.tagline}</p>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-paper/64">{mixRoom.description}</p>
          <p className={`mt-2 text-lg font-black ${lime}`}>{mixRoom.closer}</p>

          <div className="mt-10 rounded-ui border border-white/10 bg-white/[0.035] p-6">
            {mixRoom.listenLinks.length > 0 ? (
              <>
                <p className={`text-xs font-black uppercase ${lime}`}>Listen and watch</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {mixRoom.listenLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring inline-flex h-11 items-center rounded-ui bg-[#c8f031] px-5 text-sm font-black text-ink transition hover:bg-paper"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className={`text-xs font-black uppercase ${lime}`}>Episodes coming soon</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-paper/62">
                  Follow {brand.siteName} to catch the first episode the moment it drops.
                </p>
                <div className="mt-4">
                  <SocialLinks socials={brand.socials} />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {castingOpen ? (
        <section id="casting" className="scroll-mt-20 border-t border-white/10 py-16">
          <div className="section-shell grid gap-10 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <p className={`text-xs font-black uppercase ${lime}`}>On air · Now casting</p>
              <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">{mixRoomCasting.title}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-paper/64">
                Real people, great conversations, bigger stories. Applications close {mixRoomCasting.deadlineLabel}.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Location", value: mixRoomCasting.location },
                  { label: "Experience", value: mixRoomCasting.experience },
                  { label: "Commitment", value: mixRoomCasting.commitment },
                ].map((item) => (
                  <div key={item.label} className="rounded-ui border border-white/10 bg-white/[0.035] p-4">
                    <p className={`text-xs font-black uppercase ${lime}`}>{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-paper/78">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <p className={`text-xs font-black uppercase ${lime}`}>We&apos;re looking for</p>
                <ul className="mt-3 grid gap-2 text-base leading-7 text-paper/72">
                  {mixRoomCasting.lookingFor.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <p className={`text-xs font-black uppercase ${lime}`}>Audition video</p>
                <p className="mt-3 max-w-2xl text-base leading-7 text-paper/72">{mixRoomCasting.videoNote}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {mixRoomCasting.videoOptions.map((option) => (
                    <div key={option.title} className="rounded-ui border border-[#c8f031]/25 p-4">
                      <p className="font-black">{option.title}</p>
                      <p className="mt-2 text-sm leading-6 text-paper/60">{option.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <p className={`text-xs font-black uppercase ${lime}`}>What to include in your email</p>
                <ul className="mt-3 grid gap-2 text-base leading-7 text-paper/72">
                  {mixRoomCasting.include.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 rounded-ui bg-[#c8f031] p-6 text-ink">
                <p className="text-xs font-black uppercase">Send your application to</p>
                <p className="mt-2 break-all font-display text-3xl font-black md:text-4xl">{mixRoomCasting.email}</p>
                <p className="mt-2 text-sm font-bold">Subject: {mixRoomCasting.emailSubject}</p>
                <a
                  href={mixRoomApplyHref()}
                  className="focus-ring mt-5 inline-flex h-12 items-center gap-2 rounded-ui bg-ink px-5 text-sm font-black text-paper transition hover:bg-coal"
                >
                  <Mail size={17} />
                  Email your application
                </a>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="relative aspect-[2/3] overflow-hidden rounded-ui border border-white/10">
                <Image
                  src={mixRoomCasting.flyer}
                  alt={`${mixRoomCasting.title} flyer`}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-shell border-t border-white/10 py-14">
        <p className="text-sm text-paper/60">
          For sponsorship, guest features and collaborations, reach {brand.siteName} on{" "}
          <Link href="/contact" className="font-black text-paper hover:text-gold">
            the contact page
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
