"use client";

import { useState, use } from "react";
import Link from "next/link";
import { categories, products } from "@/lib/mock-data";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = use(params);
  const decodedSlug = decodeURIComponent(slug);

  // Find category by slug or name
  const category = categories.find(
    (c) => c.slug === decodedSlug || c.name === decodedSlug || c.slug.toLowerCase() === decodedSlug.toLowerCase()
  ) || categories.find((c) => c.slug === "kids") || categories[0];

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "rating">("newest");

  // Filter products by category name
  const categoryProducts = products.filter((p) => p.category === category.name);

  // Filter by subcategory and search
  const filteredProducts = categoryProducts.filter((p) => {
    const matchesSubcategory =
      selectedSubcategory === "all" || p.subcategory === selectedSubcategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSubcategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return b.id - a.id;
  });

  return (
    <main className="space-y-6 sm:space-y-8" dir="rtl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-stone-500">
        <Link href="/" className="hover:text-stone-900 transition">
          الرئيسية
        </Link>
        <span>/</span>
        <Link href="/browse" className="hover:text-stone-900 transition">
          الفئات
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-bold">{category.name}</span>
      </nav>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 sm:p-10 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-900">
                فئة متميزة
              </span>
              <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700">
                {categoryProducts.length > 0 ? categoryProducts.length : category.items} قطعة متاحة
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-stone-900">
              {category.name}
            </h1>

            <p className="text-sm leading-6 sm:text-base sm:leading-7 text-stone-600 font-medium max-w-xl">
              {category.description}
            </p>

            {/* Subcategory Pill Badges */}
            {category.subcategories && category.subcategories.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubcategory("all")}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    selectedSubcategory === "all"
                      ? "bg-stone-900 text-white shadow-sm"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  عرض جميع الأقسام
                </button>
                {category.subcategories.map((sub) => (
                  <button
                    key={sub.slug}
                    type="button"
                    onClick={() => setSelectedSubcategory(sub.name)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                      selectedSubcategory === sub.name
                        ? "bg-stone-900 text-white shadow-sm"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Banner Graphic Image */}
          <div className="relative h-52 sm:h-64 lg:h-72 w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-inner">
            <img
              src={category.imageUrl}
              alt={category.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Filter, Search & Sort Control Bar */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        {/* Search inside category */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`ابحث في فئة ${category.name}...`}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs sm:text-sm outline-none transition focus:border-stone-400 focus:bg-white font-medium"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500 shrink-0">ترتيب حسب:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs sm:text-sm font-bold text-stone-800 outline-none transition focus:border-stone-400 focus:bg-white"
          >
            <option value="newest">الأحدث وصولاً</option>
            <option value="price-asc">السعر: من الأقل للأعلى</option>
            <option value="price-desc">السعر: من الأعلى للأقل</option>
            <option value="rating">الأعلى تقييماً</option>
          </select>
        </div>
      </section>

      {/* Products Grid */}
      {sortedProducts.length > 0 ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {sortedProducts.map((product) => (
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
                  <p className="text-[11px] sm:text-xs font-semibold text-stone-500">{product.subcategory || product.category}</p>
                  <h3 className="mt-0.5 text-base sm:text-lg font-bold text-stone-900 truncate">{product.title}</h3>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500 font-medium pt-2 border-t border-stone-100">
                  <span>📍 {product.location}</span>
                  <span className="font-bold text-amber-600">★ {product.rating} ({product.reviews})</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
            📦
          </div>
          <h2 className="mt-4 text-xl font-bold text-stone-900">لا توجد منتجات مطابقة لخيارات الفلترة</h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 font-medium">
            جرب اختيار قسم فرعي آخر أو البحث عن مصطلح مختلف في فئة {category.name}.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSubcategory("all");
              setSearchQuery("");
            }}
            className="mt-5 rounded-2xl bg-stone-900 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-stone-800"
          >
            إعادة ضبط الفلاتر
          </button>
        </section>
      )}
    </main>
  );
}
