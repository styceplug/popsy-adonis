export const metadata = {
  title: "Affiliates | Popsy Adonis",
  robots: { index: false, follow: false },
};

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-ink text-paper">
      <style>
        {`
          [data-site-header],
          [data-site-footer],
          [data-cart-link] {
            display: none !important;
          }
        `}
      </style>
      {children}
    </main>
  );
}
