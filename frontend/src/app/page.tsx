"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getImageUrl } from "@/lib/api";

interface ProductDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: string;
  categoryName?: string;
  imageUrl?: string;
  isApproved: boolean;
}

interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const FEATURE_BENEFITS = [
  {
    title: "بائعون موثوقون",
    description: "فحص دقيق للهوية وتقييمات شفافة تضمن أعلى مستويات الثقة في كل صفقة.",
  },
  {
    title: "حماية كاملة للمشتري",
    description: "نظام الدفع عند الاستلام بعد الفحص المباشر يحميك ويضمن مطابقة القطعة للمواصفات.",
  },
  {
    title: "توصيل سريع وموثوق",
    description: "تتبع لحظي للطلب بمبلغ ثابت 30 ج.م مع مناديب توصيل موثوقين وتنسيق مباشر لكل شحنة.",
  },
];

export default function Home() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/marketplace?pageSize=6"),
          fetch("/api/marketplace/categories"),
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.items || prodData || []);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData || []);
        }
      } catch (err) {
        console.error("Failed to load marketplace data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
            {loading ? (
              <div className="p-6 text-center text-xs font-bold text-stone-400">جاري تحميل المنتجات...</div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {products.slice(0, 4).map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="overflow-hidden rounded-xl border border-white/10 bg-stone-800 flex flex-col group hover:border-amber-400 transition"
                  >
                    <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-stone-900 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={getImageUrl(product.imageUrl)}
                          alt={product.title}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-xl text-stone-500">📷</span>
                      )}
                    </div>
                    <div className="space-y-0.5 p-2 sm:p-3">
                      <div className="text-[10px] sm:text-xs font-semibold text-amber-400">{product.categoryName || "عام"}</div>
                      <div className="font-bold text-white text-xs sm:text-sm truncate">{product.title}</div>
                      <div className="text-xs sm:text-sm font-bold text-stone-300">{product.price} ج.م</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
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
              key={category.id}
              href={`/browse?category=${encodeURIComponent(category.name)}`}
              className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col p-5"
            >
              <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="inline-block rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 mb-2">
                    فئة معتمدة
                  </span>
                  <h3 className="text-base sm:text-xl font-bold text-stone-900 group-hover:text-amber-700 transition leading-tight">
                    {category.name}
                  </h3>
                  <p className="mt-1.5 text-[11px] sm:text-xs leading-4 sm:leading-5 text-stone-600 font-medium line-clamp-2">
                    {category.description || "تصفح أحدث المنتجات والمعروضات الحصرية في هذه الفئة."}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
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

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-stone-500">جاري تحميل المنتجات...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                    <p className="text-[11px] sm:text-xs font-semibold text-stone-500">{product.categoryName || "عام"}</p>
                    <h3 className="mt-0.5 text-base sm:text-lg font-bold text-stone-900 truncate">{product.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Trust & Benefits */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">لماذا يختارنا الجميع؟</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">تجربة إعادة بيع موثوقة وعادلة للجميع.</h2>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURE_BENEFITS.map((item) => (
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
