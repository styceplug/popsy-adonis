# Popsy Adonis

A full-stack starter for Popsy Adonis, a Nigerian entertainment and lifestyle agency focused on pop culture trends, artist portfolios, music/event promotions, event hosting, ticketing, and PA FLUX clothing.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Prisma + PostgreSQL
- Paystack subaccount checkout architecture
- Ticket fee model with 5% customer Transaction Fee, 2.5% organizer commission, and Paystack fees borne by Dream
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
NEXT_PUBLIC_APP_URL="https://popsyadonis.com"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxx"
PAYSTACK_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxx"
PAYSTACK_ADONIS_SUBACCOUNT_CODE="ACCT_xxx"
PAYSTACK_DREAM_SUBACCOUNT_CODE="ACCT_xxx"
PAYSTACK_ADONIS_SPLIT_CODE="SPL_xxx"
RESEND_API_KEY="re_xxx"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="hello@popsyadonis.com"
SMTP_PASS="smtp-password"
MAIL_FROM="Popsy Adonis <hello@popsyadonis.com>"
MAIL_TO="adonistv.001@gmail.com"
ADMIN_ACCESS_PASSWORD="Popsysummerparty"
ADMIN_SESSION_SECRET="generate-a-long-random-secret"
CLOUDINARY_CLOUD_NAME="xxx"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"
```

Ticket checkout uses shared helpers in `src/lib/fees.ts`: customer Transaction Fee is 5% of ticket price with ₦150 minimum and ₦5,000 maximum, organizer commission is 2.5% of ticket price, Paystack fees are borne by Dream, and Paystack receives all amounts in kobo.

## Key Routes

- `/` - Popsy Adonis homepage
- `/trends` - trends and promotions CMS surface
- `/artists` - artist portfolio/catalog
- `/events` - upcoming event listings
- `/events/archive` - past event proof gallery
- `/merch` - PA FLUX storefront
- `/checkout` - cart review and Paystack checkout
- `/checkout/success?reference=...` - post-payment status page
- `/api/checkout/initialize` - Paystack checkout initialization with dynamic flat split between Adonis and Dream
- `/api/orders/:reference` - order/payment status lookup
- `/api/contact` - contact-form email notification endpoint
- `/api/payments/paystack/webhook` - payment confirmation, inventory updates, QR ticket issuance
- `/api/tickets/validate` - gate validation endpoint
- `/admin/login` - staff/admin login
- `/admin/checkin` - ticket scanner and manual check-in
- `/admin/tickets` - ticket record lookup
- `/admin/logs` - staff action audit logs

## Notes

The current public pages use sample data in `src/lib/sample-data.ts`. Checkout uses the database-backed products, variants, events, and ticket tiers seeded by `npm run db:seed`.

## Third-Party Setup Roadmap

1. **Payments:** create a Paystack business account, add Adonis and Dream as subaccounts, then configure `PAYSTACK_ADONIS_SUBACCOUNT_CODE` and `PAYSTACK_DREAM_SUBACCOUNT_CODE`. Checkout sends a dynamic flat split so Adonis receives ticket price minus 2.5% organizer commission, while Dream receives the customer Transaction Fee plus the 2.5% organizer commission. Paystack processing fees are deducted from Dream via `bearer_subaccount`.
2. **Mail:** configure SMTP credentials for Nodemailer using `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS`. Resend remains supported as a fallback through `RESEND_API_KEY`. Ticket orders send one QR email to reduce quota usage.
3. **Media:** create a Cloudinary account for artist photos, event galleries, recap thumbnails, product images, and CMS media.
4. **Database:** provision PostgreSQL, set `DATABASE_URL`, run Prisma migrations, and seed posts/events/products/artists.
5. **Operations:** optionally add WhatsApp Business API for booking alerts and ticket support.
