import { Package } from "lucide-react";
import { ProductAdminPanel } from "@/components/admin/product-admin-panel";
import { formatNaira } from "@/lib/format-money";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "PA FLUX | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminMerchPage() {
  const [products, orderItems] = await Promise.all([
    prisma.product.findMany({
      include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orderItem.findMany({
      where: {
        itemType: "product",
        variantId: { not: null },
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        order: {
          include: {
            transaction: true,
          },
        },
      },
      orderBy: { order: { createdAt: "desc" } },
      take: 150,
    }),
  ]);

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Selling</p>
      <h2 className="mt-2 font-display text-5xl font-black">PA FLUX store</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/58">
        Manage merch products, prices, and stock, and see recent orders.
      </p>

      <div className="mt-8">
        <ProductAdminPanel
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            status: product.status,
            images: product.images,
            variants: product.variants.map((variant) => ({
              id: variant.id,
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              priceKobo: variant.priceKobo,
              stock: variant.stock,
            })),
          }))}
        />
      </div>

      <section className="mt-10">
        <p className="text-xs font-black uppercase text-gold">Recent orders</p>
        <div className="mt-4 overflow-hidden rounded-ui border border-white/10">
        <div className="grid grid-cols-[1fr_.8fr_.55fr_.7fr] gap-4 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase text-paper/45">
          <p>Buyer</p>
          <p>Item</p>
          <p>Qty</p>
          <p>Payment</p>
        </div>
        <div className="divide-y divide-white/10">
          {orderItems.map((item) => {
            const isPaid = item.order.status === "PAID" || item.order.transaction?.status === "SUCCESS";
            return (
              <div key={item.id} className="grid grid-cols-[1fr_.8fr_.55fr_.7fr] gap-4 px-4 py-4 text-sm">
                <div>
                  <p className="font-black text-paper">{item.order.email}</p>
                  <p className="mt-1 text-xs text-paper/45">{item.order.phone || "No phone number"}</p>
                </div>
                <div>
                  <p className="font-black text-paper">{item.variant?.product.name ?? item.title}</p>
                  <p className="mt-1 text-xs text-paper/45">
                    {item.variant?.color ?? "-"} / {item.variant?.size ?? "-"}
                  </p>
                  <p className="mt-1 text-xs text-paper/45">{formatNaira(item.totalKobo)}</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-black text-paper">{item.quantity}</p>
                  <p className="mt-1 text-xs text-paper/45">unit{item.quantity === 1 ? "" : "s"}</p>
                </div>
                <div>
                  <p className={isPaid ? "font-black text-gold" : "font-black text-paper/50"}>
                    {isPaid ? "Paid" : "Pending"}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-paper/45">
                    {item.order.transaction?.reference ?? "No reference"}
                  </p>
                </div>
              </div>
            );
          })}
          {orderItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-paper/50">
              <Package className="mx-auto mb-3 text-paper/30" size={28} />
              No PA FLUX orders yet.
            </div>
          ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
