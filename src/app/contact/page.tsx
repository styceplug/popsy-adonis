import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { brand } from "@/lib/sample-data";

export default function ContactPage() {
  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell grid gap-12 pb-20 md:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase text-gold">Contact us</p>
          <h1 className="display-title mt-4 text-6xl md:text-8xl">Book the room. Build the drop.</h1>
          <div className="mt-8 grid gap-3 text-sm text-paper/68">
            <Link href={`mailto:${brand.email}`} className="inline-flex items-center gap-2 hover:text-paper">
              <Mail size={16} />
              {brand.email}
            </Link>
            <Link href={`tel:${brand.phone.replaceAll(" ", "")}`} className="inline-flex items-center gap-2 hover:text-paper">
              <Phone size={16} />
              {brand.phone}
            </Link>
            <p className="inline-flex items-center gap-2">
              <MapPin size={16} />
              {brand.address}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {brand.socials.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                className="focus-ring rounded-ui border border-white/12 px-3 py-2 text-xs font-black uppercase text-paper/70 hover:border-gold hover:text-gold"
              >
                {social.label}
              </Link>
            ))}
          </div>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
