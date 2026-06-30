import { Package } from "lucide-react";
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
      where: { status: "ACTIVE" },
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
      <p className="text-xs font-black uppercase text-gold">PA FLUX merchandise</p>
      <h2 className="mt-2 font-display text-5xl font-black">Store admin</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/58">
        Track live product variants, stock, and recent clothing purchases.
      </p>

      <section className="mt-8 rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <p className="text-xs font-black uppercase text-gold">Live products</p>
        <div className="mt-4 grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-ui border border-white/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-black">{product.name}</p>
                  <p className="mt-1 text-xs text-paper/45">{product.slug}</p>
                </div>
                <p className="text-sm font-black text-gold">{formatNaira(product.variants[0]?.priceKobo ?? 0)}</p>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {product.variants.map((variant) => (
                  <div key={variant.id} className="rounded-ui bg-ink p-3">
                    <p className="text-sm font-black text-paper">
                      {variant.color} / {variant.size}
                    </p>
                    <p className="mt-1 text-xs text-paper/45">SKU {variant.sku}</p>
                    <p className="mt-2 text-sm font-black text-gold">{variant.stock} left</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {products.length === 0 ? <p className="text-sm text-paper/50">No active products.</p> : null}
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-ui border border-white/10">
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
      </section>
    </div>
  );
}

