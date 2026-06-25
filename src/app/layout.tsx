import type { Metadata } from "next";
import { CartLink } from "@/components/checkout/cart-link";
import { CartProvider } from "@/components/providers/cart-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { brand } from "@/lib/sample-data";
import "./globals.css";

const siteUrl = "https://popsyadonis.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Popsy Adonis | Nigerian Entertainment, Artists, Events & PA FLUX",
  description:
    "A high-end Nigerian entertainment and lifestyle platform for trends, artist portfolios, events, promotions, ticketing, and PA FLUX clothing.",
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
  openGraph: {
    siteName: "Popsy Adonis",
    type: "website",
    locale: "en_NG",
    url: "https://popsyadonis.com",
    title: "Popsy Adonis | Nigerian Entertainment, Artists, Events & PA FLUX",
    description:
      "A high-end Nigerian entertainment and lifestyle platform for trends, artist portfolios, events, promotions, ticketing, and PA FLUX clothing.",
    images: [
      {
        url: "/POPSY%20ADONIS%20FLUX%20PARTY.png",
        width: 1200,
        height: 630,
        alt: "Popsy Adonis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Popsy Adonis | Nigerian Entertainment, Artists, Events & PA FLUX",
    description:
      "A high-end Nigerian entertainment and lifestyle platform for trends, artist portfolios, events, promotions, ticketing, and PA FLUX clothing.",
    images: ["/POPSY%20ADONIS%20FLUX%20PARTY.png"],
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
