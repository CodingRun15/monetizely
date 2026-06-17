import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TERM_DISCOUNT, TERM_LABEL, TERM_MONTHS, type TermLength } from "@/lib/pricing.types";
import { formatCurrency } from "@/lib/format";

function termSummary(term: TermLength): string {
  const months = TERM_MONTHS[term];
  const discount = TERM_DISCOUNT[term];
  const monthsClause = `${months} month${months === 1 ? "" : "s"}`;
  if (discount === 0) {
    return `${TERM_LABEL[term]} (${monthsClause})`;
  }
  return `${TERM_LABEL[term]} (${monthsClause}, ${discount * 100}% discount applies to per-seat price)`;
}

export default async function QuoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      product: true,
      tier: true,
      lineItems: { orderBy: { order: "asc" } },
    },
  });

  if (!quote) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">{quote.name}</h1>
        <p className="text-sm text-zinc-500">
          Created {quote.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <section className="rounded-md border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Quote details</h2>
        <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
          <dt className="text-zinc-500">Customer</dt>
          <dd>{quote.customerName}</dd>
          <dt className="text-zinc-500">Product</dt>
          <dd>{quote.product.name}</dd>
          <dt className="text-zinc-500">Tier</dt>
          <dd>{quote.tier.name}</dd>
          <dt className="text-zinc-500">Seats</dt>
          <dd>{quote.seats}</dd>
          <dt className="text-zinc-500">Term length</dt>
          <dd>{termSummary(quote.termLength)}</dd>
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Cost breakdown</h2>
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th className="px-3 py-2 font-medium">Line item</th>
                <th className="px-3 py-2 font-medium">How it was calculated</th>
                <th className="px-3 py-2 font-medium">Notes</th>
                <th className="px-3 py-2 text-right font-medium">Amount (USD)</th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-2 font-medium">{item.label}</td>
                  <td className="px-3 py-2 text-zinc-500">{item.description}</td>
                  <td className="px-3 py-2 text-zinc-500">{item.notes}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(Number(item.amount))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50 font-semibold">
                <td className="px-3 py-2" colSpan={3}>
                  TOTAL
                </td>
                <td className="px-3 py-2 text-right">{formatCurrency(Number(quote.total))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
