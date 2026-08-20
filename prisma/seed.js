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
        "/PA%20FLUX/White%20FLUX%20Tee%20%E2%80%94%20The%20Becoming/main.jpeg",
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
        "/PA%20FLUX/Black%20Flux%20Tee%20%E2%80%94%20The%20Beginning/main.jpeg",
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
    {
      id: "product-pa-flux-joggers-crisp-white",
      name: "FLUX Joggers - Crisp White",
      slug: "flux-joggers-crisp-white",
      description:
        "Untouched, Yet Unstoppable. Crisp White isn't weakness, it's possibility. The FLUX joggers represent the beginning of every journey: clean ambition, bold vision, and the courage to step into the unknown. The ghost graphics symbolize the fearless side of you that refuses to disappear, while the Flux identity reminds you that growth comes through constant movement. Every stain tells a story. Every step adds character. Stay in Flux. Stay Becoming.",
      images: [
        "/PA%20FLUX/FLUX%20JOGGERS%20Crisp%20white%20Edition%20%E2%80%9CUntouched%2C%20Yet%20Unstoppable.%E2%80%9D/front-side.jpg",
      ],
      variants: [
        {
          id: "variant-pa-flux-joggers-white-m",
          sku: "PA-FLUX-JOGGERS-WHITE-M",
          size: "M",
          color: "Crisp White",
          priceKobo: 3500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-joggers-white-l",
          sku: "PA-FLUX-JOGGERS-WHITE-L",
          size: "L",
          color: "Crisp White",
          priceKobo: 3500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-joggers-white-xl",
          sku: "PA-FLUX-JOGGERS-WHITE-XL",
          size: "XL",
          color: "Crisp White",
          priceKobo: 3500000,
          stock: 100,
        },
      ],
    },
    {
      id: "product-pa-flux-noir-jort",
      name: "Noir Flux Jort",
      slug: "noir-flux-jort",
      description:
        "The Noir Flux Jort represents constant evolution. The distressed denim reflects the marks left by every experience, while the crystal details symbolize moments of pressure transformed into brilliance. Every stitch, every wash, and every detail exists for a reason. It's a reminder that growth is never linear, that identity is built through movement, and that the people who leave a mark on the world are the ones who refuse to stay still. Created for the outsiders, the creators, the risk-takers, and the visionaries, the Noir Flux Jort is about creating your own frequency. Because fashion fades. Frequency remains. Stay in Flux.",
      images: [
        "/PA%20FLUX/NOIR%20FLUX%20JORT/cover.jpg",
        "/PA%20FLUX/NOIR%20FLUX%20JORT/front.jpeg",
        "/PA%20FLUX/NOIR%20FLUX%20JORT/back.jpeg",
      ],
      variants: [
        {
          id: "variant-pa-flux-noir-jort-m",
          sku: "PA-FLUX-NOIR-JORT-M",
          size: "M",
          color: "Noir Denim",
          priceKobo: 5000000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-noir-jort-l",
          sku: "PA-FLUX-NOIR-JORT-L",
          size: "L",
          color: "Noir Denim",
          priceKobo: 5000000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-noir-jort-xl",
          sku: "PA-FLUX-NOIR-JORT-XL",
          size: "XL",
          color: "Noir Denim",
          priceKobo: 5000000,
          stock: 100,
        },
      ],
    },
    {
      id: "product-pa-flux-noir-quarter-zip",
      name: "Noir Flux Quarter-Zip Polo",
      slug: "noir-flux-quarter-zip-polo",
      description:
        "The evolution of elegance through darkness. Noir Flux is a premium cropped quarter-zip polo that embodies confidence through simplicity. Crafted in an all-black silhouette, it features the signature PA Flux logo on the chest, the brand mantra Stay In Flux, and the number 18 on the sleeve, symbolizing growth, ambition, and the journey ahead. Every detail is intentional, creating a timeless piece that speaks without saying too much.",
      images: [
        "/PA%20FLUX/Black%20Edition%20%E2%80%93%20Noir%20Flux/front-side.jpeg",
      ],
      variants: [
        {
          id: "variant-pa-flux-noir-quarter-zip-m",
          sku: "PA-FLUX-NOIR-QZ-M",
          size: "M",
          color: "Noir Black",
          priceKobo: 2500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-noir-quarter-zip-l",
          sku: "PA-FLUX-NOIR-QZ-L",
          size: "L",
          color: "Noir Black",
          priceKobo: 2500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-noir-quarter-zip-xl",
          sku: "PA-FLUX-NOIR-QZ-XL",
          size: "XL",
          color: "Noir Black",
          priceKobo: 2500000,
          stock: 100,
        },
      ],
    },
    {
      id: "product-pa-flux-terra-quarter-zip",
      name: "Terra Flux Quarter-Zip Polo",
      slug: "terra-flux-quarter-zip-polo",
      description:
        "Terra means earth, symbolizing strong foundations and growth. Terra Flux is where movement meets foundation. Designed in a rich earth-brown tone, this premium cropped quarter-zip polo blends refined minimalism with everyday confidence. It features the signature PA Flux logo, the Stay In Flux mantra, and the number 10 on the sleeve, symbolizing the pursuit of progress through discipline and purpose. Inspired by the strength of the earth, Terra Flux is made for those who remain grounded while constantly evolving. Every stitch reflects resilience, every detail represents intention, and every wear is a reminder that true growth begins with a solid foundation. Rooted in purpose. Driven by evolution. Stay In Flux.",
      images: [
        "/PA%20FLUX/Brown%20Edition%20%E2%80%93%20Terra%20Flux/front-side.jpeg",
      ],
      variants: [
        {
          id: "variant-pa-flux-terra-quarter-zip-m",
          sku: "PA-FLUX-TERRA-QZ-M",
          size: "M",
          color: "Terra Brown",
          priceKobo: 2500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-terra-quarter-zip-l",
          sku: "PA-FLUX-TERRA-QZ-L",
          size: "L",
          color: "Terra Brown",
          priceKobo: 2500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-terra-quarter-zip-xl",
          sku: "PA-FLUX-TERRA-QZ-XL",
          size: "XL",
          color: "Terra Brown",
          priceKobo: 2500000,
          stock: 100,
        },
      ],
    },
    {
      id: "product-pa-flux-pure-quarter-zip",
      name: "Pure Flux Quarter-Zip Polo",
      slug: "pure-flux-quarter-zip-polo",
      description:
        "White Edition, Pure Flux. Designed with confidence and simplicity in mind. Finished in crisp white, the piece features the signature PA logo on the left chest, the Stay In Flux mantra embroidered on the right, and the number 13 on the sleeve, a reminder that identity is built by those who keep moving, even when the odds aren't in their favor. Minimal in design but bold in presence, it's made for people who don't chase trends. They create momentum.",
      images: [
        "/PA%20FLUX/White%20Edition%20%E2%80%93%20Pure%20Flux/front-side.jpeg",
      ],
      variants: [
        {
          id: "variant-pa-flux-pure-quarter-zip-m",
          sku: "PA-FLUX-PURE-QZ-M",
          size: "M",
          color: "Pure White",
          priceKobo: 2500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-pure-quarter-zip-l",
          sku: "PA-FLUX-PURE-QZ-L",
          size: "L",
          color: "Pure White",
          priceKobo: 2500000,
          stock: 100,
        },
        {
          id: "variant-pa-flux-pure-quarter-zip-xl",
          sku: "PA-FLUX-PURE-QZ-XL",
          size: "XL",
          color: "Pure White",
          priceKobo: 2500000,
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
      venue: "D Cube's Place, Opposite RCF Church",
      city: "Ekiti",
      startsAt: new Date("2026-08-07T17:00:00.000Z"),
      status: "COMPLETED",
      heroImage: "/POPSY%20ADONIS%20FLUX%20PARTY.jpeg",
      ticketTiers: [
        {
          id: "tier-summer-time-ekiti-early-bird",
          name: "Regular",
          priceKobo: 500000,
          capacity: 500,
          perks: ["Regular access", "Free swimming", "Free piercing", "Free tattoo sessions"],
        },
        {
          id: "tier-summer-time-ekiti-vip",
          name: "VIP",
          priceKobo: 2_000_000,
          capacity: 100,
          perks: ["VIP access", "Priority entry", "Free swimming", "Free piercing", "Free tattoo sessions"],
        },
        {
          id: "tier-summer-time-ekiti-table-4",
          name: "Table for 4",
          priceKobo: 10_000_000,
          capacity: 20,
          perks: ["Table reservation for 4", "Priority entry", "Group seating", "Free swimming", "Free piercing", "Free tattoo sessions"],
        },
      ],
    },
    {
      id: "event-summer-finale-after-exam-party",
      title: "Summer Finale - After Exam Party",
      slug: "summer-finale-after-exam-party",
      description: `🌊🔥 AFTER THE SUCCESS OF THE FIRST EDITION… WE'RE BACK FOR THE SUMMER FINALE! 🔥🌊

The first edition was a movie, and because the love was massive, we're taking it BIGGER, WETTER & CRAZIER! 👻💦

FLUX SUMMER EXPERIENCE — SUMMER FINALE is happening 5TH SEPTEMBER at DCUBE PLACE, SATELLITE, EKSU! 🎉

To everyone who just finished their exams… this is your chance to breathe, relax and wash away that exam stress! 📚➡️💦

And to all the FINAL YEAR BROTHERS & SISTERS FYB from all departments who are about to leave school… you can't possibly leave without ONE LAST CRAZY PARTY AS A STUDENT! 🎓🔥

Come with your friends. Come with your squad. Come ready to get WET and catch a serious vibe! 😂💦

We've got FOAMING MACHINES, SWIMMING POOL, WATER GUNS, FREE BARBING, FREE PIERCING, FREE HENNA & FREE TATTOO SESSIONS… everything you need for that ultimate WATER SPLASH PARTY EXPERIENCE! 🌊🔫🫧

⏰ 7PM TILL DAWN
📍 DCUBE PLACE, SATELLITE, EKSU
📅 5TH SEPTEMBER

EVERYONE IS INVITED! ❤️‍🔥

Whether you're celebrating finishing exams, celebrating your final year, or you simply want to have the craziest summer experience — LET'S ALL MEET AT DCUBE PLACE! 👻🌊

FLUX SUMMER EXPERIENCE — SUMMER FINALE
ONE LAST SPLASH. ONE LAST MEMORY. ONE BIG NIGHT. 💦🔥`,
      venue: "D Cube's Place, Satellite, EKSU",
      city: "Ekiti",
      startsAt: new Date("2026-09-05T18:00:00.000Z"),
      status: "PUBLISHED",
      heroImage: "/EVENTS/SummerFinale-main.JPG",
      ticketTiers: [
        {
          id: "tier-summer-finale-early-bird",
          name: "Early Bird",
          priceKobo: 350000,
          capacity: 500,
          perks: ["Early access", "Free barbing", "Free tattoo sessions", "Free piercing", "Music and party vibes"],
        },
        {
          id: "tier-summer-finale-vip",
          name: "VIP",
          priceKobo: 2_000_000,
          capacity: 100,
          perks: ["VIP access", "Priority entry", "Free barbing", "Free tattoo sessions", "Free piercing"],
        },
        {
          id: "tier-summer-finale-table-front",
          name: "Table - Front",
          priceKobo: 10_000_000,
          capacity: 10,
          perks: ["Table reservation at the front", "Closest to the stage", "Priority entry", "Group seating", "Free barbing", "Free tattoo sessions", "Free piercing"],
        },
        {
          id: "tier-summer-finale-table-back",
          name: "Table - Back",
          priceKobo: 10_000_000,
          capacity: 10,
          perks: ["Table reservation at the back", "Relaxed placement", "Priority entry", "Group seating", "Free barbing", "Free tattoo sessions", "Free piercing"],
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
        status: event.status,
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
        status: event.status,
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

  await prisma.ticketPromo.updateMany({
    where: {
      ticketTier: {
        eventId: "event-summer-time-ekiti",
      },
    },
    data: {
      isActive: false,
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
        not: "event-summer-finale-after-exam-party",
      },
    },
    data: {
      isActive: false,
    },
  });

  await prisma.event.updateMany({
    where: {
      id: {
        notIn: ["event-summer-finale-after-exam-party", "event-summer-time-ekiti"],
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
