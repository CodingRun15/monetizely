import { createProduct } from "@/app/actions/catalog-actions";

export default function NewProductPage() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="border-b border-rule pb-4">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Catalog</span>
        <h1 className="font-display text-2xl text-ink">New product</h1>
      </div>
      <form action={createProduct} className="flex flex-col gap-4">
        <div className="field">
          <label htmlFor="name" className="field-label">
            Product name
          </label>
          <input id="name" name="name" required placeholder="Analytics Suite" className="field-input" />
        </div>
        <button type="submit" className="btn-primary self-start">
          Create product
        </button>
      </form>
    </div>
  );
}
