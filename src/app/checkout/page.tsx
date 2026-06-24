"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { calculateTransactionFee } from "@/lib/fees";
import { formatNaira } from "@/lib/format-money";

export default function CheckoutPage() {
  const { items, subtotalKobo, updateQuantity, removeItem, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const transactionFeeKobo = useMemo(() => calculateTransactionFee(subtotalKobo), [subtotalKobo]);
  const totalKobo = subtotalKobo + transactionFeeKobo;

  async function initializeCheckout() {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          email,
          phone,
          items: items.map((item) => {
            if (item.type === "product") {
              return {
                type: "product",
                variantId: item.variantId,
                quantity: item.quantity,
              };
            }

            return {
              type: "ticket",
              eventId: item.eventId,
              ticketTierId: item.ticketTierId,
              quantity: item.quantity,
              attendeeNames: customerName ? [customerName] : [],
            };
          }),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to initialize checkout.");
      }

      clearCart();
      window.location.href = payload.authorizationUrl;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to initialize checkout.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell grid gap-8 pb-20 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-xs font-black uppercase text-gold">Secure checkout</p>
          <h1 className="display-title mt-4 max-w-4xl text-6xl md:text-8xl">Checkout</h1>

          <div className="mt-10 grid gap-3">
            {items.length === 0 ? (
              <div className="rounded-ui border border-white/10 bg-white/[0.035] p-6 text-paper/62">
                Your cart is empty. Add an event ticket or PA FLUX item first.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="grid gap-4 rounded-ui border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[96px_1fr_auto]">
                  <div
                    className="min-h-24 rounded-ui bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <div>
                    <p className="text-xs font-black uppercase text-gold">{item.type}</p>
                    <h2 className="mt-1 font-display text-2xl font-black">{item.title}</h2>
                    {item.metadata ? (
                      <p className="mt-2 text-xs text-paper/52">
                        {Object.entries(item.metadata).map(([key, value]) => `${key}: ${value}`).join(" / ")}
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm font-black text-paper/72">{formatNaira(item.unitKobo)}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <div className="flex h-10 items-center rounded-ui border border-white/10">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="grid size-10 place-items-center text-paper/70 hover:text-paper"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="min-w-8 text-center text-sm font-black">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="grid size-10 place-items-center text-paper/70 hover:text-paper"
                        aria-label="Increase quantity"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="grid size-10 place-items-center rounded-ui border border-white/10 text-paper/54 hover:border-lava hover:text-lava"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="h-fit rounded-ui border border-white/10 bg-white/[0.035] p-5 lg:sticky lg:top-24">
          <p className="text-xs font-black uppercase text-gold">Buyer details</p>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-paper/72">
              Name
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="h-12 rounded-ui border border-white/10 bg-ink px-4 text-paper"
                placeholder="Full name"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-paper/72">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-ui border border-white/10 bg-ink px-4 text-paper"
                placeholder="name@email.com"
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-paper/72">
              Phone
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-12 rounded-ui border border-white/10 bg-ink px-4 text-paper"
                placeholder="+234..."
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm">
            <div className="flex justify-between text-paper/62">
              <span>Subtotal</span>
              <span>{formatNaira(subtotalKobo)}</span>
            </div>
            <div className="flex justify-between text-paper/62">
              <span>Platform charge</span>
              <span>{formatNaira(transactionFeeKobo)}</span>
            </div>
            <p className="text-xs leading-5 text-paper/40">5% platform charge, capped at ₦5,000 per checkout.</p>
            <div className="flex justify-between border-t border-white/10 pt-4 text-lg font-black">
              <span>Total</span>
              <span>{formatNaira(totalKobo)}</span>
            </div>
          </div>

          {error ? <p className="mt-4 rounded-ui border border-lava/40 bg-lava/10 p-3 text-sm text-lava">{error}</p> : null}

          <button
            disabled={items.length === 0 || !email || isSubmitting}
            onClick={initializeCheckout}
            className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Starting payment..." : "Pay with Paystack"}
            <ArrowRight size={17} />
          </button>
        </aside>
      </section>
    </main>
  );
}
