"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { categories, products, Product } from "@/lib/mock-data";

const categoryList = ["الكل", ...categories.map((c) => c.name)];

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "الكل";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("الكل");
  const [maxPrice, setMaxPrice] = useState<number>(1000);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && categoryList.includes(cat)) {
      setSelectedCategory(cat);
      setSelectedSubcategory("الكل");
    }
  }, [searchParams]);

  const activeCategoryObj = categories.find((c) => c.name === selectedCategory);

  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName);
    setSelectedSubcategory("الكل");
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === "الكل" || p.category === selectedCategory;
    const matchSubcategory =
      selectedSubcategory === "الكل" || p.subcategory === selectedSubcategory;
    const matchPrice = p.price <= maxPrice;
    return matchCategory && matchSubcategory && matchPrice;
  });

  return (
    <main className="space-y-8">
      <section className="rounded-3xl bg-stone-900 px-6 py-10 text-white sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-400">مختارات النخبة</p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">تصفح أحدث القطع المعروضة للبيع</h1>
          </div>
          <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-stone-200">
            {filteredProducts.length} إعلان مطبق
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-6 self-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">التصفية والبحث</p>
            <h2 className="mt-1 text-xl font-bold text-stone-900">تخصيص البحث</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold text-stone-700 uppercase tracking-wider">الفئة الرئيسية</label>
              <div className="flex flex-wrap gap-2">
                {categoryList.map((filter) => {
                  const isActive = selectedCategory === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => handleCategoryChange(filter)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        isActive
                          ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                          : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400 hover:bg-stone-100"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeCategoryObj && activeCategoryObj.subcategories && (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5 space-y-2">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                  الفئة الفرعية ({selectedCategory})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory("الكل")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      selectedSubcategory === "الكل"
                        ? "bg-amber-900 text-white"
                        : "bg-white text-stone-700 border border-stone-200 hover:bg-amber-100/50"
                    }`}
                  >
                    الكل
                  </button>
                  {activeCategoryObj.subcategories.map((sub) => {
                    const isSubActive = selectedSubcategory === sub.name;
                    return (
                      <button
                        key={sub.slug}
                        type="button"
                        onClick={() => setSelectedSubcategory(sub.name)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          isSubActive
                            ? "bg-amber-900 text-white shadow-sm"
                            : "bg-white text-stone-700 border border-stone-200 hover:bg-amber-100/50"
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">أقصى سعر</label>
                <span className="text-xs font-bold text-amber-700">{maxPrice} ج.م</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[11px] font-bold text-stone-400">
                <span>50 ج.م</span>
                <span>1000+ ج.م</span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-stone-700 uppercase tracking-wider">حالة القطعة</label>
              <ul className="space-y-2 text-xs font-medium text-stone-600">
                {[
                  { label: "كالجديد", count: 34 },
                  { label: "ممتاز", count: 61 },
                  { label: "جيد جداً", count: 48 },
                  { label: "جيد", count: 29 },
                ].map((condition) => (
                  <li key={condition.label} className="flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2">
                    <span>{condition.label}</span>
                    <span className="text-xs font-bold text-stone-400">{condition.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                نتائج المعروضات ({selectedCategory} {selectedSubcategory !== "الكل" ? `• ${selectedSubcategory}` : ""})
              </h2>
              <p className="text-xs text-stone-500">تم العثور على {filteredProducts.length} قطعة مطابقة</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-700">
              <span>الترتيب:</span>
              <span className="font-bold text-stone-900">الأحدث إضافة</span>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center">
              <p className="text-stone-500 font-bold">لا توجد منتجات مطابقة لهذا الفلتر حالياً.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("الكل");
                  setSelectedSubcategory("الكل");
                  setMaxPrice(1000);
                }}
                className="mt-4 rounded-full bg-stone-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-stone-800"
              >
                إعادة ضبط التصفية
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-56 w-full overflow-hidden bg-stone-100">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-stone-800 shadow-sm">
                        {product.badge}
                      </span>
                      <span className="rounded-full bg-stone-900/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white">
                        {product.condition}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                          <span>{product.category}</span>
                          {product.subcategory && (
                            <>
                              <span>•</span>
                              <span className="text-amber-700 font-bold">{product.subcategory}</span>
                            </>
                          )}
                        </div>
                        <h3 className="mt-1 text-lg font-bold text-stone-900 truncate">{product.title}</h3>
                      </div>
                      <span className="text-lg font-bold text-stone-900 whitespace-nowrap">{product.price} ج.م</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                      <span>📍 {product.location}</span>
                      <span className="font-bold text-amber-600">★ {product.rating}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                      <span className="font-bold text-stone-700">البائع: {product.seller}</span>
                      <span className="text-stone-400">({product.reviews} تقييم)</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-stone-500 font-bold">جاري تحميل المعروضات...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
