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
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <div className="rise-in flex items-start justify-between border-b-2 border-ink/80 pb-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Quote</span>
          <h1 className="mt-1 font-display text-3xl text-ink">{quote.name}</h1>
        </div>
        <div className="text-right font-mono text-xs text-ink-soft">
          <p>No. {quote.id.slice(-8).toUpperCase()}</p>
          <p>
            {quote.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <section className="rise-in grid grid-cols-2 gap-6 sm:grid-cols-4" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Customer", value: quote.customerName },
          { label: "Product", value: quote.product.name },
          { label: "Tier", value: quote.tier.name },
          { label: "Seats", value: String(quote.seats) },
        ].map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">{row.label}</dt>
            <dd className="mt-1 font-display text-lg text-ink">{row.value}</dd>
          </div>
        ))}
      </section>

      <section className="rise-in border-t border-rule pt-4 text-sm text-ink-soft" style={{ animationDelay: "100ms" }}>
        <span className="font-medium text-ink">Term —</span> {termSummary(quote.termLength)}
      </section>

      <section className="rise-in" style={{ animationDelay: "140ms" }}>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-gold">Cost breakdown</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink/80 text-left text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
              <th className="py-2 pr-3 font-medium">Line item</th>
              <th className="py-2 pr-3 font-medium">How it was calculated</th>
              <th className="py-2 pr-3 font-medium">Notes</th>
              <th className="py-2 text-right font-medium">Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((item) => (
              <tr key={item.id} className="border-b border-rule-soft last:border-0">
                <td className="py-3 pr-3 font-medium text-ink">{item.label}</td>
                <td className="py-3 pr-3 text-ink-soft">{item.description}</td>
                <td className="py-3 pr-3 text-ink-soft">{item.notes}</td>
                <td className="py-3 text-right font-mono text-ink">{formatCurrency(Number(item.amount))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink/80 bg-gold-soft font-semibold text-ink">
              <td className="py-3 pr-3 text-xs uppercase tracking-[0.1em]" colSpan={3}>
                Total
              </td>
              <td className="py-3 text-right font-mono text-lg">{formatCurrency(Number(quote.total))}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}
