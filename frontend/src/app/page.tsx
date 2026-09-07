import Link from "next/link";
import { categories, featureBenefits, homeStats, products } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="space-y-8 sm:space-y-12">
      {/* Hero Banner */}
      <section className="grid gap-6 overflow-hidden rounded-3xl bg-stone-900 text-white shadow-md lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-center">
          <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
            سوق النخبة المستدام
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight sm:leading-tight">
            تسوق بثقة. بع بوضوح وسرعة.
          </h1>
          <p className="mt-3 text-sm leading-6 sm:text-base sm:leading-7 text-stone-300 font-medium max-w-lg">
            اكتشف أفضل القطع المميزة والمستعملة بحالة كالجديدة، مع تجربة دفع آمنة عند الاستلام وتوصيل فوري يضمن حماية الطرفين.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/browse"
              className="w-full sm:w-auto text-center rounded-2xl sm:rounded-full bg-white px-6 py-3.5 text-sm font-bold text-stone-900 transition hover:bg-stone-200 shadow-sm"
            >
              تصفح المنتجات المتاحة
            </Link>
            <Link
              href="/seller/create-listing"
              className="w-full sm:w-auto text-center rounded-2xl sm:rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              انضم كبائع الآن
            </Link>
          </div>
        </div>

        {/* Hero Product Previews */}
        <div className="flex items-center justify-center p-4 sm:p-8 lg:p-10 bg-stone-950/40">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {products.slice(0, 4).map((product) => (
                <div key={product.id} className="overflow-hidden rounded-xl border border-white/10 bg-stone-800 flex flex-col">
                  <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-stone-900">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-0.5 p-2 sm:p-3">
                    <div className="text-[10px] sm:text-xs font-semibold text-amber-400">{product.category}</div>
                    <div className="font-bold text-white text-xs sm:text-sm truncate">{product.title}</div>
                    <div className="text-xs sm:text-sm font-bold text-stone-300">{product.price} ج.م</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Grid (2 cols mobile, 4 desktop) */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {homeStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">{stat.value}</div>
            <div className="mt-1 text-[11px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Categories Grid (2 cols mobile, 3 tablet, 4 desktop) */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">تصفح الفئات</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">عن ماذا تبحث اليوم؟</h2>
          </div>
          <Link href="/browse" className="text-xs sm:text-sm font-bold text-stone-700 transition hover:text-stone-900">
            عرض الكل ←
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/category/${category.slug}`}
              className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col"
            >
              <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-stone-100">
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between text-white">
                  <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] sm:text-xs font-bold">
                    {category.items} قطعة
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-stone-900 group-hover:text-amber-700 transition leading-tight">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-[11px] sm:text-xs leading-4 sm:leading-5 text-stone-600 font-medium line-clamp-2">
                    {category.description}
                  </p>
                </div>
                {category.subcategories && (
                  <div className="mt-2.5 flex flex-wrap gap-1 border-t border-stone-100 pt-2">
                    {category.subcategories.slice(0, 2).map((sub) => (
                      <span key={sub.slug} className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products (1 col mobile, 2 tablet, 3 desktop) */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">القطع الأكثر شعبية</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">المقترحة هذا الأسبوع</h2>
          </div>
          <Link href="/browse" className="text-xs sm:text-sm font-bold text-stone-700 transition hover:text-stone-900">
            عرض الكل ←
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col"
            >
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-stone-100">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2.5 p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-stone-700">
                      {product.badge}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-stone-900">{product.price} ج.م</span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold text-stone-500">{product.category}</p>
                  <h3 className="mt-0.5 text-base sm:text-lg font-bold text-stone-900 truncate">{product.title}</h3>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500 font-medium pt-2 border-t border-stone-100">
                  <span>📍 {product.location}</span>
                  <span className="font-bold text-amber-600">★ {product.rating} ({product.reviews})</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust & Benefits */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">لماذا يختارنا الجميع؟</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">تجربة إعادة بيع موثوقة وعادلة للجميع.</h2>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {featureBenefits.map((item) => (
            <div key={item.title} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-xs font-bold text-white">
                ✓
              </div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">{item.title}</h3>
              <p className="mt-1.5 text-xs sm:text-sm leading-5 sm:leading-6 text-stone-600 font-medium">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
