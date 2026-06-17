import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Monetizely Quoting Tool</h1>
        <p className="mt-1 text-zinc-600">
          Set up a client&apos;s product catalog, then build a shareable quote against it.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/catalog"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Manage catalog
        </Link>
        <Link
          href="/quotes/new"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
        >
          Build a new quote
        </Link>
      </div>
    </div>
  );
}
