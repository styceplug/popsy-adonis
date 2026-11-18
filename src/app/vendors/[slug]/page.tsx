import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, MapPin } from "lucide-react";
import { VendorContactButtons } from "@/components/vendors/vendor-contact-buttons";
import { prisma } from "@/lib/prisma";
import { openGraphFor } from "@/lib/seo";
import { videoPosterUrl } from "@/lib/vendors";

export const dynamic = "force-dynamic";

async function getVendor(slug: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { slug },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
  return vendor?.isActive ? vendor : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendor(slug);
  if (!vendor) return { title: "Vendor not found | Popsy Adonis" };

  const title = `${vendor.name}, ${vendor.category} | Popsy Adonis Approved Vendors`;
  const description = (vendor.tagline || vendor.description).replace(/\s+/g, " ").slice(0, 200);
  const cover = vendor.media.find((item) => item.type === "image")?.url ?? vendor.logoUrl;

  return {
    title,
    description,
    alternates: { canonical: `/vendors/${vendor.slug}` },
    openGraph: openGraphFor({
      title,
      description,
      path: `/vendors/${vendor.slug}`,
      ...(cover ? { image: { url: cover, alt: vendor.name } } : {}),
    }),
  };
}

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await getVendor(slug);
  if (!vendor) notFound();

  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell pb-10">
        <Link href="/vendors" className="inline-flex items-center gap-2 text-sm font-bold text-paper/60 hover:text-paper">
          <ArrowLeft size={16} /> All approved vendors
        </Link>

        <div className="mt-8 flex flex-wrap items-start gap-6">
          {vendor.logoUrl ? (
            <div
              className="size-24 shrink-0 rounded-full border border-white/10 bg-cover bg-center md:size-32"
              style={{ backgroundImage: `url(${vendor.logoUrl})` }}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-gold">
              <BadgeCheck size={14} /> Approved {vendor.category}
            </p>
            <h1 className="display-title mt-3 text-5xl md:text-7xl">{vendor.name}</h1>
            {vendor.tagline ? <p className="mt-3 text-lg text-paper/72">{vendor.tagline}</p> : null}
            {vendor.location ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-paper/55">
                <MapPin size={14} /> {vendor.location}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8">
          <VendorContactButtons vendor={vendor} />
        </div>

        <div className="mt-10 max-w-3xl whitespace-pre-line text-lg leading-8 text-paper/72">{vendor.description}</div>
      </section>

      {vendor.media.length > 0 ? (
        <section className="section-shell pb-20">
          <p className="border-t border-white/10 pt-10 text-xs font-black uppercase text-gold">Portfolio</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendor.media.map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-ui border border-white/10 bg-white/[0.035]">
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    poster={videoPosterUrl(item.url)}
                    controls
                    playsInline
                    preload="none"
                    className="aspect-[4/5] w-full bg-black object-cover"
                  />
                ) : (
                  <a href={item.url} target="_blank" rel="noreferrer" aria-label={item.caption || `${vendor.name} work`}>
                    <div className="aspect-[4/5] w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.url})` }} />
                  </a>
                )}
                {item.caption ? <figcaption className="p-3 text-sm text-paper/62">{item.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
