"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

import { getImageUrl } from "@/lib/api";

interface ProductImageDto {
  id: string;
  imageUrl: string;
  isMain: boolean;
  displayOrder: number;
}

interface ProductDto {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  categoryId: string;
  categoryName?: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  imageUrl?: string;
  images?: ProductImageDto[];
  isApproved: boolean;
  createdAtUtc: string;
}

function ProductByIdDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const identifier = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/marketplace/${encodeURIComponent(identifier)}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else if (res.status === 404) {
          setNotFoundState(true);
        }
      } catch (err) {
        console.error("Failed to fetch product by id/slug", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [identifier]);

  // Handle redirect to checkout if user authenticated and action=buy in searchParams
  useEffect(() => {
    if (product && user && searchParams.get("action") === "buy") {
      router.push(`/checkout?slug=${product.slug}`);
    }
  }, [product, user, searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-stone-500 font-bold text-sm">
        جاري تحميل تفاصيل المنتج...
      </div>
    );
  }

  if (notFoundState || !product) {
    notFound();
  }

  const isOwner = !!(
    user?.id &&
    product.sellerId &&
    user.id.toLowerCase() === product.sellerId.toLowerCase()
  );

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product || isSubmitting) return;
    setIsSubmitting(true);

    if (!user) {
      const targetUrl = `/products/${product.id}?action=buy`;
      if (typeof window !== "undefined") {
        localStorage.setItem("redirect_after_login", targetUrl);
      }
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      router.push(`/checkout?slug=${product.slug}`);
    }
  };

  const allImages = product.images?.length
    ? product.images.map((img) => img.imageUrl)
    : product.imageUrl
    ? [product.imageUrl]
    : [];

  const activeImageUrl = allImages[activeImageIndex] || allImages[0] || "";

  return (
    <main className="space-y-6 sm:space-y-8">
      <div className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
        <Link href="/browse" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline">
          &rarr; العودة لتصفح المعروضات
        </Link>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Image Gallery Container */}
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[28px] border border-stone-200 bg-stone-100 h-[280px] sm:h-[380px] lg:h-[440px] flex items-center justify-center">
              {activeImageUrl ? (
                <img
                  src={getImageUrl(activeImageUrl)}
                  alt={product.title}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallbackEl) fallbackEl.style.display = "flex";
                  }}
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div
                style={{ display: activeImageUrl ? "none" : "flex" }}
                className="absolute inset-0 flex-col items-center justify-center bg-stone-100 text-stone-400 p-4 text-center"
              >
                <span className="text-4xl mb-2">📷</span>
                <span className="text-xs font-bold">لا توجد صورة معروضة</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex items-center justify-between pointer-events-none">
                <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-stone-800 shadow-sm">
                  مفحوص وموثق
                </span>
                <span className="rounded-full bg-stone-900/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white">
                  {product.condition || "ممتاز"}
                </span>
              </div>
            </div>

            {/* Multi-image thumbnail selector */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeImageIndex === idx
                        ? "border-amber-600 ring-2 ring-amber-600/30 shadow-md"
                        : "border-stone-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getImageUrl(imgUrl)}
                      alt={`${product.title} - صورة ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Purchase Actions */}
          <div className="space-y-5 sm:space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">{product.categoryName || "عام"}</p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl lg:text-4xl leading-tight">
                {product.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-600">
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700 border border-emerald-200">
                ✓ متوفر للشراء المباشر
              </span>
              <span>📍 توصيل سريع لجميع المحافظات</span>
            </div>

            <div className="text-2xl sm:text-3xl font-bold text-stone-900">{product.price} ج.م</div>

            <p className="text-xs sm:text-sm leading-6 sm:leading-7 text-stone-600 font-medium">{product.description}</p>

            {/* Owner badge and disabled/hidden Buy Now button */}
            <div className="flex flex-col gap-3">
              {isOwner ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs sm:text-sm font-bold text-amber-800 shadow-sm">
                    <span className="text-base">🏷️</span>
                    <span>هذا المنتج مملوق لك</span>
                  </div>
                  <div>
                    <button
                      disabled
                      aria-disabled="true"
                      className="w-full sm:w-auto text-center rounded-2xl bg-stone-200 px-7 py-3.5 sm:py-4 text-sm font-bold text-stone-500 cursor-not-allowed border border-stone-300 shadow-none opacity-80"
                    >
                      شراء الآن — الدفع عند الاستلام (COD)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleBuyNowClick}
                    disabled={isSubmitting || isOwner}
                    className="w-full sm:w-auto text-center rounded-2xl bg-stone-900 px-7 py-3.5 sm:py-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />
                        <span>جاري التحويل...</span>
                      </>
                    ) : (
                      "شراء الآن — الدفع عند الاستلام (COD)"
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500">معلومات البائع</div>
              <div className="flex items-center justify-between text-xs sm:text-sm text-stone-700">
                <span className="font-bold">{product.sellerName || "بائع منصة الوكالة"}</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  ✓ هويّة موثقة
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProductByIdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500 font-medium">جاري التحميل...</div>}>
      <ProductByIdDetailContent params={params} />
    </Suspense>
  );
}
