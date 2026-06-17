import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { tiers: true, features: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Catalog</h1>
        <Link
          href="/catalog/products/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-zinc-600">No products yet. Create one to get started.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          {products.map((product) => (
            <li key={product.id} className="flex items-center justify-between px-4 py-3">
              <Link href={`/catalog/products/${product.id}`} className="font-medium hover:underline">
                {product.name}
              </Link>
              <span className="text-sm text-zinc-500">
                {product._count.tiers} tier{product._count.tiers === 1 ? "" : "s"} ·{" "}
                {product._count.features} feature{product._count.features === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
