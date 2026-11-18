import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { openGraphFor } from "@/lib/seo";
import { videoPosterUrl } from "@/lib/vendors";

const pageTitle = "Approved Vendors | Popsy Adonis";
const pageDescription =
  "Photographers, DJs, decorators, makeup artists and more, vetted and recommended by Popsy Adonis. See their work and contact them directly.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/vendors" },
  openGraph: openGraphFor({ title: pageTitle, description: pageDescription, path: "/vendors" }),
};

// Vendors are managed in admin, so read them on every visit.
export const dynamic = "force-dynamic";

export default async function VendorsPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const vendors = await prisma.vendor.findMany({
    where: { isActive: true },
    include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
  const categories = [...new Set(vendors.map((vendor) => vendor.category))].sort();
  const shown = service ? vendors.filter((vendor) => vendor.category === service) : vendors;

  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell pb-10">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-gold">
          <BadgeCheck size={14} /> Recommended by Popsy Adonis
        </p>
        <h1 className="display-title mt-4 max-w-4xl text-6xl md:text-8xl">Approved Vendors</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/64">
          Businesses we have worked with and trust. Browse their work and reach out to them directly.
        </p>

        {categories.length > 1 ? (
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filter by service">
            <Link
              href="/vendors"
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                !service ? "border-gold bg-gold text-ink" : "border-white/12 text-paper/68 hover:border-paper hover:text-paper"
              }`}
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category}
                href={`/vendors?service=${encodeURIComponent(category)}`}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  service === category ? "border-gold bg-gold text-ink" : "border-white/12 text-paper/68 hover:border-paper hover:text-paper"
                }`}
              >
                {category}
              </Link>
            ))}
          </nav>
        ) : null}
      </section>

      <section className="section-shell pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((vendor) => {
            const cover = vendor.media[0];
            const coverImage = cover ? (cover.type === "video" ? videoPosterUrl(cover.url) : cover.url) : vendor.logoUrl;

            return (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.slug}`}
                className="group overflow-hidden rounded-ui border border-white/10 bg-white/[0.035] transition hover:border-gold"
              >
                <div
                  className="aspect-[4/3] bg-white/5 bg-cover bg-center"
                  style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
                />
                <div className="flex gap-3 p-4">
                  {vendor.logoUrl ? (
                    <div
                      className="size-12 shrink-0 rounded-full border border-white/10 bg-cover bg-center"
                      style={{ backgroundImage: `url(${vendor.logoUrl})` }}
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-gold">{vendor.category}</p>
                    <h2 className="mt-1 font-display text-2xl font-black group-hover:text-gold">{vendor.name}</h2>
                    {vendor.tagline ? <p className="mt-1 line-clamp-2 text-sm text-paper/62">{vendor.tagline}</p> : null}
                    {vendor.location ? (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-paper/50">
                        <MapPin size={12} /> {vendor.location}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {shown.length === 0 ? (
          <p className="rounded-ui border border-white/10 bg-white/[0.035] p-6 text-paper/60">
            No vendors listed here yet. Check back soon.
          </p>
        ) : null}
      </section>
    </main>
  );
}
