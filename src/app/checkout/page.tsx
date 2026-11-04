"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCart, type CartItem } from "@/components/providers/cart-provider";
import { calculateCheckoutPaymentBreakdown } from "@/lib/fees";
import { formatNaira } from "@/lib/format-money";

export default function CheckoutPage() {
  const { items, subtotalKobo, updateQuantity, removeItem, clearCart, replaceItems } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [joinMailingList, setJoinMailingList] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticketSubtotalKobo = useMemo(
    () => items.filter((item) => item.type === "ticket").reduce((sum, item) => sum + item.unitKobo * item.quantity, 0),
    [items],
  );
  const eventAddOnSubtotalKobo = useMemo(
    () => items.filter((item) => item.type === "addon").reduce((sum, item) => sum + item.unitKobo * item.quantity, 0),
    [items],
  );
  const feeSubtotalKobo = subtotalKobo;
  const feeBreakdown = useMemo(
    () => calculateCheckoutPaymentBreakdown(ticketSubtotalKobo, feeSubtotalKobo),
    [feeSubtotalKobo, ticketSubtotalKobo],
  );
  const transactionFeeKobo = feeBreakdown.transactionFeeKobo;
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
          joinMailingList,
          expectedSubtotalKobo: subtotalKobo,
          items: items.map((item) => {
            if (item.type === "product") {
              return {
                type: "product",
                variantId: item.variantId,
                quantity: item.quantity,
              };
            }

            if (item.type === "addon") {
              return {
                type: "addon",
                eventId: item.eventId,
                eventAddOnId: item.eventAddOnId,
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

      // The server priced the order differently from the cart (usually a promo that no longer
      // applies). Nothing was charged: show the real prices and let the buyer decide.
      if (response.status === 409 && payload?.code === "PRICE_CHANGED" && Array.isArray(payload.lines)) {
        const repriced = repriceCart(items, payload.lines as PricedLine[]);
        const promoBefore = countPromoTickets(items);
        const promoAfter = countPromoTickets(repriced);
        replaceItems(repriced);
        setError(
          promoAfter < promoBefore
            ? "The promo price couldn't be applied to this order. It may have ended or sold out, or this email or phone number has already used it. Your cart now shows the current price. Check the total, then tap Pay again."
            : payload.message ?? "Some prices in your cart have changed. Check the total, then tap Pay again.",
        );
        setIsSubmitting(false);
        return;
      }

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
            <label className="flex cursor-pointer items-start gap-3 text-sm text-paper/62">
              <input
                type="checkbox"
                checked={joinMailingList}
                onChange={(event) => setJoinMailingList(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-gold"
              />
              Email me about upcoming events and PA FLUX drops (optional)
            </label>
          </div>

          <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm">
            {ticketSubtotalKobo + eventAddOnSubtotalKobo > 0 ? (
              <div className="flex justify-between text-paper/62">
                <span>Event items</span>
                <span>{formatNaira(ticketSubtotalKobo + eventAddOnSubtotalKobo)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-paper/62">
              <span>Subtotal</span>
              <span>{formatNaira(subtotalKobo)}</span>
            </div>
            <div className="flex justify-between text-paper/62">
              <span>Transaction Fee</span>
              <span>{formatNaira(transactionFeeKobo)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-4 text-lg font-black">
              <span>Total Payable</span>
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

type PricedLine = {
  type: string;
  ticketTierId?: string | null;
  variantId?: string | null;
  eventAddOnId?: string | null;
  title: string;
  quantity: number;
  unitKobo: number;
  promoLabel?: string;
};

function countPromoTickets(items: CartItem[]) {
  return items.reduce((sum, item) => (item.type === "ticket" && item.metadata?.promo ? sum + item.quantity : sum), 0);
}

/** Rebuilds the cart from the server's priced lines, keeping each item's image and details. */
function repriceCart(current: CartItem[], lines: PricedLine[]): CartItem[] {
  const next = new Map<string, CartItem>();

  for (const line of lines) {
    let item: CartItem | null = null;

    if (line.type === "product") {
      const source = current.find((entry) => entry.type === "product" && entry.variantId === line.variantId);
      if (source) item = { ...source, quantity: line.quantity, unitKobo: line.unitKobo };
    } else if (line.type === "addon") {
      const source = current.find((entry) => entry.type === "addon" && entry.eventAddOnId === line.eventAddOnId);
      if (source) item = { ...source, quantity: line.quantity, unitKobo: line.unitKobo };
    } else if (line.type === "ticket") {
      const source = current.find((entry) => entry.type === "ticket" && entry.ticketTierId === line.ticketTierId);
      if (source && source.type === "ticket") {
        const metadata = { ...(source.metadata ?? {}) };
        delete metadata.promo;
        if (line.promoLabel) metadata.promo = line.promoLabel;
        item = {
          ...source,
          id: `${source.eventId}:${source.ticketTierId}:${line.promoLabel ? "promo" : "standard"}`,
          title: line.title,
          quantity: line.quantity,
          unitKobo: line.unitKobo,
          metadata,
        };
      }
    }

    if (!item) continue;
    const existing = next.get(item.id);
    next.set(item.id, existing ? { ...existing, quantity: existing.quantity + item.quantity } : item);
  }

  return [...next.values()];
}
