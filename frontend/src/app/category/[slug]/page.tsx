"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { getImageUrl } from "@/lib/api";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

interface ProductDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: string;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
}

interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = use(params);
  const decodedSlug = decodeURIComponent(slug);

  const [category, setCategory] = useState<CategoryDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");

  useEffect(() => {
    async function fetchCategoryData() {
      try {
        const catRes = await fetch("/api/marketplace/categories");
        if (catRes.ok) {
          const categories: CategoryDto[] = await catRes.json();
          const matched = categories.find(
            (c) => c.slug.toLowerCase() === decodedSlug.toLowerCase() || c.name === decodedSlug
          ) || categories[0];

          if (matched) {
            setCategory(matched);
            const prodRes = await fetch(`/api/marketplace?categoryId=${matched.id}&pageSize=50`);
            if (prodRes.ok) {
              const prodData = await prodRes.json();
              setProducts(prodData.items || prodData || []);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load category data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryData();
  }, [decodedSlug]);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-stone-500 font-bold text-sm">
        جاري تحميل منتجات الفئة...
      </div>
    );
  }

  const categoryName = category?.name || decodedSlug;

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
        <span className="text-stone-900 font-bold">{categoryName}</span>
      </nav>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-stone-200 bg-stone-900 text-white p-6 sm:p-10 shadow-sm">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
              فئة معتمدة
            </span>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-stone-200">
              {products.length} قطعة متاحة
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-white">
            {categoryName}
          </h1>

          <p className="text-sm leading-6 sm:text-base sm:leading-7 text-stone-300 font-medium max-w-xl">
            {category?.description || "تصفح أفضل المعروضات الحصرية والمنتجات المستعملة بحالة كالجديدة."}
          </p>
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
            placeholder={`ابحث في فئة ${categoryName}...`}
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
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-stone-100 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={getImageUrl(product.imageUrl)}
                    alt={product.title}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector(".img-fallback") as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }
                    }}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div
                  className="img-fallback flex flex-col items-center justify-center text-stone-400 p-4 text-center"
                  style={{ display: product.imageUrl ? "none" : "flex" }}
                >
                  <span className="text-3xl mb-1">📷</span>
                  <span className="text-[11px] font-bold">لا توجد صورة</span>
                </div>
              </div>
              <div className="space-y-2.5 p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-stone-700">
                      {product.condition || "ممتاز"}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-stone-900">{product.price} ج.م</span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold text-stone-500">{product.categoryName || categoryName}</p>
                  <h3 className="mt-0.5 text-base sm:text-lg font-bold text-stone-900 truncate">{product.title}</h3>
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
            جرب اختيار مصطلح مختلف في فئة {categoryName}.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-5 rounded-2xl bg-stone-900 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-stone-800"
          >
            إعادة ضبط الفلاتر
          </button>
        </section>
      )}
    </main>
  );
}
