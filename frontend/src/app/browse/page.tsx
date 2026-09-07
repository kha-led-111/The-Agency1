"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { categories, products } from "@/lib/mock-data";

const categoryList = ["الكل", ...categories.map((c) => c.name)];

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "الكل";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("الكل");
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

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
    <main className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <section className="rounded-3xl bg-stone-900 px-4 py-8 sm:px-8 lg:px-10 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-400">مختارات النخبة</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">تصفح أحدث القطع المعروضة</h1>
          </div>
          <div className="w-fit rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-stone-200">
            {filteredProducts.length} إعلان مطبق
          </div>
        </div>

        {/* Mobile Horizontal Pill Bar */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categoryList.map((filter) => {
              const isActive = selectedCategory === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => handleCategoryChange(filter)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    isActive
                      ? "bg-amber-400 text-stone-950 shadow-sm"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Browse Layout */}
      <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Mobile Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white p-3.5 text-sm font-bold text-stone-800 shadow-sm lg:hidden"
        >
          <span className="flex items-center gap-2">
            ⚙️ تصفية وتخصيص البحث
            {selectedCategory !== "الكل" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">• {selectedCategory}</span>}
          </span>
          <span>{showMobileFilters ? "إخفاء ▲" : "إظهار ▼"}</span>
        </button>

        {/* Sidebar Filters */}
        <aside className={`${showMobileFilters ? "block" : "hidden"} lg:block rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm space-y-6 self-start`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">التصفية والبحث</p>
            <h2 className="mt-1 text-xl font-bold text-stone-900">تخصيص نتائجك</h2>
          </div>

          <div className="space-y-6">
            {/* Category Subcategories if available */}
            {activeCategoryObj && activeCategoryObj.subcategories && (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3.5 space-y-2">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                  الفئة الفرعية ({selectedCategory})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory("الكل")}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
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
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
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

            {/* Price Slider */}
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
                className="w-full accent-stone-900 cursor-pointer h-2 bg-stone-200 rounded-lg"
              />
              <div className="mt-1 flex justify-between text-[11px] font-bold text-stone-400">
                <span>50 ج.م</span>
                <span>1000+ ج.م</span>
              </div>
            </div>

            {/* Condition List */}
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

        {/* Product Grid Area */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-2 rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-stone-900 leading-snug">
                نتائج المعروضات ({selectedCategory} {selectedSubcategory !== "الكل" ? `• ${selectedSubcategory}` : ""})
              </h2>
              <p className="text-xs text-stone-500">تم العثور على {filteredProducts.length} قطعة مطابقة</p>
            </div>
            <div className="w-fit flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700">
              <span>الترتيب:</span>
              <span className="font-bold text-stone-900">الأحدث إضافة</span>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-8 sm:p-12 text-center">
              <p className="text-stone-500 font-bold text-sm sm:text-base">لا توجد منتجات مطابقة لهذا الفلتر حالياً.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("الكل");
                  setSelectedSubcategory("الكل");
                  setMaxPrice(1000);
                }}
                className="mt-4 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-stone-800"
              >
                إعادة ضبط التصفية
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredProducts.map((product) => (
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
          )}
        </div>
      </section>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500 font-medium">جاري تحميل المنتجات...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
