"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createQuote } from "@/app/actions/quote-actions";
import { calculateQuote } from "@/lib/pricing";
import { TERM_DISCOUNT, TERM_LABEL, type AddonPricingModel, type TermLength } from "@/lib/pricing.types";
import { formatCurrency } from "@/lib/format";

export interface ProductOption {
  id: string;
  name: string;
  tiers: {
    id: string;
    name: string;
    basePricePerSeat: number;
    addons: {
      featureId: string;
      featureName: string;
      pricingModel: AddonPricingModel;
      pricingValue: number;
    }[];
  }[];
}

interface AddonSelectionState {
  checked: boolean;
  seats: string;
}

function addonHint(model: AddonPricingModel, value: number): string {
  switch (model) {
    case "FIXED_MONTHLY":
      return `${formatCurrency(value)}/month flat`;
    case "PER_SEAT":
      return `${formatCurrency(value)}/seat/month`;
    case "PERCENT_OF_PRODUCT":
      return `${value}% of product cost`;
  }
}

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "issues" in err && Array.isArray((err as { issues: unknown }).issues)) {
    return (err as { issues: { message: string }[] }).issues.map((i) => i.message).join(", ");
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

export function QuoteForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [tierId, setTierId] = useState(products[0]?.tiers[0]?.id ?? "");
  const [seats, setSeats] = useState(1);
  const [termLength, setTermLength] = useState<TermLength>("MONTHLY");
  const [overallDiscountPercent, setOverallDiscountPercent] = useState(0);
  const [addonSelections, setAddonSelections] = useState<Record<string, AddonSelectionState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);
  const tiers = selectedProduct?.tiers ?? [];
  const selectedTier = tiers.find((t) => t.id === tierId);
  const addonOptions = selectedTier?.addons ?? [];

  function handleProductChange(newProductId: string) {
    const product = products.find((p) => p.id === newProductId);
    setProductId(newProductId);
    setTierId(product?.tiers[0]?.id ?? "");
    setAddonSelections({});
  }

  function handleTierChange(newTierId: string) {
    setTierId(newTierId);
    setAddonSelections({});
  }

  function toggleAddon(featureId: string, checked: boolean) {
    setAddonSelections((prev) => ({
      ...prev,
      [featureId]: { checked, seats: prev[featureId]?.seats ?? "" },
    }));
  }

  function setAddonSeats(featureId: string, seats: string) {
    setAddonSelections((prev) => ({
      ...prev,
      [featureId]: { checked: prev[featureId]?.checked ?? false, seats },
    }));
  }

  function buildAddonsPayload() {
    return Object.entries(addonSelections)
      .filter(([, v]) => v.checked)
      .map(([featureId, v]) => ({
        featureId,
        seats: v.seats.trim() === "" ? undefined : Number(v.seats),
      }));
  }

  const preview = useMemo(() => {
    if (!selectedProduct || !selectedTier || seats <= 0) {
      return { result: null, error: null };
    }
    try {
      const result = calculateQuote({
        productName: selectedProduct.name,
        tierName: selectedTier.name,
        basePricePerSeat: selectedTier.basePricePerSeat,
        seats,
        termLength,
        overallDiscountPercent,
        addons: buildAddonsPayload(),
        addonCatalog: addonOptions,
      });
      return { result, error: null };
    } catch (err) {
      return { result: null, error: errorMessage(err) };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, selectedTier, seats, termLength, overallDiscountPercent, addonSelections, addonOptions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { id } = await createQuote({
        name,
        customerName,
        productId,
        tierId,
        seats,
        termLength,
        overallDiscountPercent,
        addons: buildAddonsPayload(),
      });
      router.push(`/quotes/${id}`);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 lg:w-1/2">
        <div className="field">
          <label htmlFor="name" className="field-label">
            Quote name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Acme Corp - Q3 2026 proposal"
            className="field-input"
          />
        </div>

        <div className="field">
          <label htmlFor="customerName" className="field-label">
            Customer
          </label>
          <input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            placeholder="Acme Corporation"
            className="field-input"
          />
        </div>

        <div className="field">
          <label htmlFor="productId" className="field-label">
            Product
          </label>
          <select
            id="productId"
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="field-input"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="tierId" className="field-label">
            Tier
          </label>
          <select
            id="tierId"
            value={tierId}
            onChange={(e) => handleTierChange(e.target.value)}
            className="field-input"
          >
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({formatCurrency(t.basePricePerSeat)}/seat/mo)
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="seats" className="field-label">
            Seats
          </label>
          <input
            id="seats"
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            required
            className="field-input font-mono"
          />
        </div>

        <div className="field">
          <label htmlFor="termLength" className="field-label">
            Term length
          </label>
          <select
            id="termLength"
            value={termLength}
            onChange={(e) => setTermLength(e.target.value as TermLength)}
            className="field-input"
          >
            {(Object.keys(TERM_LABEL) as TermLength[]).map((term) => (
              <option key={term} value={term}>
                {TERM_LABEL[term]}
                {TERM_DISCOUNT[term] > 0 ? ` (${TERM_DISCOUNT[term] * 100}% discount)` : ""}
              </option>
            ))}
          </select>
        </div>

        {addonOptions.length > 0 && (
          <div className="field">
            <span className="field-label">Add-ons available on this tier</span>
            <div className="flex flex-col gap-3 rounded-sm border border-rule p-4">
              {addonOptions.map((addon) => {
                const selection = addonSelections[addon.featureId];
                return (
                  <div key={addon.featureId} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`addon-${addon.featureId}`}
                      checked={selection?.checked ?? false}
                      onChange={(e) => toggleAddon(addon.featureId, e.target.checked)}
                    />
                    <label htmlFor={`addon-${addon.featureId}`} className="flex-1 text-sm text-ink">
                      {addon.featureName}{" "}
                      <span className="font-mono text-xs text-gold">
                        — {addonHint(addon.pricingModel, addon.pricingValue)}
                      </span>
                    </label>
                    {selection?.checked && addon.pricingModel === "PER_SEAT" && (
                      <input
                        type="number"
                        min={1}
                        placeholder="Seats"
                        value={selection.seats}
                        onChange={(e) => setAddonSeats(addon.featureId, e.target.value)}
                        className="field-input w-24 font-mono"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="overallDiscountPercent" className="field-label">
            Overall discount (%, optional)
          </label>
          <input
            id="overallDiscountPercent"
            type="number"
            min={0}
            max={100}
            value={overallDiscountPercent}
            onChange={(e) => setOverallDiscountPercent(Number(e.target.value))}
            className="field-input font-mono"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary self-start">
          {submitting ? "Saving…" : "Save quote"}
        </button>
      </form>

      <div className="flex-1 lg:w-1/2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Preview</span>
        <h2 className="mb-4 font-display text-xl text-ink">Live calculation</h2>
        {preview.error && <p className="text-sm text-gold">{preview.error}</p>}
        {!preview.error && !preview.result && (
          <p className="text-sm text-ink-soft">Fill in the form to see a price preview.</p>
        )}
        {preview.result && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-ink/80 text-left text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
                <th className="py-2 pr-3 font-medium">Line item</th>
                <th className="py-2 pr-3 font-medium">How it was calculated</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {preview.result.lineItems.map((item, i) => (
                <tr key={i} className="border-b border-rule-soft last:border-0">
                  <td className="py-2.5 pr-3 text-ink">{item.label}</td>
                  <td className="py-2.5 pr-3 text-ink-soft">{item.description}</td>
                  <td className="py-2.5 text-right font-mono">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr key={preview.result.total} className="total-flash border-t-2 border-ink/80 font-semibold text-ink">
                <td className="py-2.5 pr-3" colSpan={2}>
                  Total
                </td>
                <td className="py-2.5 text-right font-mono">{formatCurrency(preview.result.total)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
