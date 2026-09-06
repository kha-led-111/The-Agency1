import Link from "next/link";
import { categories, featureBenefits, homeStats, products } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="space-y-10">
      <section className="grid gap-6 overflow-hidden rounded-[32px] bg-stone-900 text-white shadow-sm lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
            سوق النخبة المستدام
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
            تسوق بثقة. بع بوضوح وسرعة.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-stone-300 font-medium">
            اكتشف أفضل القطع المميزة والمستعملة بحالة كالجديدة، مع تجربة دفع آمنة عند الاستلام وتوصيل فوري يضمن حماية الطرفين.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/browse" className="rounded-full bg-white px-6 py-3.5 text-sm font-bold text-stone-900 transition hover:bg-stone-200 shadow-md">
              تصفح المنتجات المتاحة
            </Link>
            <Link href="/seller/create-listing" className="rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
              انضم كبائع الآن
            </Link>
          </div>
        </div>

        <div className="flex items-end justify-center p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              {products.slice(0, 4).map((product) => (
                <div key={product.id} className="overflow-hidden rounded-2xl border border-white/10 bg-stone-800 flex flex-col">
                  <div className="relative h-28 w-full overflow-hidden bg-stone-900">
                    <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="text-xs font-semibold text-amber-400">{product.category}</div>
                    <div className="font-bold text-white text-sm truncate">{product.title}</div>
                    <div className="text-sm font-bold text-stone-300">{product.price} ج.م</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {homeStats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-3xl font-bold tracking-tight text-stone-900">{stat.value}</div>
            <div className="mt-2 text-xs font-bold text-stone-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">تصفح الفئات</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">عن ماذا تبحث اليوم؟</h2>
          </div>
          <Link href="/browse" className="hidden text-sm font-bold text-stone-700 transition hover:text-stone-900 sm:inline-flex">
            عرض جميع الفئات ←
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/browse?category=${encodeURIComponent(category.name)}`}
              className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col"
            >
              <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white">
                  <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold">
                    {category.items} قطعة
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 group-hover:text-amber-700 transition">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-stone-600 font-medium">
                    {category.description}
                  </p>
                </div>
                {category.subcategories && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-stone-100 pt-2.5">
                    {category.subcategories.slice(0, 3).map((sub) => (
                      <span key={sub.slug} className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
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

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">القطع الأكثر شعبية</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">المقترحة هذا الأسبوع</h2>
          </div>
          <Link href="/browse" className="hidden text-sm font-bold text-stone-700 transition hover:text-stone-900 sm:inline-flex">
            عرض الكل ←
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="relative h-56 w-full overflow-hidden bg-stone-100">
                <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold text-stone-700">{product.badge}</span>
                  <span className="text-xl font-bold text-stone-900">{product.price} ج.م</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-500">{product.category}</p>
                  <h3 className="mt-1 text-lg font-bold text-stone-900 truncate">{product.title}</h3>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500 font-medium pt-1 border-t border-stone-100">
                  <span>📍 {product.location}</span>
                  <span className="font-bold text-amber-600">★ {product.rating} ({product.reviews})</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">لماذا يختارنا الجميع؟</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">تجربة إعادة بيع موثوقة وعادلة للجميع.</h2>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {featureBenefits.map((item) => (
            <div key={item.title} className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-sm font-bold text-white">
                ✓
              </div>
              <h3 className="text-lg font-bold text-stone-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600 font-medium">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
