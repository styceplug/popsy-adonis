# Adonis Platform Blueprint

Full-stack architecture for **Adonis**, a Nigerian entertainment, lifestyle, events, trends, and merchandise platform.

The visual direction references Plug Global's public site: sparse sticky navigation, bold lifestyle/editorial typography, large image-led sections, high-contrast content blocks, news/announcement cards, talent/events authority, and a direct merch commerce path.

## Recommended Stack

- **Frontend:** Next.js 15 App Router, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js route handlers or Node.js/Express API
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** Auth.js or Clerk
- **Payments:** Paystack Split Payments for Nigerian cards, bank transfers, USSD, and local rails
- **Media:** Cloudinary or Uploadcare for event galleries, product images, video thumbnails
- **QR:** `qrcode` package for ticket QR payloads
- **Email:** Resend, SendGrid, or ZeptoMail

## Frontend Structure

```txt
app/
  layout.tsx
  page.tsx
  about/page.tsx
  contact/page.tsx
  trends/page.tsx
  trends/[slug]/page.tsx
  events/page.tsx
  events/[slug]/page.tsx
  events/archive/page.tsx
  merch/page.tsx
  merch/[slug]/page.tsx
  cart/page.tsx
  checkout/page.tsx
  account/tickets/page.tsx
  admin/
    posts/page.tsx
    events/page.tsx
    products/page.tsx
components/
  layout/
    SiteHeader.tsx
    MobileNav.tsx
    Footer.tsx
  home/
    HeroShowcase.tsx
    TrendRail.tsx
    UpcomingEvents.tsx
    MerchFeature.tsx
    PastEventStrip.tsx
  trends/
    PostCard.tsx
    MediaEmbed.tsx
    FeaturedPost.tsx
    CategoryTabs.tsx
  events/
    EventCard.tsx
    TicketTierPicker.tsx
    PastEventGallery.tsx
    RecapVideoCard.tsx
    TicketQRCode.tsx
  commerce/
    ProductCard.tsx
    ProductGallery.tsx
    VariantSelector.tsx
    SideCart.tsx
    CheckoutSummary.tsx
  ui/
    Button.tsx
    Badge.tsx
    Sheet.tsx
    Tabs.tsx
    Marquee.tsx
lib/
  api.ts
  cart-store.ts
  format-money.ts
  paystack.ts
  qr.ts
```

## UI/UX Design System

### Layout Language

- Sticky top navigation with `Home`, `About`, `Events`, `Contact us`, and `Buy Merchs`.
- First viewport should immediately communicate the Adonis brand through a full-bleed image/video hero, not a marketing card.
- Use asymmetric editorial grids: one large feature tile paired with smaller stacked cards.
- Keep controls sharp and premium: small radius, tight spacing, high contrast, restrained borders.
- Use large imagery for events, trend posts, product detail pages, and archive galleries.

### Tailwind Theme Tokens

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        coal: "#101010",
        bone: "#F5F0E8",
        paper: "#FFFDF8",
        line: "rgba(255,255,255,0.14)",
        gold: "#C8A24A",
        lava: "#F24A2E",
        electric: "#00D1FF"
      },
      fontFamily: {
        display: ["var(--font-satoshi)", "Inter", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        ui: "8px"
      },
      boxShadow: {
        glow: "0 0 60px rgba(200, 162, 74, 0.18)"
      }
    }
  }
};

export default config;
```

### Core Shell

```tsx
// components/layout/SiteHeader.tsx
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

const nav = [
  ["Home", "/"],
  ["About", "/about"],
  ["Events", "/events"],
  ["Contact us", "/contact"]
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/78 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="font-display text-xl font-black uppercase tracking-none text-paper">
          Adonis
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-paper/72 md:flex">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-paper">
              {label}
            </Link>
          ))}
        </nav>

        <Link
          href="/merch"
          className="inline-flex h-10 items-center gap-2 rounded-ui bg-paper px-4 text-sm font-bold text-ink transition hover:bg-gold"
        >
          <ShoppingBag size={16} />
          Buy Merchs
        </Link>
      </div>
    </header>
  );
}
```

### Home Page Composition

```tsx
// app/page.tsx
import { HeroShowcase } from "@/components/home/HeroShowcase";
import { TrendRail } from "@/components/home/TrendRail";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { MerchFeature } from "@/components/home/MerchFeature";
import { PastEventStrip } from "@/components/home/PastEventStrip";

export default function HomePage() {
  return (
    <main className="bg-ink text-paper">
      <HeroShowcase />
      <TrendRail />
      <UpcomingEvents />
      <PastEventStrip />
      <MerchFeature />
    </main>
  );
}
```

## Database Schema

Prisma schema covering users, CMS posts, events, ticketing, commerce, orders, and transactions.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
  STAFF
}

enum PostType {
  ARTICLE
  MUSIC_RELEASE
  TREND_UPDATE
}

enum EventStatus {
  DRAFT
  PUBLISHED
  SOLD_OUT
  COMPLETED
  CANCELLED
}

enum OrderStatus {
  PENDING
  PAID
  FAILED
  CANCELLED
  FULFILLED
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
  ABANDONED
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String?
  firstName    String?
  lastName     String?
  phone        String?
  role         Role          @default(USER)
  orders       Order[]
  tickets      Ticket[]
  posts        Post[]        @relation("PostAuthor")
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  excerpt     String?
  body        String
  type        PostType  @default(ARTICLE)
  coverImage  String?
  videoUrl    String?
  audioUrl    String?
  category    String?
  tags        String[]
  isFeatured  Boolean   @default(false)
  publishedAt DateTime?
  authorId    String?
  author      User?     @relation("PostAuthor", fields: [authorId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Event {
  id             String        @id @default(cuid())
  title          String
  slug           String        @unique
  description    String
  venue          String
  city           String        @default("Lagos")
  startsAt       DateTime
  endsAt         DateTime?
  status         EventStatus   @default(DRAFT)
  heroImage      String?
  recapVideoUrl  String?
  gallery        EventMedia[]
  ticketTiers    TicketTier[]
  tickets        Ticket[]
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([startsAt, status])
}

model EventMedia {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  url       String
  type      String   // image | video
  caption   String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}

model TicketTier {
  id          String   @id @default(cuid())
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String   // Regular, VIP, VVIP
  priceKobo   Int
  capacity    Int
  soldCount   Int      @default(0)
  perks       String[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([eventId, name])
}

model Ticket {
  id           String    @id @default(cuid())
  eventId      String
  event        Event     @relation(fields: [eventId], references: [id])
  tierId       String
  userId       String?
  user         User?     @relation(fields: [userId], references: [id])
  orderId      String
  order        Order     @relation(fields: [orderId], references: [id])
  attendeeName String?
  attendeeEmail String?
  qrCode       String    @unique
  qrImageUrl   String?
  checkedInAt  DateTime?
  createdAt    DateTime  @default(now())

  @@index([eventId, qrCode])
}

model Product {
  id          String           @id @default(cuid())
  name        String
  slug        String           @unique
  description String
  status      ProductStatus    @default(DRAFT)
  images      String[]
  variants    ProductVariant[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model ProductVariant {
  id          String      @id @default(cuid())
  productId   String
  product     Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku         String      @unique
  size        String?
  color       String?
  priceKobo   Int
  stock       Int         @default(0)
  orderItems  OrderItem[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Order {
  id              String       @id @default(cuid())
  userId          String?
  user            User?        @relation(fields: [userId], references: [id])
  email           String
  phone           String?
  status          OrderStatus  @default(PENDING)
  subtotalKobo    Int
  platformFeeKobo Int
  totalKobo       Int
  currency        String       @default("NGN")
  items           OrderItem[]
  tickets         Ticket[]
  transaction     Transaction?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

model OrderItem {
  id          String          @id @default(cuid())
  orderId     String
  order       Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variantId   String?
  variant     ProductVariant? @relation(fields: [variantId], references: [id])
  ticketTierId String?
  itemType    String          // product | ticket
  title       String
  quantity    Int
  unitKobo    Int
  totalKobo   Int
  metadata    Json?
}

model Transaction {
  id                  String            @id @default(cuid())
  orderId             String            @unique
  order               Order             @relation(fields: [orderId], references: [id], onDelete: Cascade)
  gateway             String            @default("paystack")
  reference           String            @unique
  gatewayAccessCode   String?
  gatewayAuthUrl      String?
  status              TransactionStatus @default(PENDING)
  amountKobo          Int
  developerFeeKobo    Int
  adonisAmountKobo    Int
  splitCode           String?
  gatewayResponse     Json?
  paidAt              DateTime?
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
}
```

## API Routing Logic

```txt
GET    /api/posts
GET    /api/posts/:slug
POST   /api/admin/posts
PATCH  /api/admin/posts/:id

GET    /api/events?status=upcoming
GET    /api/events/archive
GET    /api/events/:slug
POST   /api/admin/events
POST   /api/admin/events/:id/ticket-tiers
POST   /api/tickets/validate

GET    /api/products
GET    /api/products/:slug
POST   /api/admin/products
POST   /api/admin/products/:id/variants

POST   /api/checkout/initialize
POST   /api/payments/paystack/webhook
GET    /api/orders/:id
GET    /api/account/tickets
```

## Checkout Payload

The client sends a mixed cart of tickets and merchandise. The server owns all prices.

```ts
type CheckoutPayload = {
  email: string;
  phone?: string;
  customerName?: string;
  items: Array<
    | {
        type: "ticket";
        eventId: string;
        ticketTierId: string;
        quantity: number;
        attendeeNames?: string[];
      }
    | {
        type: "product";
        variantId: string;
        quantity: number;
      }
  >;
};
```

## Paystack Split Payment Controller

Paystack supports simple split payments using a `subaccount` and multi-party transaction splits using a `split_code`. For this platform, use a transaction split group because it leaves room for future merch collaborators, event partners, or sponsor revenue rules.

Recommended Paystack setup:

1. Let **Adonis** own the primary Paystack integration so the main settlement account belongs to the agency.
2. Create the **developer/platform** bank account as a Paystack subaccount.
3. Create a percentage transaction split where the developer subaccount receives the agreed commission share and the Adonis account receives the remaining share.
4. Store the resulting `split_code` in `PAYSTACK_ADONIS_SPLIT_CODE`.

If you only ever need a two-party split, Paystack's simpler `subaccount` flow can also work. In that model, the owner of the Paystack integration receives the platform fee and the subaccount receives the balance, controlled by the subaccount's `percentage_charge` or a checkout-level `transaction_charge`.

Recommended environment variables:

```bash
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_ADONIS_SPLIT_CODE=SPL_xxx
DEVELOPER_COMMISSION_BPS=1000
PUBLIC_APP_URL=https://adonis.ng
```

`DEVELOPER_COMMISSION_BPS=1000` means 10%. Use basis points so the math stays precise.

```ts
// server/controllers/checkout.controller.ts
import crypto from "node:crypto";
import express from "express";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma";

const router = express.Router();

const PAYSTACK_INITIALIZE_URL = "https://api.paystack.co/transaction/initialize";
const DEVELOPER_COMMISSION_BPS = Number(process.env.DEVELOPER_COMMISSION_BPS ?? 1000);

function makeReference() {
  return `ADONIS_${Date.now()}_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

function calculateDeveloperFee(totalKobo: number) {
  return Math.round((totalKobo * DEVELOPER_COMMISSION_BPS) / 10_000);
}

router.post("/checkout/initialize", async (req, res) => {
  const { email, phone, customerName, items } = req.body;

  if (!email || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Email and cart items are required." });
  }

  const reference = makeReference();

  const result = await prisma.$transaction(async (tx) => {
    const orderItems = [];

    for (const item of items) {
      if (item.type === "product") {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true }
        });

        if (!variant || variant.stock < item.quantity || variant.product.status !== "ACTIVE") {
          throw new Error("A product in your cart is unavailable.");
        }

        orderItems.push({
          itemType: "product",
          variantId: variant.id,
          title: variant.product.name,
          quantity: item.quantity,
          unitKobo: variant.priceKobo,
          totalKobo: variant.priceKobo * item.quantity,
          metadata: { size: variant.size, color: variant.color, sku: variant.sku }
        });
      }

      if (item.type === "ticket") {
        const tier = await tx.ticketTier.findUnique({
          where: { id: item.ticketTierId },
          include: { event: true }
        });

        if (!tier || !tier.isActive || tier.event.status !== "PUBLISHED") {
          throw new Error("A ticket in your cart is unavailable.");
        }

        const remaining = tier.capacity - tier.soldCount;
        if (remaining < item.quantity) {
          throw new Error(`${tier.name} tickets are almost sold out. Only ${remaining} left.`);
        }

        orderItems.push({
          itemType: "ticket",
          ticketTierId: tier.id,
          title: `${tier.event.title} - ${tier.name}`,
          quantity: item.quantity,
          unitKobo: tier.priceKobo,
          totalKobo: tier.priceKobo * item.quantity,
          metadata: {
            eventId: tier.eventId,
            ticketTierId: tier.id,
            attendeeNames: item.attendeeNames ?? []
          }
        });
      }
    }

    const subtotalKobo = orderItems.reduce((sum, item) => sum + item.totalKobo, 0);
    const developerFeeKobo = calculateDeveloperFee(subtotalKobo);
    const adonisAmountKobo = subtotalKobo - developerFeeKobo;

    const order = await tx.order.create({
      data: {
        email,
        phone,
        subtotalKobo,
        platformFeeKobo: developerFeeKobo,
        totalKobo: subtotalKobo,
        items: { create: orderItems }
      },
      include: { items: true }
    });

    const transaction = await tx.transaction.create({
      data: {
        orderId: order.id,
        reference,
        amountKobo: subtotalKobo,
        developerFeeKobo,
        adonisAmountKobo,
        splitCode: process.env.PAYSTACK_ADONIS_SPLIT_CODE
      }
    });

    return { order, transaction };
  });

  const paystackResponse = await fetch(PAYSTACK_INITIALIZE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      amount: result.order.totalKobo,
      reference,
      currency: "NGN",
      callback_url: `${process.env.PUBLIC_APP_URL}/checkout/success?reference=${reference}`,
      split_code: process.env.PAYSTACK_ADONIS_SPLIT_CODE,
      metadata: {
        orderId: result.order.id,
        customerName,
        phone,
        developerFeeKobo: result.transaction.developerFeeKobo,
        adonisAmountKobo: result.transaction.adonisAmountKobo,
        cartTypes: [...new Set(result.order.items.map((item) => item.itemType))]
      }
    })
  });

  const payload = await paystackResponse.json();

  if (!paystackResponse.ok || !payload.status) {
    await prisma.transaction.update({
      where: { reference },
      data: { status: "FAILED", gatewayResponse: payload }
    });

    return res.status(502).json({
      message: "Unable to initialize payment.",
      gateway: payload
    });
  }

  await prisma.transaction.update({
    where: { reference },
    data: {
      gatewayAccessCode: payload.data.access_code,
      gatewayAuthUrl: payload.data.authorization_url,
      gatewayResponse: payload
    }
  });

  return res.status(201).json({
    orderId: result.order.id,
    reference,
    authorizationUrl: payload.data.authorization_url,
    accessCode: payload.data.access_code
  });
});

export default router;
```

## Paystack Webhook And QR Ticket Issuance

Only issue tickets after Paystack confirms success via webhook. The QR payload should be opaque and server-verifiable.

```ts
// server/controllers/paystack-webhook.controller.ts
import crypto from "node:crypto";
import express from "express";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma";

const router = express.Router();

function verifyPaystackSignature(rawBody: Buffer, signature: string | undefined) {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}

router.post("/payments/paystack/webhook", async (req, res) => {
  if (!verifyPaystackSignature(req.body, req.headers["x-paystack-signature"] as string)) {
    return res.sendStatus(401);
  }

  const event = JSON.parse(req.body.toString("utf8"));

  if (event.event !== "charge.success") {
    return res.sendStatus(200);
  }

  const reference = event.data.reference;

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { reference },
      include: { order: { include: { items: true } } }
    });

    if (!transaction || transaction.status === "SUCCESS") return;

    await tx.transaction.update({
      where: { reference },
      data: {
        status: "SUCCESS",
        paidAt: new Date(event.data.paid_at),
        gatewayResponse: event
      }
    });

    await tx.order.update({
      where: { id: transaction.orderId },
      data: { status: "PAID" }
    });

    for (const item of transaction.order.items) {
      if (item.itemType === "product" && item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      if (item.itemType === "ticket" && item.ticketTierId) {
        const metadata = item.metadata as {
          eventId: string;
          ticketTierId: string;
          attendeeNames?: string[];
        };

        await tx.ticketTier.update({
          where: { id: item.ticketTierId },
          data: { soldCount: { increment: item.quantity } }
        });

        for (let index = 0; index < item.quantity; index += 1) {
          const qrCode = crypto.randomBytes(24).toString("hex");
          const qrPayload = JSON.stringify({
            ticket: qrCode,
            orderId: transaction.orderId,
            eventId: metadata.eventId
          });
          const qrImageUrl = await QRCode.toDataURL(qrPayload);

          await tx.ticket.create({
            data: {
              orderId: transaction.orderId,
              eventId: metadata.eventId,
              tierId: metadata.ticketTierId,
              attendeeName: metadata.attendeeNames?.[index],
              attendeeEmail: transaction.order.email,
              qrCode,
              qrImageUrl
            }
          });
        }
      }
    }
  });

  return res.sendStatus(200);
});

export default router;
```

## Gate Validation Logic

```ts
// server/controllers/tickets.controller.ts
router.post("/tickets/validate", async (req, res) => {
  const { qrCode } = req.body;

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    include: { event: true }
  });

  if (!ticket) {
    return res.status(404).json({ valid: false, message: "Ticket not found." });
  }

  if (ticket.checkedInAt) {
    return res.status(409).json({
      valid: false,
      message: "Ticket has already been checked in.",
      checkedInAt: ticket.checkedInAt
    });
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { checkedInAt: new Date() }
  });

  return res.json({
    valid: true,
    message: "Ticket validated.",
    ticket: updatedTicket
  });
});
```

## Important Payment Notes

- Use a Paystack **split code** owned/configured in the Paystack dashboard or created once through the Paystack Split API.
- The Adonis agency account should be the main settlement account.
- The developer account should be attached as a subaccount/recipient in the split configuration.
- Store the effective split amounts on your own `Transaction` row for audits and reconciliation.
- Never trust client-side prices, commissions, product stock, or ticket availability.
- Verify every successful payment through webhook signature validation before fulfilling tickets or products.
- For Flutterwave, use payment plans/subaccounts and pass split details during payment initialization, but Paystack is generally the cleaner default for this Nigerian-market requirement.
