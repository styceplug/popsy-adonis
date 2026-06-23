import Link from "next/link";
import { OrderStatus } from "@/components/checkout/order-status";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string | string[]; trxref?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawReference = params.reference ?? params.trxref;
  const reference = Array.isArray(rawReference) ? rawReference[0] : rawReference;

  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell pb-20">
        <p className="text-xs font-black uppercase text-gold">Checkout status</p>
        <h1 className="display-title mt-4 max-w-4xl text-6xl md:text-8xl">You are in.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/64">
          We are checking Paystack confirmation and webhook fulfillment for this purchase.
        </p>
        <OrderStatus reference={reference} />
        <Link
          href="/events"
          className="focus-ring mt-8 inline-flex h-12 items-center rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper"
        >
          Back to events
        </Link>
      </section>
    </main>
  );
}
