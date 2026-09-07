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
    <main className="space-y-6 sm:space-y-8">
      <div className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
        <Link href="/browse" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline">
          &rarr; العودة لتصفح المعروضات
        </Link>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Image Gallery Container */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-[28px] border border-stone-200 bg-stone-100 h-[280px] sm:h-[380px] lg:h-[440px]">
            <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex items-center justify-between">
              <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-stone-800 shadow-sm">
                {product.badge}
              </span>
              <span className="rounded-full bg-stone-900/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white">
                {product.condition}
              </span>
            </div>
          </div>

          {/* Product Details & Purchase Actions */}
          <div className="space-y-5 sm:space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">{product.category}</p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl lg:text-4xl leading-tight">
                {product.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-600">
              <span className="rounded-full bg-stone-100 px-3 py-1 font-bold text-stone-800">★ {product.rating}</span>
              <span>({product.reviews} تقييم)</span>
              <span>📍 {product.location}</span>
            </div>

            <div className="text-2xl sm:text-3xl font-bold text-stone-900">{product.price} ج.م</div>

            <p className="text-xs sm:text-sm leading-6 sm:leading-7 text-stone-600 font-medium">{product.description}</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/checkout?slug=${product.slug}`}
                className="w-full sm:w-auto text-center rounded-2xl bg-stone-900 px-7 py-3.5 sm:py-4 text-sm font-bold text-white transition hover:bg-stone-800 shadow-md"
              >
                شراء الآن — الدفع عند الاستلام (COD)
              </Link>
              <button
                type="button"
                className="w-full sm:w-auto rounded-2xl border border-stone-300 bg-white px-5 py-3.5 sm:py-4 text-sm font-bold text-stone-700 transition hover:bg-stone-100"
              >
                حفظ في المفضلة ♡
              </button>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500">معلومات البائع</div>
              <div className="flex items-center justify-between text-xs sm:text-sm text-stone-700">
                <span className="font-bold">{product.seller}</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  ✓ هويّة موثقة
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-stone-900">مواصفات وتفاصيل القطعة</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {product.features.map((feature) => (
            <li key={feature} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs font-bold text-stone-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
