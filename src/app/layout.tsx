import type { Metadata } from "next";
import { ReferralCapture } from "@/components/affiliate/referral-capture";
import { CartLink } from "@/components/checkout/cart-link";
import { CartProvider } from "@/components/providers/cart-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { brand } from "@/lib/sample-data";
import { DEFAULT_OG_IMAGE, HOME_DESCRIPTION, HOME_TITLE, SITE_NAME } from "@/lib/seo";
import "./globals.css";

const siteUrl = "https://popsyadonis.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.jpg",
    shortcut: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
  // Each page sets its own title and link (see openGraphFor). Nothing page-specific goes here,
  // or every page that forgets to set its own would share the homepage's preview.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_NG",
    images: [DEFAULT_OG_IMAGE],
  },
  // X reads the title, description and image from the Open Graph tags above.
  twitter: {
    card: "summary_large_image",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: brand.siteName,
  url: siteUrl,
  logo: `${siteUrl}/favicon.jpg`,
  email: brand.email,
  telephone: brand.phone,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ekiti",
    addressCountry: "NG",
  },
  sameAs: brand.socials.map((social) => social.href),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-ink text-paper">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <ReferralCapture />
        <CartProvider>
          <SiteHeader />
          {children}
          <CartLink />
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
