import Link from "next/link";
import { prisma } from "@/lib/db";
import { QuoteForm, type ProductOption } from "./QuoteForm";

export default async function NewQuotePage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      tiers: {
        orderBy: { order: "asc" },
        include: {
          availabilities: {
            where: { availability: "ADDON" },
            include: { addonPricing: true, feature: true },
          },
        },
      },
    },
  });

  if (products.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl text-ink">New quote</h1>
        <p className="text-sm text-ink-soft">
          No products in the catalog yet.{" "}
          <Link href="/catalog/products/new" className="text-emerald underline">
            Create one first
          </Link>
          .
        </p>
      </div>
    );
  }

  const productOptions: ProductOption[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    tiers: product.tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      basePricePerSeat: Number(tier.basePricePerSeat),
      addons: tier.availabilities
        .filter((a) => a.addonPricing)
        .map((a) => ({
          featureId: a.featureId,
          featureName: a.feature.name,
          pricingModel: a.addonPricing!.pricingModel,
          pricingValue: Number(a.addonPricing!.pricingValue),
        })),
    })),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-rule pb-6">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Quote builder</span>
        <h1 className="font-display text-3xl text-ink">New quote</h1>
      </div>
      <QuoteForm products={productOptions} />
    </div>
  );
}
