import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/lib/mock-data";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="space-y-8">
      <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <Link href="/browse" className="mb-4 inline-flex text-xs font-bold text-amber-800 hover:underline">
          &rarr; العودة لتصفح المعروضات
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-stone-100 h-[420px]">
            <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <span className="rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-stone-800 shadow-sm">
                {product.badge}
              </span>
              <span className="rounded-full bg-stone-900/90 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-white">
                {product.condition}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">{product.category}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{product.title}</h1>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
              <span className="rounded-full bg-stone-100 px-3 py-1 font-bold text-stone-800">★ {product.rating}</span>
              <span>({product.reviews} تقييم)</span>
              <span>📍 {product.location}</span>
            </div>

            <div className="text-3xl font-bold text-stone-900">{product.price} ج.م</div>

            <p className="text-sm leading-7 text-stone-600 font-medium">{product.description}</p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/checkout?slug=${product.slug}`}
                className="rounded-full bg-stone-900 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-stone-800 shadow-md"
              >
                شراء الآن — الدفع عند الاستلام (COD)
              </Link>
              <button type="button" className="rounded-full border border-stone-300 bg-white px-5 py-3.5 text-sm font-bold text-stone-700 transition hover:bg-stone-100">
                حفظ في المفضلة ♡
              </button>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500">معلومات البائع</div>
              <div className="flex items-center justify-between text-sm text-stone-700">
                <span className="font-bold">{product.seller}</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  ✓ هويّة موثقة
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-stone-900">مواصفات وتفاصيل القطعة</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {product.features.map((feature) => (
            <li key={feature} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs font-bold text-stone-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
