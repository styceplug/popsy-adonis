/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      id: "product-pa-flux-white-tee-becoming",
      name: "White FLUX Tee - The Becoming",
      slug: "white-flux-tee-the-becoming",
      description:
        "After surviving the darkness, you don't return the same. You return renewed. The White Tee represents clarity, confidence, and new beginnings. It reminds you that growth isn't about being perfect; it's about becoming better every day. Stay in Flux. Evolve without limits.",
      images: [
        "/PA%20FLUX/White%20FLUX%20Tee%20%E2%80%94%20The%20Becoming/front.jpeg",
        "/PA%20FLUX/White%20FLUX%20Tee%20%E2%80%94%20The%20Becoming/back.jpeg",
      ],
      variants: [
        {
          id: "variant-pa-flux-white-tee-m",
          sku: "PA-FLUX-WHITE-TEE-M",
          size: "M",
          color: "White",
          priceKobo: 3500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-white-tee-l",
          sku: "PA-FLUX-WHITE-TEE-L",
          size: "L",
          color: "White",
          priceKobo: 3500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-white-tee-xl",
          sku: "PA-FLUX-WHITE-TEE-XL",
          size: "XL",
          color: "White",
          priceKobo: 3500000,
          stock: 100,
        },
      ],
    },
    {
      id: "product-pa-flux-black-tee-beginning",
      name: "Black FLUX Tee - The Beginning",
      slug: "black-flux-tee-the-beginning",
      description:
        "Before every breakthrough, there's a season nobody applauds. The Black Tee represents the nights of doubt, discipline, and silent growth. Every setback leaves a mark, but every mark becomes part of the story. You don't wait for the light, you become it. Stay in Flux. Keep moving.",
      images: [
        "/PA%20FLUX/Black%20Flux%20Tee%20%E2%80%94%20The%20Beginning/front.jpeg",
        "/PA%20FLUX/Black%20Flux%20Tee%20%E2%80%94%20The%20Beginning/back.jpeg",
      ],
      variants: [
        {
          id: "variant-pa-flux-black-tee-m",
          sku: "PA-FLUX-BLACK-TEE-M",
          size: "M",
          color: "Black",
          priceKobo: 3500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-black-tee-l",
          sku: "PA-FLUX-BLACK-TEE-L",
          size: "L",
          color: "Black",
          priceKobo: 3500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-black-tee-xl",
          sku: "PA-FLUX-BLACK-TEE-XL",
          size: "XL",
          color: "Black",
          priceKobo: 3500000,
          stock: 100,
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

  await prisma.product.updateMany({
    where: {
      id: {
        notIn: products.map((product) => product.id),
      },
    },
    data: {
      status: "ARCHIVED",
    },
  });

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
      endsAt: new Date("2026-06-27T22:59:59.999Z"),
      quantityLimit: 20,
      maxPerBuyer: 1,
      isActive: false,
    },
    create: {
      ticketTierId: "tier-summer-time-ekiti-early-bird",
      name: "10:30PM Half Price",
      code: "early_bird_half_price_2026_06_27_1030pm",
      promoPriceKobo: 150000,
      startsAt: new Date("2026-06-27T21:30:00.000Z"),
      endsAt: new Date("2026-06-27T22:59:59.999Z"),
      quantityLimit: 20,
      maxPerBuyer: 1,
      isActive: false,
      createdBy: "Seed",
    },
  });

  const eventAddOns = [
    {
      id: "addon-summer-time-water-gun-medium",
      eventId: "event-summer-time-ekiti",
      name: "Water Gun - Medium",
      slug: "water-gun-medium",
      description: "Medium water gun add-on for Summer Time in Ekiti.",
      priceKobo: 700000,
      stock: 250,
    },
    {
      id: "addon-summer-time-water-gun-big",
      eventId: "event-summer-time-ekiti",
      name: "Water Gun - Big",
      slug: "water-gun-big",
      description: "Big water gun add-on for Summer Time in Ekiti.",
      priceKobo: 1300000,
      stock: 150,
    },
  ];

  for (const addOn of eventAddOns) {
    await prisma.eventAddOn.upsert({
      where: {
        eventId_slug: {
          eventId: addOn.eventId,
          slug: addOn.slug,
        },
      },
      update: {
        name: addOn.name,
        description: addOn.description,
        priceKobo: addOn.priceKobo,
        stock: addOn.stock,
        isActive: true,
      },
      create: {
        ...addOn,
        isActive: true,
      },
    });
  }

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
