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
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">
          {feature.name} <span className="text-zinc-400">— {product.name}</span>
        </h1>
        <Link href={`/catalog/products/${product.id}`} className="text-sm text-zinc-500 hover:underline">
          ← Back to {product.name}
        </Link>
      </div>

      <p className="text-sm text-zinc-600">
        Set this feature&apos;s availability for each tier. Add-ons need a pricing model and value;
        the same feature can be priced differently per tier.
      </p>

      <div className="rounded-md border border-zinc-200 bg-white px-4">
        <div className="grid grid-cols-[8rem_10rem_1fr_1fr_auto] gap-3 border-b border-zinc-200 py-2 text-sm font-medium text-zinc-500">
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
              tier={tier}
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
