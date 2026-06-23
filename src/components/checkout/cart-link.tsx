"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { formatNaira } from "@/lib/format-money";

export function CartLink() {
  const { itemCount, subtotalKobo } = useCart();

  if (itemCount === 0) return null;

  return (
    <Link
      href="/checkout"
      className="focus-ring fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-3 rounded-ui bg-gold px-5 text-sm font-black text-ink shadow-[0_18px_60px_rgba(0,0,0,.35)] transition hover:bg-paper"
    >
      <span className="relative">
        <ShoppingCart size={19} />
        <span className="absolute -right-3 -top-3 grid size-5 place-items-center rounded-full bg-ink text-[10px] text-paper">
          {itemCount}
        </span>
      </span>
      <span className="hidden sm:inline">Cart</span>
      <span className="hidden border-l border-ink/20 pl-3 sm:inline">{formatNaira(subtotalKobo)}</span>
    </Link>
  );
}
