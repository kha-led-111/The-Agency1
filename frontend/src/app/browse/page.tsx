"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getImageUrl } from "@/lib/api";

interface ProductDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: string;
  size?: string;
  categoryId: string;
  subcategoryId?: string;
  categoryName?: string;
  imageUrl?: string;
}

interface SubcategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}

interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  subcategories?: SubcategoryDto[];
}

const CONDITION_OPTIONS = [
  { value: "", label: "جميع الحالات" },
  { value: "New", label: "جديد بالتغليف (New)" },
  { value: "LikeNew", label: "كالجديد (Like New)" },
  { value: "Excellent", label: "ممتاز (Excellent)" },
  { value: "VeryGood", label: "جيد جداً (Very Good)" },
  { value: "Good", label: "جيد (Good)" },
  { value: "Fair", label: "مقبول (Fair)" },
];

const SIZE_OPTIONS = [
  { value: "", label: "جميع المقاسات" },
  { value: "S", label: "Small (S)" },
  { value: "M", label: "Medium (M)" },
  { value: "L", label: "Large (L)" },
  { value: "XL", label: "X-Large (XL)" },
  { value: "XXL", label: "XX-Large (XXL)" },
  { value: "38", label: "38" },
  { value: "40", label: "40" },
  { value: "42", label: "42" },
  { value: "44", label: "44" },
];

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category") || "الكل";

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize] = useState<number>(12);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Multi-filter states
  const [selectedParentCategory, setSelectedParentCategory] = useState<CategoryDto | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedCategoryNameDisplay, setSelectedCategoryNameDisplay] = useState<string>(initialCategoryParam);

  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("latest");

  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Fetch Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/marketplace/categories");
        if (res.ok) {
          const data: CategoryDto[] = await res.json();
          setCategories(data || []);

          if (initialCategoryParam && initialCategoryParam !== "الكل") {
            const match = (data || []).find(
              (c) => c.name === initialCategoryParam || c.slug === initialCategoryParam
            );
            if (match) {
              setSelectedParentCategory(match);
              setSelectedCategoryNameDisplay(match.name);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    fetchCategories();
  }, [initialCategoryParam]);

  // Fetch Products with combined filters & pagination
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (selectedSubcategoryId) {
        params.append("subcategoryId", selectedSubcategoryId);
      } else if (selectedParentCategory?.id) {
        params.append("categoryId", selectedParentCategory.id);
      }

      if (minPrice.trim()) {
        params.append("minPrice", minPrice.trim());
      }

      if (maxPrice < 5000) {
        params.append("maxPrice", maxPrice.toString());
      }

      if (selectedCondition) {
        params.append("condition", selectedCondition);
      }

      if (selectedSize) {
        params.append("size", selectedSize);
      }

      if (sortBy) {
        params.append("sortBy", sortBy);
      }

      params.append("pageNumber", pageNumber.toString());
      params.append("pageSize", pageSize.toString());

      const res = await fetch(`/api/marketplace?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  }, [selectedParentCategory, selectedSubcategoryId, minPrice, maxPrice, selectedCondition, selectedSize, sortBy, pageNumber, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSelectParent = (cat: CategoryDto | null) => {
    setSelectedParentCategory(cat);
    setSelectedSubcategoryId(null);
    setSelectedCategoryNameDisplay(cat ? cat.name : "الكل");
    setPageNumber(1);
  };

  const handleSelectSubcategory = (sub: SubcategoryDto | null) => {
    if (sub === null) {
      setSelectedSubcategoryId(null);
      setSelectedCategoryNameDisplay(selectedParentCategory?.name || "الكل");
    } else {
      setSelectedSubcategoryId(sub.id);
      setSelectedCategoryNameDisplay(sub.name);
    }
    setPageNumber(1);
  };

  const handleResetFilters = () => {
    setSelectedParentCategory(null);
    setSelectedSubcategoryId(null);
    setSelectedCategoryNameDisplay("الكل");
    setMinPrice("");
    setMaxPrice(5000);
    setSelectedCondition("");
    setSelectedSize("");
    setSortBy("latest");
    setPageNumber(1);
  };

  return (
    <main className="space-y-6 sm:space-y-8" dir="rtl">
      {/* Page Header */}
      <section className="rounded-3xl bg-stone-900 px-4 py-8 sm:px-8 lg:px-10 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-400">مختارات النخبة</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">تصفح أحدث القطع المعروضة</h1>
          </div>
          <div className="w-fit rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-stone-200">
            {totalCount} إعلان متاح
          </div>
        </div>

        {/* Top-level Parent Category Bar */}
        <div className="mt-6 border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => handleSelectParent(null)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                selectedParentCategory === null
                  ? "bg-amber-400 text-stone-950 shadow-sm"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              الكل
            </button>
            {categories.map((cat) => {
              const isActive = selectedParentCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectParent(cat)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    isActive
                      ? "bg-amber-400 text-stone-950 shadow-sm"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Cascading Subcategory Pill Bar */}
          {selectedParentCategory &&
            selectedParentCategory.subcategories &&
            selectedParentCategory.subcategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-white/5">
                <span className="text-[11px] font-bold text-amber-400 shrink-0">الفئات الفرعية:</span>
                <button
                  type="button"
                  onClick={() => handleSelectSubcategory(null)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                    selectedSubcategoryId === null
                      ? "bg-amber-300 text-stone-950"
                      : "bg-white/5 text-stone-300 hover:bg-white/15"
                  }`}
                >
                  الكل في {selectedParentCategory.name}
                </button>
                {selectedParentCategory.subcategories.map((sub) => {
                  const isSubActive = selectedSubcategoryId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectSubcategory(sub)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                        isSubActive
                          ? "bg-amber-300 text-stone-950"
                          : "bg-white/5 text-stone-300 hover:bg-white/15"
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            )}
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
            {selectedCategoryNameDisplay !== "الكل" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                • {selectedCategoryNameDisplay}
              </span>
            )}
          </span>
          <span>{showMobileFilters ? "إخفاء ▲" : "إظهار ▼"}</span>
        </button>

        {/* Sidebar Filters */}
        <aside
          className={`${
            showMobileFilters ? "block" : "hidden"
          } lg:block rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm space-y-6 self-start`}
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">التصفية والبحث</p>
              <h2 className="mt-0.5 text-lg font-bold text-stone-900">تخصيص الخيارات</h2>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
            >
              تصفير الفلاتر
            </button>
          </div>

          <div className="space-y-5">
            {/* Sort Order */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                الترتيب
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPageNumber(1);
                }}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="latest">الأحدث أولاً</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
              </select>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                حالة المنتج
              </label>
              <select
                value={selectedCondition}
                onChange={(e) => {
                  setSelectedCondition(e.target.value);
                  setPageNumber(1);
                }}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                المقاس
              </label>
              <select
                value={selectedSize}
                onChange={(e) => {
                  setSelectedSize(e.target.value);
                  setPageNumber(1);
                }}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">السعر الأدنى والأقصى</label>
                <span className="text-xs font-bold text-amber-700">{maxPrice} ج.م</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="number"
                  placeholder="من 0"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPageNumber(1);
                  }}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs font-bold text-stone-800 placeholder-stone-400"
                />
                <input
                  type="number"
                  placeholder="إلى 5000"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(Number(e.target.value));
                    setPageNumber(1);
                  }}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs font-bold text-stone-800 placeholder-stone-400"
                />
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setPageNumber(1);
                }}
                className="w-full accent-stone-900 cursor-pointer h-2 bg-stone-200 rounded-lg"
              />
            </div>
          </div>
        </aside>

        {/* Product Grid & Empty State Area */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-2 rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-stone-900 leading-snug">
                نتائج المعروضات ({selectedCategoryNameDisplay})
              </h2>
              <p className="text-xs text-stone-500">تم العثور على {totalCount} قطعة (صفحة {pageNumber} من {totalPages})</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center text-sm font-bold text-stone-500">
              جاري تحميل المعروضات...
            </div>
          ) : products.length === 0 ? (
            /* Arabic Empty State Component */
            <div className="rounded-3xl border border-stone-200 bg-white p-8 sm:p-14 text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-stone-900">لم نجد نتائج تطابق تصفيتك</h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                  لم نجد أي منتجات تطابق الخيارات المحددة (الفئة، الحالة، المقاس، أو نطاق السعر).
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-xs font-bold text-white transition hover:bg-stone-800 shadow-sm"
              >
                🔄 تصفير الفلاتر
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {products.map((product) => (
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
                        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
                          <span>{product.categoryName || "عام"}</span>
                          {product.size && <span className="font-bold text-amber-700">المقاس: {product.size}</span>}
                        </div>
                        <h3 className="mt-1 text-base sm:text-lg font-bold text-stone-900 truncate">{product.title}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-stone-200 pt-4">
                  <button
                    type="button"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50"
                  >
                    ← السابق
                  </button>
                  <span className="text-xs font-bold text-stone-600">
                    صفحة {pageNumber} من {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageNumber >= totalPages}
                    onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50"
                  >
                    التالي →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500 font-medium">جاري تحميل المعروضات...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
