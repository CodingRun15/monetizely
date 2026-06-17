import { createProduct } from "@/app/actions/catalog-actions";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-2xl font-semibold">New product</h1>
      <form action={createProduct} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Product name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Analytics Suite"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Create product
        </button>
      </form>
    </div>
  );
}
