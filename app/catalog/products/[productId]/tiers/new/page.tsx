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
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-2xl font-semibold">New tier for {product.name}</h1>
      <form action={createTier} className="flex flex-col gap-4">
        <input type="hidden" name="productId" value={product.id} />
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Tier name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Starter"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="order" className="text-sm font-medium">
            Display order
          </label>
          <input
            id="order"
            name="order"
            type="number"
            defaultValue={nextOrder}
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="basePricePerSeat" className="text-sm font-medium">
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
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Create tier
        </button>
      </form>
    </div>
  );
}
