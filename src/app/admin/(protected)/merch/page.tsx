import { Package } from "lucide-react";
import { MerchOrderStatusForm } from "@/components/admin/merch-order-status-form";
import { ProductAdminPanel } from "@/components/admin/product-admin-panel";
import { formatNaira } from "@/lib/format-money";
import { getMerchStatusOption } from "@/lib/merch-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(value);
}

export const metadata = {
  title: "PA FLUX | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminMerchPage() {
  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { items: { some: { itemType: "product" } } },
      include: { items: true, transaction: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Selling</p>
      <h2 className="mt-2 font-display text-5xl font-black">PA FLUX store</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/58">
        Manage merch products, prices, and stock, and update order status.
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
        <p className="text-xs font-black uppercase text-gold">Orders</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-paper/55">
          Update each paid order as it moves. The buyer sees the status and your note on the order page linked in their
          receipt email.
        </p>
        <div className="mt-4 overflow-x-auto rounded-ui border border-white/10">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[1fr_1.1fr_.7fr_1.1fr] gap-4 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase text-paper/45">
              <p>Buyer</p>
              <p>Items</p>
              <p>Payment</p>
              <p>Status</p>
            </div>
            <div className="divide-y divide-white/10">
              {orders.map((order) => {
                const isPaid = order.transaction?.status === "SUCCESS";
                const merchItems = order.items.filter((item) => item.itemType === "product");
                const status = getMerchStatusOption(order.merchStatus ?? (isPaid ? "CONFIRMED" : null));
                return (
                  <div key={order.id} className="grid grid-cols-[1fr_1.1fr_.7fr_1.1fr] gap-4 px-4 py-4 text-sm">
                    <div className="min-w-0">
                      <p className="break-all font-black text-paper">{order.email}</p>
                      <p className="mt-1 text-xs text-paper/45">{order.phone || "No phone number"}</p>
                      <p className="mt-1 text-xs text-paper/45">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      {merchItems.map((item) => {
                        const meta =
                          item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
                            ? (item.metadata as Record<string, unknown>)
                            : {};
                        const details = [meta.color, meta.size].filter((value) => typeof value === "string" && value).join(" / ");
                        return (
                          <p key={item.id} className="mb-1 text-paper">
                            <span className="font-black">{item.title}</span>
                            {details ? <span className="text-paper/55"> ({details})</span> : null}
                            <span className="text-paper/55"> ×{item.quantity}</span>
                          </p>
                        );
                      })}
                      <p className="mt-1 text-xs text-paper/45">{formatNaira(order.totalKobo)} total</p>
                    </div>
                    <div className="min-w-0">
                      <p className={isPaid ? "font-black text-gold" : "font-black text-paper/50"}>{isPaid ? "Paid" : "Not paid"}</p>
                      <p className="mt-1 break-all font-mono text-xs text-paper/45">
                        {order.transaction?.reference ?? "No reference"}
                      </p>
                      {order.transaction ? (
                        <a
                          href={`/orders/${encodeURIComponent(order.transaction.reference)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-black text-gold hover:text-paper"
                        >
                          Customer view
                        </a>
                      ) : null}
                    </div>
                    <div>
                      {isPaid ? (
                        <>
                          <p className="mb-2 text-xs font-black uppercase text-paper/62">Now: {status.label}</p>
                          <MerchOrderStatusForm
                            orderId={order.id}
                            status={order.merchStatus ?? "CONFIRMED"}
                            note={order.merchNote ?? ""}
                          />
                        </>
                      ) : (
                        <p className="text-xs text-paper/45">Waiting for payment</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-paper/50">
                  <Package className="mx-auto mb-3 text-paper/30" size={28} />
                  No PA FLUX orders yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
