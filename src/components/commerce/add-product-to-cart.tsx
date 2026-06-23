"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import type { Product } from "@/lib/sample-data";

export function AddProductToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [wasAdded, setWasAdded] = useState(false);

  function handleAddToCart() {
    addItem({
      id: `${product.defaultVariantId}:${selectedColor}:${selectedSize}`,
      type: "product",
      title: product.name,
      variantId: product.defaultVariantId,
      quantity: 1,
      unitKobo: product.priceKobo,
      image: product.images[0],
      metadata: { color: selectedColor, size: selectedSize },
    });
    setWasAdded(true);
    window.setTimeout(() => setWasAdded(false), 2200);
  }

  return (
    <>
      <div className="mt-8">
        <p className="text-sm font-black uppercase">Color</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`focus-ring rounded-ui border px-4 py-2 text-sm font-bold hover:border-ink ${
                selectedColor === color ? "border-ink bg-ink text-paper" : "border-ink/16"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <p className="text-sm font-black uppercase">Size</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`focus-ring min-w-12 rounded-ui border px-4 py-2 text-sm font-bold hover:border-ink ${
                selectedSize === size ? "border-ink bg-ink text-paper" : "border-ink/16"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleAddToCart}
        className="focus-ring mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-ui bg-ink px-5 text-sm font-black text-paper transition hover:bg-lava"
      >
        <ShoppingBag size={17} />
        {wasAdded ? "Added to cart" : "Add to cart"}
      </button>
      {wasAdded ? (
        <p className="mt-3 rounded-ui border border-ink/15 bg-ink/5 p-3 text-sm font-bold text-ink/70">
          Added. Use the floating cart button at the bottom-right to checkout.
        </p>
      ) : null}
    </>
  );
}
