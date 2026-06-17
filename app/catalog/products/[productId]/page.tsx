import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateTierBasePrice } from "@/app/actions/catalog-actions";

function formatMoney(value: number | { toString(): string }): string {
  return `$${Number(value).toFixed(2)}`;
}

function addonSummary(pricingModel: string, pricingValue: number): string {
  switch (pricingModel) {
    case "FIXED_MONTHLY":
      return `${formatMoney(pricingValue)}/mo flat`;
    case "PER_SEAT":
      return `${formatMoney(pricingValue)}/seat/mo`;
    case "PERCENT_OF_PRODUCT":
      return `${pricingValue}% of product cost`;
    default:
      return "";
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      tiers: { orderBy: { order: "asc" } },
      features: {
        orderBy: { createdAt: "asc" },
        include: { availabilities: { include: { addonPricing: true } } },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const tiers = product.tiers;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <Link href="/catalog" className="text-sm text-zinc-500 hover:underline">
          ← Back to catalog
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Tiers</h2>
          <Link
            href={`/catalog/products/${product.id}/tiers/new`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100"
          >
            + New tier
          </Link>
        </div>

        {tiers.length === 0 ? (
          <p className="text-zinc-600">No tiers yet.</p>
        ) : (
          <table className="w-full border-collapse overflow-hidden rounded-md border border-zinc-200 bg-white text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-medium">Tier</th>
                <th className="px-4 py-2 font-medium">Order</th>
                <th className="px-4 py-2 font-medium">Base price (per seat / month)</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 font-medium">{tier.name}</td>
                  <td className="px-4 py-2 text-zinc-500">{tier.order}</td>
                  <td className="px-4 py-2">
                    <form action={updateTierBasePrice} className="flex items-center gap-2">
                      <input type="hidden" name="tierId" value={tier.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <span className="text-zinc-500">$</span>
                      <input
                        type="number"
                        name="basePricePerSeat"
                        step="0.01"
                        min="0"
                        defaultValue={tier.basePricePerSeat.toString()}
                        className="w-24 rounded-md border border-zinc-300 px-2 py-1"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-zinc-300 px-2 py-1 font-medium hover:bg-zinc-100"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Feature availability by tier</h2>
          <Link
            href={`/catalog/products/${product.id}/features/new`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100"
          >
            + New feature
          </Link>
        </div>

        {product.features.length === 0 || tiers.length === 0 ? (
          <p className="text-zinc-600">
            {tiers.length === 0
              ? "Add at least one tier before configuring features."
              : "No features yet."}
          </p>
        ) : (
          <table className="w-full border-collapse overflow-hidden rounded-md border border-zinc-200 bg-white text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-4 py-2 font-medium">Feature</th>
                {tiers.map((tier) => (
                  <th key={tier.id} className="px-4 py-2 font-medium">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {product.features.map((feature) => {
                const byTier = new Map(feature.availabilities.map((a) => [a.tierId, a]));
                return (
                  <tr key={feature.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2 font-medium">
                      <Link
                        href={`/catalog/products/${product.id}/features/${feature.id}/edit`}
                        className="hover:underline"
                      >
                        {feature.name}
                      </Link>
                    </td>
                    {tiers.map((tier) => {
                      const cell = byTier.get(tier.id);
                      const availability = cell?.availability ?? "NOT_AVAILABLE";
                      return (
                        <td key={tier.id} className="px-4 py-2">
                          {availability === "INCLUDED" && (
                            <span className="text-green-700">Included</span>
                          )}
                          {availability === "NOT_AVAILABLE" && (
                            <span className="text-zinc-400">Not available</span>
                          )}
                          {availability === "ADDON" && cell?.addonPricing && (
                            <span className="text-amber-700">
                              Add-on — {addonSummary(cell.addonPricing.pricingModel, Number(cell.addonPricing.pricingValue))}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
