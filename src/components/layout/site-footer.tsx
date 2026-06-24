import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SocialLinks } from "@/components/layout/social-links";
import { brand } from "@/lib/sample-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink">
      <div className="section-shell py-14">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.35fr_.65fr_.65fr_.85fr]">
          <div>
            <p className="font-display text-3xl font-black uppercase">{brand.siteName}</p>
            <p className="mt-4 max-w-md text-sm leading-6 text-paper/62">
              Entertainment, artist development, lifestyle events, music promotions, and {brand.merchName} clothing
              for Nigeria&apos;s culture-forward crowd.
            </p>
            <div className="mt-6">
              <SocialLinks socials={brand.socials} />
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase text-gold">Explore</p>
            <div className="mt-4 grid gap-2 text-sm text-paper/62">
              <Link href="/trends" className="hover:text-paper">Trends & Promotions</Link>
              <Link href="/artists" className="hover:text-paper">Artists Catalog</Link>
              <Link href="/events" className="hover:text-paper">Events</Link>
              <Link href="/events/archive" className="hover:text-paper">Past Events</Link>
              <Link href="/merch" className="hover:text-paper">{brand.merchName} Store</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase text-gold">Services</p>
            <div className="mt-4 grid gap-2 text-sm text-paper/62">
              <p>Event hosting</p>
              <p>Artist bookings</p>
              <p>Music promotions</p>
              <p>Brand activations</p>
              <p>Merch drops</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase text-gold">Contact</p>
            <div className="mt-4 grid gap-3 text-sm text-paper/62">
              <Link href={`mailto:${brand.email}`} className="inline-flex items-center gap-2 hover:text-paper">
                <Mail size={15} />
                {brand.email}
              </Link>
              <Link href={`tel:${brand.phone.replaceAll(" ", "")}`} className="inline-flex items-center gap-2 hover:text-paper">
                <Phone size={15} />
                {brand.phone}
              </Link>
              <Link href={brand.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-paper">
                <MessageCircle size={15} />
                WhatsApp bookings
              </Link>
              <p className="inline-flex items-center gap-2">
                <MapPin size={15} />
                {brand.address}
              </p>
            </div>
            <div className="mt-5">
              <SocialLinks socials={brand.socials} compact />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 text-xs text-paper/42">
          <p>© 2026 {brand.siteName}. All rights reserved.</p>
          <p>{brand.merchName} is the official clothing line of {brand.siteName}.</p>
        </div>
      </div>
    </footer>
  );
}
