# Popsy Adonis

A full-stack starter for Popsy Adonis, a Nigerian entertainment and lifestyle agency focused on pop culture trends, artist portfolios, music/event promotions, event hosting, ticketing, and PA FLUX clothing.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Prisma + PostgreSQL
- Paystack split-payment checkout architecture
- 5% customer transaction fee capped at ₦5,000 per checkout
- QR ticket generation and validation endpoints
- Artist portfolio/catalog pages
- Contact and social media surfaces

## Run Locally

```bash
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

Open `http://localhost:3000`.

## Environment

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adonis"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxx"
PAYSTACK_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxx"
PAYSTACK_POPSY_ADONIS_SPLIT_CODE="SPL_xxx"
DEVELOPER_COMMISSION_BPS="500"
RESEND_API_KEY="re_xxx"
MAIL_FROM="Popsy Adonis <hello@popsyadonis.com>"
MAIL_TO="bookings@popsyadonis.com"
CLOUDINARY_CLOUD_NAME="xxx"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"
```

`DEVELOPER_COMMISSION_BPS=500` means 5%. The checkout fee is capped at ₦5,000 per transaction.

## Key Routes

- `/` - Popsy Adonis homepage
- `/trends` - trends and promotions CMS surface
- `/artists` - artist portfolio/catalog
- `/events` - upcoming event listings
- `/events/archive` - past event proof gallery
- `/merch` - PA FLUX storefront
- `/checkout` - cart review and Paystack checkout
- `/checkout/success?reference=...` - post-payment status page
- `/api/checkout/initialize` - Paystack checkout initialization with split code
- `/api/orders/:reference` - order/payment status lookup
- `/api/contact` - contact-form email notification endpoint
- `/api/payments/paystack/webhook` - payment confirmation, inventory updates, QR ticket issuance
- `/api/tickets/validate` - gate validation endpoint

## Notes

The current public pages use sample data in `src/lib/sample-data.ts`. Checkout uses the database-backed products, variants, events, and ticket tiers seeded by `npm run db:seed`.

## Third-Party Setup Roadmap

1. **Payments:** create a Paystack business account for Popsy Adonis, add the developer/platform bank account as a subaccount, create a transaction split, then place the split code in `PAYSTACK_POPSY_ADONIS_SPLIT_CODE`.
2. **Mail:** create a Resend account, verify the sending domain, add `RESEND_API_KEY`, then send purchase receipts, QR ticket emails, order confirmations, and contact-form notifications.
3. **Media:** create a Cloudinary account for artist photos, event galleries, recap thumbnails, product images, and CMS media.
4. **Database:** provision PostgreSQL, set `DATABASE_URL`, run Prisma migrations, and seed posts/events/products/artists.
5. **Operations:** optionally add WhatsApp Business API for booking alerts and ticket support.
