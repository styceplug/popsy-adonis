"use client";

import { useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  name: string;
};

export function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="grid gap-3">
      <div
        className="min-h-[540px] rounded-ui border border-ink/10 bg-cover bg-center bg-no-repeat sm:min-h-[680px] lg:min-h-[760px]"
        style={{ backgroundImage: `url(${activeImage})` }}
        role="img"
        aria-label={name}
      />

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View ${name} image ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`focus-ring h-20 rounded-ui border bg-cover bg-center bg-no-repeat transition sm:h-24 ${
                activeIndex === index
                  ? "border-lava ring-2 ring-lava/25"
                  : "border-ink/10 opacity-70 hover:opacity-100"
              }`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
