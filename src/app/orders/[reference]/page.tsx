import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { formatNaira } from "@/lib/format-money";
import { getMerchStatusOption, merchStatusOptions } from "@/lib/merch-status";
import { prisma } from "@/lib/prisma";
import { brand } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order status | Popsy Adonis",
  robots: { index: false, follow: false },
};

// The normal path an order moves along. READY and SHIPPED are alternatives (pickup or delivery).
const progressSteps = ["CONFIRMED", "PROCESSING", "READY_OR_SHIPPED", "DELIVERED"] as const;

function stepIndex(status: string) {
  if (status === "READY" || status === "SHIPPED") return 2;
  return progressSteps.indexOf(status as (typeof progressSteps)[number]);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(value);
}

/** Public order tracking page linked from the receipt email. The payment reference is the key. */
export default async function OrderStatusPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const transaction = await prisma.transaction.findUnique({
    where: { reference: decodeURIComponent(reference) },
    include: { order: { include: { items: true, tickets: { select: { id: true, qrCode: true } } } } },
  });

  if (!transaction) notFound();

  const { order } = transaction;
  const isPaid = transaction.status === "SUCCESS";
  const merchItems = order.items.filter((item) => item.itemType === "product");
  const status = order.merchStatus ?? (isPaid ? "CONFIRMED" : null);
  const current = getMerchStatusOption(status);
  const isCancelled = status === "CANCELLED";
  const currentStep = status ? stepIndex(status) : -1;

  const stepLabels = [
    merchStatusOptions[0].label,
    merchStatusOptions[1].label,
    status === "SHIPPED" ? "On its way" : status === "READY" ? "Ready for pickup" : "Ready or on its way",
    "Delivered",
  ];

  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell max-w-3xl pb-20">
        <p className="text-xs font-black uppercase text-gold">Order status</p>
        <h1 className="display-title mt-4 text-5xl md:text-7xl">
          {!isPaid ? "Awaiting payment" : merchItems.length > 0 ? current.label : "Payment confirmed"}
        </h1>
        <p className="mt-4 text-paper/62">
          {!isPaid
            ? "We have not received payment for this order yet."
            : merchItems.length > 0
              ? current.hint
              : "Thanks for your purchase."}
        </p>
        <p className="mt-3 break-all font-mono text-xs text-paper/45">{transaction.reference}</p>

        {isPaid && merchItems.length > 0 ? (
          <div className="mt-8 rounded-ui border border-white/10 bg-white/[0.035] p-5">
            {isCancelled ? (
              <p className="inline-flex items-center gap-2 font-black text-lava">
                <XCircle size={18} /> Cancelled
              </p>
            ) : (
              <ol className="grid gap-4">
                {stepLabels.map((label, index) => {
                  const done = index <= currentStep;
                  return (
                    <li key={label} className={`flex items-center gap-3 text-sm font-bold ${done ? "text-gold" : "text-paper/40"}`}>
                      {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      {label}
                    </li>
                  );
                })}
              </ol>
            )}
            {order.merchNote ? (
              <p className="mt-5 whitespace-pre-line rounded-ui border border-gold/30 bg-gold/10 p-4 text-sm leading-6 text-paper/80">
                {order.merchNote}
              </p>
            ) : null}
            {order.merchStatusUpdatedAt ? (
              <p className="mt-4 text-xs text-paper/45">Last updated {formatDate(order.merchStatusUpdatedAt)}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 rounded-ui border border-white/10 bg-white/[0.035] p-5">
          <p className="text-xs font-black uppercase text-gold">Items</p>
          <div className="mt-3 divide-y divide-white/10">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                <span className="text-paper/80">
                  {item.title} <span className="text-paper/45">×{item.quantity}</span>
                </span>
                <span className="font-black">{formatNaira(item.totalKobo)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 text-sm">
            <div className="flex justify-between text-paper/62">
              <span>Transaction fee</span>
              <span>{formatNaira(order.transactionFeeKobo)}</span>
            </div>
            <div className="flex justify-between text-lg font-black">
              <span>Total</span>
              <span>{formatNaira(order.totalKobo)}</span>
            </div>
          </div>
          {order.tickets.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
              {order.tickets.map((ticket, index) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.qrCode}`}
                  className="focus-ring rounded-ui bg-gold px-3 py-2 text-xs font-black text-ink hover:bg-paper"
                >
                  Open ticket {order.tickets.length > 1 ? index + 1 : ""}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-sm text-paper/50">
          Questions about your order? Email{" "}
          <a href={`mailto:${brand.email}`} className="font-bold text-gold hover:text-paper">
            {brand.email}
          </a>{" "}
          with your reference.
        </p>
      </section>
    </main>
  );
}
