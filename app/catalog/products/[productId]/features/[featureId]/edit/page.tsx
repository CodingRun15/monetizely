import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AvailabilityRow } from "./AvailabilityRow";

export default async function EditFeatureAvailabilityPage({
  params,
}: {
  params: Promise<{ productId: string; featureId: string }>;
}) {
  const { productId, featureId } = await params;

  const [product, feature] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { tiers: { orderBy: { order: "asc" } } },
    }),
    prisma.feature.findUnique({
      where: { id: featureId },
      include: { availabilities: { include: { addonPricing: true } } },
    }),
  ]);

  if (!product || !feature || feature.productId !== productId) {
    notFound();
  }

  const byTier = new Map(feature.availabilities.map((a) => [a.tierId, a]));

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="border-b border-rule pb-4">
        <Link
          href={`/catalog/products/${product.id}`}
          className="text-xs uppercase tracking-[0.12em] text-ink-soft hover:text-emerald"
        >
          ← {product.name}
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">{feature.name}</h1>
      </div>

      <p className="text-sm text-ink-soft">
        Set this feature&apos;s availability for each tier. Add-ons need a pricing model and value;
        the same feature can be priced differently per tier.
      </p>

      <div className="flex flex-col">
        <div className="grid grid-cols-[8rem_10rem_1fr_1fr_auto] gap-3 border-b-2 border-ink/80 pb-2 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
          <span>Tier</span>
          <span>Availability</span>
          <span>Pricing model</span>
          <span>Value</span>
          <span />
        </div>
        {product.tiers.map((tier) => {
          const cell = byTier.get(tier.id);
          return (
            <AvailabilityRow
              key={tier.id}
              productId={product.id}
              featureId={feature.id}
              tier={{ id: tier.id, name: tier.name }}
              initialAvailability={cell?.availability ?? "NOT_AVAILABLE"}
              initialPricingModel={cell?.addonPricing?.pricingModel ?? null}
              initialPricingValue={cell?.addonPricing ? Number(cell.addonPricing.pricingValue) : null}
            />
          );
        })}
      </div>
    </div>
  );
}
