// Adds the PA FLUX "Stay in Flux" tee: one standalone product per colour, sizes L, XL and XXL.
// Safe to run again: products match by slug and variants by SKU, so a rerun updates names, text,
// images and prices but leaves stock alone.
//
//   node scripts/add-stay-in-flux-tees.mjs [--publish] [--archive-others]
//
// Every colour and size starts with STOCK_PER_VARIANT units; change individual counts in admin later.
// --publish         puts the tees on sale (otherwise they are saved as Draft to check first)
// --archive-others  takes every other merch product off the store (status Archived; reversible in admin)
import { PrismaClient } from "@prisma/client";

const STOCK_PER_VARIANT = 100;

const publish = process.argv.includes("--publish");
const archiveOthers = process.argv.includes("--archive-others");
const stock = STOCK_PER_VARIANT;

const SIZES = ["L", "XL", "XXL"];
const IMG = "/paflux/stay-in-flux";

const details = `PRODUCT DETAILS
- Premium oversized fit
- Vintage acid-wash finish
- Bold STAY IN FLUX front graphic
- Comfortable everyday wear
- Unisex design
- Available in 5 colours: Flux Red, Flux Pink, Classic White, Midnight Black and Ash Grey

Not just a T-shirt. It's a statement. Designed for those who move differently, think differently and refuse to stay in one place.

PA FLUX. Stay in Flux. 👻`;

const tees = [
  {
    code: "RED",
    priceNaira: 40000,
    color: "Flux Red",
    images: [`${IMG}/red-front.jpg`, `${IMG}/red-back.jpg`],
    intro: `Make a bold statement with the PA FLUX Red Tee. Designed for those who aren't afraid to stand out, this piece combines a striking red base with vibrant yellow STAY IN FLUX graphics. A statement streetwear essential that represents confidence, individuality and constant evolution.

Stay in flux. Never stay ordinary.`,
  },
  {
    code: "PINK",
    priceNaira: 40000,
    color: "Flux Pink",
    images: [`${IMG}/pink-front.jpg`, `${IMG}/pink-back.jpg`],
    intro: `Soft colour, bold energy. The PA FLUX Pink Tee brings a fresh expression to everyday streetwear, featuring a vibrant pink base complemented by light burgundy STAY IN FLUX graphics. Made for those who embrace their individuality and express themselves without limits.`,
  },
  {
    code: "WHITE",
    priceNaira: 50000,
    color: "Classic White",
    images: [`${IMG}/white-front.jpg`, `${IMG}/white-back.jpg`],
    intro: `Clean, timeless and effortlessly expressive. The PA FLUX White Tee features bold black STAY IN FLUX graphics against a crisp white base. A versatile streetwear piece designed to make an impression while keeping your everyday style effortlessly clean.

Keep it clean. Stay in motion.`,
  },
  {
    code: "BLACK",
    priceNaira: 40000,
    color: "Midnight Black",
    images: [`${IMG}/black-front.jpg`, `${IMG}/black-back.jpg`, `${IMG}/ash-black-flatlay.jpg`],
    intro: `Dark shade. Loud statement. No permission needed.

The PA FLUX Black Tee is where bold streetwear meets effortless attitude. Featuring oversized white STAY IN FLUX typography, this piece is built for those who move differently, think differently and refuse to be boxed into one version of themselves.

More than a fit, it's a frequency. Wear your energy. Own your movement.`,
  },
  {
    code: "ASH",
    priceNaira: 50000,
    color: "Ash Grey",
    images: [`${IMG}/ash-front.jpg`, `${IMG}/ash-black-flatlay.jpg`],
    intro: `A clean, understated shade that brings effortless style to everyday wear. Our Ash Grey tee combines a soft, modern look with a versatile tone that pairs perfectly with almost anything. Minimal, timeless and made to stand out without trying too hard.`,
  },
];

const prisma = new PrismaClient();

try {
  for (const tee of tees) {
    const slug = `stay-in-flux-tee-${tee.code.toLowerCase()}`;
    const data = {
      name: `Stay in Flux Tee - ${tee.color}`,
      description: `${tee.intro}\n\n${details}`,
      images: tee.images,
      status: publish ? "ACTIVE" : "DRAFT",
    };

    const product = await prisma.product.upsert({
      where: { slug },
      update: data,
      create: { ...data, slug },
    });

    for (const size of SIZES) {
      const sku = `PAF-SIF-${tee.code}-${size}`;
      await prisma.productVariant.upsert({
        where: { sku },
        // Stock is only set on first creation, so a rerun never wipes out sales already made.
        update: { productId: product.id, size, color: tee.color, priceKobo: tee.priceNaira * 100 },
        create: { productId: product.id, sku, size, color: tee.color, priceKobo: tee.priceNaira * 100, stock },
      });
    }

    console.log(
      `${data.status === "ACTIVE" ? "Live" : "Draft"}: ${data.name}, N${tee.priceNaira.toLocaleString()}, sizes ${SIZES.join("/")}, ${stock} each`,
    );
  }

  if (archiveOthers) {
    const keep = tees.map((tee) => `stay-in-flux-tee-${tee.code.toLowerCase()}`);
    const others = await prisma.product.findMany({
      where: { slug: { notIn: keep }, status: { not: "ARCHIVED" } },
      select: { name: true },
    });
    await prisma.product.updateMany({
      where: { slug: { notIn: keep }, status: { not: "ARCHIVED" } },
      data: { status: "ARCHIVED" },
    });
    for (const product of others) console.log(`Taken down: ${product.name}`);
    if (others.length === 0) console.log("No other merch was on the store.");
  }
} finally {
  await prisma.$disconnect();
}
