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

function AvailabilityBadge({
  availability,
  pricingModel,
  pricingValue,
}: {
  availability: string;
  pricingModel?: string;
  pricingValue?: number;
}) {
  if (availability === "INCLUDED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-emerald">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden />
        Included
      </span>
    );
  }
  if (availability === "ADDON" && pricingModel && pricingValue !== undefined) {
    return (
      <span className="inline-flex items-center rounded-sm border border-gold/40 bg-gold-soft px-2 py-0.5 font-mono text-xs text-gold">
        {addonSummary(pricingModel, pricingValue)}
      </span>
    );
  }
  return <span className="text-sm text-not-available">—</span>;
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
      <div className="border-b border-rule pb-6">
        <Link href="/catalog" className="text-xs uppercase tracking-[0.12em] text-ink-soft hover:text-emerald">
          ← Catalog
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink">{product.name}</h1>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Tiers</h2>
          <Link
            href={`/catalog/products/${product.id}/tiers/new`}
            className="rounded-sm border border-rule px-3 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-ink-soft hover:border-emerald hover:text-emerald"
          >
            + New tier
          </Link>
        </div>

        {tiers.length === 0 ? (
          <p className="text-sm text-ink-soft">No tiers yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-ink/80 text-left text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
                <th className="py-2 pr-4 font-medium">Tier</th>
                <th className="py-2 pr-4 font-medium">Order</th>
                <th className="py-2 font-medium">Base price (per seat / month)</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id} className="border-b border-rule-soft last:border-0">
                  <td className="py-3 pr-4 font-display text-base text-ink">{tier.name}</td>
                  <td className="py-3 pr-4 font-mono text-ink-soft">{tier.order}</td>
                  <td className="py-3">
                    <form action={updateTierBasePrice} className="flex items-center gap-2">
                      <input type="hidden" name="tierId" value={tier.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <span className="font-mono text-ink-soft">$</span>
                      <input
                        type="number"
                        name="basePricePerSeat"
                        step="0.01"
                        min="0"
                        defaultValue={tier.basePricePerSeat.toString()}
                        className="w-24 rounded-sm border border-rule bg-paper px-2 py-1 font-mono"
                      />
                      <button
                        type="submit"
                        className="rounded-sm border border-rule px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft hover:border-emerald hover:text-emerald"
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
          <h2 className="font-display text-lg text-ink">Feature availability by tier</h2>
          <Link
            href={`/catalog/products/${product.id}/features/new`}
            className="rounded-sm border border-rule px-3 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-ink-soft hover:border-emerald hover:text-emerald"
          >
            + New feature
          </Link>
        </div>

        {product.features.length === 0 || tiers.length === 0 ? (
          <p className="text-sm text-ink-soft">
            {tiers.length === 0
              ? "Add at least one tier before configuring features."
              : "No features yet."}
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-ink/80 text-left text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
                <th className="py-2 pr-4 font-medium">Feature</th>
                {tiers.map((tier) => (
                  <th key={tier.id} className="py-2 pr-4 font-medium">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {product.features.map((feature) => {
                const byTier = new Map(feature.availabilities.map((a) => [a.tierId, a]));
                return (
                  <tr key={feature.id} className="border-b border-rule-soft last:border-0">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/catalog/products/${product.id}/features/${feature.id}/edit`}
                        className="font-display text-base text-ink hover:text-emerald"
                      >
                        {feature.name}
                      </Link>
                    </td>
                    {tiers.map((tier) => {
                      const cell = byTier.get(tier.id);
                      const availability = cell?.availability ?? "NOT_AVAILABLE";
                      return (
                        <td key={tier.id} className="py-3 pr-4">
                          <AvailabilityBadge
                            availability={availability}
                            pricingModel={cell?.addonPricing?.pricingModel}
                            pricingValue={
                              cell?.addonPricing ? Number(cell.addonPricing.pricingValue) : undefined
                            }
                          />
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
