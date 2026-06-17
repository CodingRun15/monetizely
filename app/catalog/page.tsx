import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { tiers: true, features: true } } },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-rule pb-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Ledger</span>
          <h1 className="font-display text-3xl text-ink">Catalog</h1>
        </div>
        <Link
          href="/catalog/products/new"
          className="rounded-sm bg-emerald px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-emerald-dark"
        >
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-ink-soft">No products yet. Create one to get started.</p>
      ) : (
        <div className="flex flex-col">
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-rule pb-2 text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
            <span>Product</span>
            <span className="text-right">Tiers · Features</span>
          </div>
          {products.map((product, i) => (
            <Link
              key={product.id}
              href={`/catalog/products/${product.id}`}
              className="rise-in group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-rule-soft py-4 transition-colors hover:bg-paper-2/60"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="font-display text-lg text-ink group-hover:text-emerald">
                {product.name}
              </span>
              <span className="font-mono text-sm text-ink-soft">
                {product._count.tiers} tier{product._count.tiers === 1 ? "" : "s"} ·{" "}
                {product._count.features} feature{product._count.features === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
