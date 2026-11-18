import { VendorAdminPanel } from "@/components/admin/vendor-admin-panel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vendors | Popsy Adonis Admin",
  robots: { index: false, follow: false },
};

export default async function AdminVendorsPage() {
  const vendors = await prisma.vendor.findMany({
    include: { media: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">People</p>
      <h2 className="mt-2 font-display text-5xl font-black">Approved vendors</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/58">
        Businesses we recommend. Each one gets a profile on the public Vendors page with their contact details and a
        portfolio of photos and videos.
      </p>
      <div className="mt-8">
        <VendorAdminPanel
          vendors={vendors.map((vendor) => ({
            id: vendor.id,
            name: vendor.name,
            slug: vendor.slug,
            category: vendor.category,
            tagline: vendor.tagline ?? "",
            description: vendor.description,
            location: vendor.location ?? "",
            phone: vendor.phone ?? "",
            whatsapp: vendor.whatsapp ?? "",
            email: vendor.email ?? "",
            instagram: vendor.instagram ?? "",
            website: vendor.website ?? "",
            logoUrl: vendor.logoUrl ?? "",
            isActive: vendor.isActive,
            isFeatured: vendor.isFeatured,
            media: vendor.media.map((item) => ({
              url: item.url,
              type: item.type === "video" ? ("video" as const) : ("image" as const),
              caption: item.caption ?? "",
            })),
          }))}
        />
      </div>
    </div>
  );
}
