import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createFeature } from "@/app/actions/catalog-actions";

export default async function NewFeaturePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-2xl font-semibold">New feature for {product.name}</h1>
      <p className="text-sm text-zinc-600">
        New features default to &quot;Not available&quot; on every existing tier. Set
        availability per tier afterwards.
      </p>
      <form action={createFeature} className="flex flex-col gap-4">
        <input type="hidden" name="productId" value={product.id} />
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Feature name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Single Sign-On (SSO)"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Create feature
        </button>
      </form>
    </div>
  );
}
