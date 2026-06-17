import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createTier } from "@/app/actions/catalog-actions";

export default async function NewTierPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { tiers: true },
  });
  if (!product) {
    notFound();
  }

  const nextOrder = product.tiers.length;

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="border-b border-rule pb-4">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{product.name}</span>
        <h1 className="font-display text-2xl text-ink">New tier</h1>
      </div>
      <form action={createTier} className="flex flex-col gap-4">
        <input type="hidden" name="productId" value={product.id} />
        <div className="field">
          <label htmlFor="name" className="field-label">
            Tier name
          </label>
          <input id="name" name="name" required placeholder="Starter" className="field-input" />
        </div>
        <div className="field">
          <label htmlFor="order" className="field-label">
            Display order
          </label>
          <input
            id="order"
            name="order"
            type="number"
            defaultValue={nextOrder}
            required
            className="field-input font-mono"
          />
        </div>
        <div className="field">
          <label htmlFor="basePricePerSeat" className="field-label">
            Base price (USD per seat per month)
          </label>
          <input
            id="basePricePerSeat"
            name="basePricePerSeat"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="25"
            className="field-input font-mono"
          />
        </div>
        <button type="submit" className="btn-primary self-start">
          Create tier
        </button>
      </form>
    </div>
  );
}
