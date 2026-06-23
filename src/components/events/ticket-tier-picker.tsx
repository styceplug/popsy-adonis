"use client";

import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";
import type { Event } from "@/lib/sample-data";
import { formatNaira } from "@/lib/format-money";

export function TicketTierPicker({ event }: { event: Event }) {
  const { addItem } = useCart();
  const [selectedTier, setSelectedTier] = useState(event.tiers[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [wasAdded, setWasAdded] = useState(false);
  const tier = useMemo(() => event.tiers.find((item) => item.id === selectedTier), [event.tiers, selectedTier]);

  return (
    <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs font-black uppercase text-gold">Ticket tiers</p>
      <div className="mt-4 grid gap-3">
        {event.tiers.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedTier(item.id)}
            className={`focus-ring rounded-ui border p-4 text-left transition ${
              selectedTier === item.id ? "border-gold bg-gold/12" : "border-white/10 hover:border-white/28"
            }`}
          >
            <span className="flex items-center justify-between gap-4">
              <span className="font-display text-xl font-black text-paper">{item.name}</span>
              <span className="text-sm font-black text-gold">{formatNaira(item.priceKobo)}</span>
            </span>
            <span className="mt-2 block text-xs text-paper/58">{item.perks.join(" / ")}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
        <label className="text-sm font-bold text-paper/72" htmlFor="quantity">Qty</label>
        <input
          id="quantity"
          min={1}
          max={10}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          type="number"
          className="h-10 w-20 rounded-ui border border-white/12 bg-ink px-3 text-paper"
        />
      </div>
      <button
        disabled={!tier}
        onClick={() => {
          if (!tier) return;
          addItem({
            id: `${event.id}:${tier.id}`,
            type: "ticket",
            title: `${event.title} - ${tier.name}`,
            eventId: event.id,
            ticketTierId: tier.id,
            quantity,
            unitKobo: tier.priceKobo,
            image: event.heroImage,
            metadata: {
              event: event.title,
              tier: tier.name,
            },
          });
          setWasAdded(true);
          window.setTimeout(() => setWasAdded(false), 2200);
        }}
        className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart size={17} />
        {wasAdded ? "Added to cart" : `Add ${tier?.name ?? "Ticket"} - ${formatNaira((tier?.priceKobo ?? 0) * quantity)}`}
      </button>
      <Link
        href="/checkout"
        className="focus-ring mt-3 inline-flex h-11 w-full items-center justify-center rounded-ui border border-white/12 text-sm font-bold text-paper/72 transition hover:border-paper hover:text-paper"
      >
        Go to checkout
      </Link>
    </div>
  );
}
