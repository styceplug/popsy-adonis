/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      id: "product-pa-flux-signature-tee",
      name: "PA FLUX Signature Tee",
      slug: "pa-flux-signature-tee",
      description: "Heavyweight cotton tee with a clean front mark and oversized back print.",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80",
      ],
      variants: [
        {
          id: "variant-pa-flux-signature-tee-ink-m",
          sku: "PA-FLUX-TEE-INK-M",
          size: "M",
          color: "Ink",
          priceKobo: 3500000,
          stock: 100,
        },
      ],
    },
    {
      id: "product-night-circuit-hoodie",
      name: "Night Circuit Hoodie",
      slug: "night-circuit-hoodie",
      description: "Structured hoodie for late arrivals, clean exits, and every camera flash between.",
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=1200&q=80",
      ],
      variants: [
        {
          id: "variant-night-circuit-hoodie-coal-m",
          sku: "PA-FLUX-HOODIE-COAL-M",
          size: "M",
          color: "Coal",
          priceKobo: 6200000,
          stock: 80,
        },
      ],
    },
    {
      id: "product-access-cap",
      name: "Access Cap",
      slug: "access-cap",
      description: "Low-profile embroidered cap for the people who know where the real party is.",
      images: [
        "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=80",
      ],
      variants: [
        {
          id: "variant-access-cap-ink-one-size",
          sku: "PA-FLUX-CAP-INK-OS",
          size: "One size",
          color: "Ink",
          priceKobo: 1800000,
          stock: 150,
        },
      ],
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        images: product.images,
        status: "ACTIVE",
      },
      create: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        images: product.images,
        status: "ACTIVE",
      },
    });

    for (const variant of product.variants) {
      await prisma.productVariant.upsert({
        where: { id: variant.id },
        update: {
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          priceKobo: variant.priceKobo,
          stock: variant.stock,
        },
        create: {
          ...variant,
          productId: product.id,
        },
      });
    }
  }

  const events = [
    {
      id: "event-summer-time-ekiti",
      title: "Summer Time in Ekiti",
      slug: "summer-time-in-ekiti",
      description:
        "A first-of-its-kind summer party in Ekiti with free swimming, piercing, tattoo sessions, music, entertainment, and unforgettable campus memories.",
      venue: "Location to be announced soon",
      city: "Ekiti",
      startsAt: new Date("2026-08-16T17:00:00.000Z"),
      heroImage: "/POPSY%20ADONIS%20FLUX%20PARTY.png",
      ticketTiers: [
        {
          id: "tier-summer-time-ekiti-early-bird",
          name: "Early Bird",
          priceKobo: 300000,
          capacity: 500,
          perks: ["Early bird access", "Free swimming", "Free piercing", "Free tattoo sessions"],
        },
        {
          id: "tier-summer-time-ekiti-vip",
          name: "VIP",
          priceKobo: 2_000_000,
          capacity: 100,
          perks: ["VIP access", "Priority entry", "Free swimming", "Free piercing", "Free tattoo sessions"],
        },
      ],
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {
        title: event.title,
        slug: event.slug,
        description: event.description,
        venue: event.venue,
        city: event.city,
        startsAt: event.startsAt,
        status: "PUBLISHED",
        heroImage: event.heroImage,
      },
      create: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        venue: event.venue,
        city: event.city,
        startsAt: event.startsAt,
        status: "PUBLISHED",
        heroImage: event.heroImage,
      },
    });

    for (const tier of event.ticketTiers) {
      await prisma.ticketTier.upsert({
        where: { id: tier.id },
        update: {
          name: tier.name,
          priceKobo: tier.priceKobo,
          capacity: tier.capacity,
          perks: tier.perks,
          isActive: true,
        },
        create: {
          ...tier,
          eventId: event.id,
          isActive: true,
        },
      });
    }
  }

  await prisma.ticketPromo.upsert({
    where: { code: "early_bird_half_price_2026_06_27_1030pm" },
    update: {
      ticketTierId: "tier-summer-time-ekiti-early-bird",
      name: "10:30PM Half Price",
      promoPriceKobo: 150000,
      startsAt: new Date("2026-06-27T21:30:00.000Z"),
      endsAt: null,
      quantityLimit: 20,
      maxPerBuyer: 1,
      isActive: true,
    },
    create: {
      ticketTierId: "tier-summer-time-ekiti-early-bird",
      name: "10:30PM Half Price",
      code: "early_bird_half_price_2026_06_27_1030pm",
      promoPriceKobo: 150000,
      startsAt: new Date("2026-06-27T21:30:00.000Z"),
      endsAt: null,
      quantityLimit: 20,
      maxPerBuyer: 1,
      isActive: true,
      createdBy: "Seed",
    },
  });

  await prisma.ticketTier.updateMany({
    where: {
      eventId: {
        not: "event-summer-time-ekiti",
      },
    },
    data: {
      isActive: false,
    },
  });

  await prisma.event.updateMany({
    where: {
      id: {
        not: "event-summer-time-ekiti",
      },
      status: "PUBLISHED",
    },
    data: {
      status: "DRAFT",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
