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
    <div className="flex max-w-md flex-col gap-6">
      <div className="border-b border-rule pb-4">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{product.name}</span>
        <h1 className="font-display text-2xl text-ink">New feature</h1>
      </div>
      <p className="text-sm text-ink-soft">
        New features default to &quot;Not available&quot; on every existing tier. Set availability
        per tier afterwards.
      </p>
      <form action={createFeature} className="flex flex-col gap-4">
        <input type="hidden" name="productId" value={product.id} />
        <div className="field">
          <label htmlFor="name" className="field-label">
            Feature name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Single Sign-On (SSO)"
            className="field-input"
          />
        </div>
        <button type="submit" className="btn-primary self-start">
          Create feature
        </button>
      </form>
    </div>
  );
}
