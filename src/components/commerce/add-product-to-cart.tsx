"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import type { Product } from "@/lib/sample-data";

const LOW_STOCK = 5;

export function AddProductToCart({ product, showColorPicker = true }: { product: Product; showColorPicker?: boolean }) {
  const { addItem } = useCart();
  // Start on the first size that can actually be bought.
  const firstAvailable = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  const [selectedColor, setSelectedColor] = useState(firstAvailable?.color ?? product.colors[0] ?? "");
  const [selectedSize, setSelectedSize] = useState(firstAvailable?.size ?? product.sizes[0] ?? "");
  const [wasAdded, setWasAdded] = useState(false);

  const findVariant = (color: string, size: string) =>
    product.variants.find((variant) => variant.color === color && variant.size === size);
  const selectedVariant = findVariant(selectedColor, selectedSize);
  const isSoldOut = !selectedVariant || selectedVariant.stock <= 0;
  const everythingSoldOut = product.variants.every((variant) => variant.stock <= 0);

  function chooseColor(color: string) {
    setSelectedColor(color);
    setWasAdded(false);
    const current = findVariant(color, selectedSize);
    if (!current || current.stock <= 0) {
      const fallback = product.variants.find((variant) => variant.color === color && variant.stock > 0);
      if (fallback) setSelectedSize(fallback.size);
    }
  }

  function chooseSize(size: string) {
    setSelectedSize(size);
    setWasAdded(false);
  }

  function handleAddToCart() {
    if (!selectedVariant || isSoldOut) return;

    addItem({
      id: selectedVariant.id,
      type: "product",
      title: product.name,
      variantId: selectedVariant.id,
      quantity: 1,
      unitKobo: selectedVariant.priceKobo,
      image: product.images[0],
      metadata: { color: selectedColor, size: selectedSize },
    });
    setWasAdded(true);
  }

  return (
    <>
      {showColorPicker && product.colors.length > 1 ? (
        <fieldset className="mt-8">
          <legend className="text-sm font-black uppercase">
            Colour <span className="ml-1 font-bold normal-case text-ink/55">{selectedColor}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => chooseColor(color)}
                aria-pressed={selectedColor === color}
                className={`focus-ring rounded-ui border px-4 py-2 text-sm font-bold transition hover:border-ink ${
                  selectedColor === color ? "border-ink bg-ink text-paper" : "border-ink/16 bg-white"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {product.sizes.length > 0 ? (
        <fieldset className="mt-7">
          <legend className="text-sm font-black uppercase">
            Size <span className="ml-1 font-bold normal-case text-ink/55">{selectedSize}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const variant = findVariant(selectedColor, size);
              const unavailable = !variant || variant.stock <= 0;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => chooseSize(size)}
                  disabled={unavailable}
                  aria-pressed={selectedSize === size}
                  aria-label={unavailable ? `${size}, sold out` : size}
                  className={`focus-ring h-12 min-w-16 rounded-ui border px-4 text-sm font-black transition ${
                    unavailable
                      ? "cursor-not-allowed border-ink/10 bg-transparent text-ink/30 line-through"
                      : selectedSize === size
                        ? "border-ink bg-ink text-paper"
                        : "border-ink/16 bg-white hover:border-ink"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          <p className="mt-3 min-h-5 text-sm font-bold text-lava" aria-live="polite">
            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= LOW_STOCK
              ? `Only ${selectedVariant.stock} left in ${selectedSize}`
              : ""}
          </p>
        </fieldset>
      ) : null}

      <button
        type="button"
        disabled={isSoldOut}
        onClick={handleAddToCart}
        className="focus-ring mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-ui bg-ink px-5 text-sm font-black uppercase text-paper transition hover:bg-lava disabled:cursor-not-allowed disabled:bg-ink/30"
      >
        {wasAdded ? <Check size={18} /> : <ShoppingBag size={18} />}
        {everythingSoldOut ? "Sold out" : isSoldOut ? "Size sold out" : wasAdded ? "Add another" : "Add to cart"}
      </button>

      <div aria-live="polite">
        {wasAdded ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-ui border border-ink/12 bg-white px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-bold text-ink/75">
              <Check size={16} className="text-lava" />
              {selectedSize ? `${selectedSize} added to your cart` : "Added to your cart"}
            </span>
            <Link href="/checkout" className="focus-ring inline-flex items-center gap-1 rounded-ui font-black text-lava hover:text-ink">
              Checkout
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
