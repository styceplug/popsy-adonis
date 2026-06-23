import { HeroShowcase } from "@/components/home/hero-showcase";
import { MerchFeature } from "@/components/home/merch-feature";
import { PastEventStrip } from "@/components/home/past-event-strip";
import { TrendRail } from "@/components/home/trend-rail";
import { UpcomingEvents } from "@/components/home/upcoming-events";

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
