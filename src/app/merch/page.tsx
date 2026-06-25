import type { Metadata } from "next";
import { MerchPageClient } from "@/components/commerce/merch-page-client";

export const metadata: Metadata = {
  title: "PA FLUX Store | Popsy Adonis",
  description:
    "PA FLUX is the official Popsy Adonis clothing line: premium streetwear, limited drops, and culture-led merchandise from Nigeria's entertainment scene.",
  alternates: {
    canonical: "/merch",
  },
};

export default function MerchPage() {
  return <MerchPageClient />;
}
