import type { Metadata } from "next";
import { CartLink } from "@/components/checkout/cart-link";
import { CartProvider } from "@/components/providers/cart-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://popsyadonis.com"),
  title: "Popsy Adonis | Nigerian Entertainment, Artists, Events & PA FLUX",
  description:
    "A high-end Nigerian entertainment and lifestyle platform for trends, artist portfolios, events, promotions, ticketing, and PA FLUX clothing.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-ink text-paper">
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
