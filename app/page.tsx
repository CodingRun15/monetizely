import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <div className="rise-in flex flex-col gap-3 border-b border-rule pb-8">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">
          Pricing &amp; Quoting
        </span>
        <h1 className="font-display text-4xl text-ink">
          Set the price.
          <br />
          Show the math.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          Build a client&apos;s product catalog — tiers, features, add-on pricing — then turn it
          into a shareable quote where every dollar traces back to a line a customer can verify.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/catalog"
          className="rise-in rounded-sm bg-emerald px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-emerald-dark"
          style={{ animationDelay: "80ms" }}
        >
          Manage catalog
        </Link>
        <Link
          href="/quotes/new"
          className="rise-in rounded-sm border border-rule px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-emerald hover:text-emerald"
          style={{ animationDelay: "150ms" }}
        >
          Build a new quote
        </Link>
      </div>

      <div className="rise-in grid gap-px overflow-hidden rounded-sm border border-rule bg-rule sm:grid-cols-3" style={{ animationDelay: "220ms" }}>
        {[
          { n: "01", t: "Catalog", d: "Products, tiers, and per-tier feature availability." },
          { n: "02", t: "Pricing", d: "Fixed, per-seat, or % of product cost — set per add-on." },
          { n: "03", t: "Quote", d: "An immutable, link-shareable, fully itemized proposal." },
        ].map((s) => (
          <div key={s.n} className="bg-paper p-5">
            <span className="font-mono text-xs text-gold">{s.n}</span>
            <h2 className="mt-2 font-display text-lg text-ink">{s.t}</h2>
            <p className="mt-1 text-sm text-ink-soft">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
