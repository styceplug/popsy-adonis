import { redirect } from "next/navigation";

export default async function MerchProductRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/paflux/${slug}`);
}
