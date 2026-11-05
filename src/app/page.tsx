import type { Metadata } from "next";
import { HeroShowcase } from "@/components/home/hero-showcase";
import { MerchFeature } from "@/components/home/merch-feature";
import { PastEventStrip } from "@/components/home/past-event-strip";
import { TrendRail } from "@/components/home/trend-rail";
import { UpcomingEvents } from "@/components/home/upcoming-events";
import { HOME_DESCRIPTION, HOME_TITLE, openGraphFor } from "@/lib/seo";

export const metadata: Metadata = {
  openGraph: openGraphFor({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/" }),
};

// Read merch and other content on every visit, so admin changes show without a rebuild.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <HeroShowcase />
      <TrendRail />
      <UpcomingEvents />
      <PastEventStrip />
      <MerchFeature />
    </main>
  );
}
