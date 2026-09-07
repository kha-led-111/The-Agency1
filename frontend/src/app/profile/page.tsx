"use client";

import { useState } from "react";
import Link from "next/link";
import { mockLedger, products } from "@/lib/mock-data";

export default function ProfilePage() {
  const [activeRole, setActiveRole] = useState<"مشتري" | "بائع" | "مسؤول">("مشتري");
  const [toast, setToast] = useState<string | null>(null);

  const favoriteProducts = products.slice(0, 3);

  const handleRoleChange = (role: "مشتري" | "بائع" | "مسؤول") => {
    setActiveRole(role);
    setToast(`تم تغيير الصلاحية النشطة للعرض إلى: ${role}`);
    setTimeout(() => setToast(null), 3000);
  };

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
        {/* Profile Card & Role Switcher */}
        <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 font-bold text-stone-950 text-xl sm:text-2xl shadow-md shrink-0">
              ع م
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-stone-900">عمر المنصور</h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-emerald-700 border border-emerald-200">
                  حساب موثق
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">omar.mansoor@example.com &bull; القاهرة، مصر</p>
              <p className="text-[11px] text-stone-400 mt-0.5 font-medium">عضو منذ أغسطس 2024</p>
            </div>
          </div>

          {/* Role Simulation Switcher */}
          <div className="rounded-xl bg-stone-100 p-1.5 flex gap-1 self-start sm:self-auto border border-stone-200">
            {(["مشتري", "بائع", "مسؤول"] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeRole === r
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
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
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-stone-900">{mockLedger.availableBalance} ج.م</p>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 mt-1 font-bold">جاهز للتحويل الفوري</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3.5 sm:p-4 border border-stone-200">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">النقد المعلق (COD)</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-amber-600">{mockLedger.pendingCashHeld} ج.م</p>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">قيد التوصيل للعميل</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3.5 sm:p-4 border border-stone-200">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">صافي المبيعات</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-stone-900">{mockLedger.totalEarned} ج.م</p>
              <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">بعد عمولة البائع 10%</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3.5 sm:p-4 border border-stone-200">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500">رسوم المنصة المدفوعة</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-stone-900">{mockLedger.totalFeesPaid} ج.م</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {favoriteProducts.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 hover:border-stone-400 transition"
              >
                <img src={p.imageUrl} alt={p.title} className="h-14 w-14 rounded-xl object-cover border border-stone-200 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-stone-900 truncate">{p.title}</div>
                  <div className="text-xs font-bold text-amber-700 mt-0.5">{p.price} ج.م</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
