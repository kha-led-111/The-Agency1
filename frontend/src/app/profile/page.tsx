"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getImageUrl } from "@/lib/api";

interface FavoriteProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  status?: string;
  imageUrl?: string;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFavorites() {
      if (!user) return;
      setLoadingFavorites(true);
      try {
        const res = await fetch("/api/marketplace/favorites", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch user favorites", err);
      } finally {
        setLoadingFavorites(false);
      }
    }

    fetchFavorites();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-stone-500 font-bold text-sm">
        جاري تحميل بيانات الحساب...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
        <h1 className="text-2xl font-bold text-stone-900">سجل الدخول لاستعراض ملفك الشخصي</h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-500 font-medium">
          يرجى تسجيل الدخول للوصول إلى بيانات الحساب والمستحقات المالية.
        </p>
        <Link
          href="/auth"
          className="mt-6 rounded-full bg-stone-900 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-stone-800 transition"
        >
          الانتقال لتسجيل الدخول
        </Link>
      </div>
    );
  }

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  const initials = (user.firstName?.[0] || user.email[0] || "U").toUpperCase();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-50 rounded-2xl bg-stone-900 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-stone-900 text-white py-8 sm:py-12 rounded-3xl mb-6 sm:mb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <span className="inline-block rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            مركز المستخدم
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">الملف الشخصي والدفتر المالي</h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-400 font-medium">
            إدارة إعدادات حسابك الشخصي، متابعة المستحقات والتحويلات المالية، والقطع المحفوظة.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6 space-y-6 sm:space-y-8">
        {/* Profile Card & Identity Info */}
        <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 font-bold text-stone-950 text-xl sm:text-2xl shadow-md shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-stone-900">{fullName}</h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-emerald-700 border border-emerald-200">
                  حساب موثق ({user.role})
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5 dir-ltr text-right">
                {user.email} {user.phoneNumber ? `• ${user.phoneNumber}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition self-start sm:self-auto"
          >
            تسجيل الخروج
          </button>
        </div>

        {/* Financial Ledger Section */}
        <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
          <div className="border-b border-stone-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">الدفتر المالي والسحوبات البنكية</h2>
              <p className="text-xs text-stone-500 font-medium">ملخص شفاف للرصيد المتاح وعمولات المنصة المستقطعة</p>
            </div>
            <button className="w-fit rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 transition">
              طلب تحويل للبنك
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="rounded-xl bg-stone-50 p-3.5 sm:p-4 border border-stone-200">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">الرصيد المتاح للسحب</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-stone-900">0.00 ج.م</p>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 mt-1 font-bold">جاهز للتحويل الفوري</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3.5 sm:p-4 border border-stone-200">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">النقد المعلق (COD)</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-amber-600">0.00 ج.م</p>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">قيد التوصيل للعميل</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3.5 sm:p-4 border border-stone-200">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">صافي المبيعات</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-stone-900">0.00 ج.م</p>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">بعد عمولة البائع 10%</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3.5 sm:p-4 border border-stone-200">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">رسوم المنصة المدفوعة</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-stone-900">0.00 ج.م</p>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">رسوم حماية وإدارة</p>
            </div>
          </div>
        </div>

        {/* Saved Wishlist Items */}
        <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900">القطع المحفوظة في المفضلة ♡</h2>
            <Link href="/browse" className="text-xs font-bold text-amber-700 hover:underline">
              تصفح المزيد &rarr;
            </Link>
          </div>

          {loadingFavorites ? (
            <div className="p-4 text-center text-xs font-bold text-stone-400">جاري تحميل المفضلة...</div>
          ) : favorites.length === 0 ? (
            <div className="p-6 text-center text-xs font-medium text-stone-500">لا توجد قطع محفوظة في المفضلة حالياً.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {favorites.map((p) => {
                const isPublished = !p.status || p.status === "Published";
                const isSold = p.status === "Sold";

                return (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-stone-50 p-3 hover:border-stone-400 transition"
                  >
                    <Link href={`/product/${p.slug}`} className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img
                          src={getImageUrl(p.imageUrl)}
                          alt={p.title}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          className="h-14 w-14 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 text-xs font-bold shrink-0">
                          📷
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {isSold ? (
                            <span className="rounded-full bg-stone-800 text-white px-2 py-0.5 text-[10px] font-bold">
                              تم الشراء
                            </span>
                          ) : !isPublished ? (
                            <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                              غير متاح حالياً
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs font-bold text-stone-900 truncate">{p.title}</div>
                        <div className="text-xs font-bold text-amber-700 mt-0.5">{p.price} ج.م</div>
                      </div>
                    </Link>

                    <div className="mt-3 flex items-center justify-end border-t border-stone-200/60 pt-2">
                      {isPublished ? (
                        <Link
                          href={`/checkout?slug=${p.slug}`}
                          className="rounded-lg bg-stone-900 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-stone-800"
                        >
                          شراء الآن
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rounded-lg bg-stone-200 px-3 py-1 text-[11px] font-bold text-stone-500 cursor-not-allowed opacity-60"
                        >
                          {isSold ? "تم الشراء" : "غير متاح"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
