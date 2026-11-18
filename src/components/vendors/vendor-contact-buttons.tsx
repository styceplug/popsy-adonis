import { AtSign, Globe, Mail, MessageCircle, Phone } from "lucide-react";
import { instagramHref, instagramLabel, telHref, websiteHref, whatsappHref } from "@/lib/vendors";

type Contacts = {
  name: string;
  whatsapp: string | null;
  phone: string | null;
  instagram: string | null;
  email: string | null;
  website: string | null;
};

const primary =
  "focus-ring inline-flex h-11 items-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink transition hover:bg-paper";
const secondary =
  "focus-ring inline-flex h-11 items-center gap-2 rounded-ui border border-white/14 px-4 text-sm font-black text-paper/80 transition hover:border-gold hover:text-gold";

export function VendorContactButtons({ vendor }: { vendor: Contacts }) {
  const greeting = encodeURIComponent(`Hi ${vendor.name}, I found you on Popsy Adonis approved vendors.`);

  return (
    <div className="flex flex-wrap gap-3">
      {vendor.whatsapp ? (
        <a href={`${whatsappHref(vendor.whatsapp)}?text=${greeting}`} target="_blank" rel="noreferrer" className={primary}>
          <MessageCircle size={16} /> WhatsApp
        </a>
      ) : null}
      {vendor.phone ? (
        <a href={telHref(vendor.phone)} className={vendor.whatsapp ? secondary : primary}>
          <Phone size={16} /> Call
        </a>
      ) : null}
      {vendor.instagram ? (
        <a href={instagramHref(vendor.instagram)} target="_blank" rel="noreferrer" className={secondary}>
          <AtSign size={16} /> {instagramLabel(vendor.instagram)}
        </a>
      ) : null}
      {vendor.email ? (
        <a href={`mailto:${vendor.email}`} className={secondary}>
          <Mail size={16} /> Email
        </a>
      ) : null}
      {vendor.website ? (
        <a href={websiteHref(vendor.website)} target="_blank" rel="noreferrer" className={secondary}>
          <Globe size={16} /> Website
        </a>
      ) : null}
    </div>
  );
}
