import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.22em] text-stone-500">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">Page not found</h1>
        <p className="mt-2 text-stone-600">The listing or page you requested could not be found.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700">
          Back to home
        </Link>
      </div>
    </main>
  );
}
