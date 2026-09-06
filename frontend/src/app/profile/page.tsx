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
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-stone-900 text-white py-12 rounded-3xl mb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <span className="inline-block rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            مركز المستخدم
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">الملف الشخصي والدفتر المالي</h1>
          <p className="mt-1 text-sm text-stone-400 font-medium">
            إدارة إعدادات حسابك الشخصي، متابعة المستحقات والتحويلات المالية، والقطع المحفوظة.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
        {/* Profile Card & Role Switcher */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 font-bold text-stone-950 text-2xl shadow-md flex-shrink-0">
              ع م
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-stone-900">عمر المنصور</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  حساب موثق
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">omar.mansoor@example.com &bull; دبي، الإمارات العربية المتحدة</p>
              <p className="text-xs text-stone-400 mt-0.5 font-medium">عضو منذ أغسطس 2024</p>
            </div>
          </div>

          {/* Role Simulation Switcher */}
          <div className="rounded-xl bg-stone-100 p-1.5 flex gap-1 self-start sm:self-auto border border-stone-200">
            {(["مشتري", "بائع", "مسؤول"] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
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
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">الدفتر المالي والسحوبات البنكية</h2>
              <p className="text-xs text-stone-500 font-medium">ملخص شفاف للرصيد المتاح وعمولات المنصة المستقطعة</p>
            </div>
            <button className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 transition">
              طلب تحويل للبنك
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">الرصيد المتاح للسحب</span>
              <p className="mt-2 text-2xl font-bold text-stone-900">{mockLedger.availableBalance} ج.م</p>
              <p className="text-[11px] text-emerald-600 mt-1 font-bold">جاهز للتحويل الفوري</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">النقد المعلق لدى المندوب</span>
              <p className="mt-2 text-2xl font-bold text-amber-600">{mockLedger.pendingCashHeld} ج.م</p>
              <p className="text-[11px] text-stone-500 mt-1 font-medium">قيد التوصيل للعميل</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">إجمالي مبيعات البائع</span>
              <p className="mt-2 text-2xl font-bold text-stone-900">{mockLedger.totalEarned} ج.م</p>
              <p className="text-[11px] text-stone-500 mt-1 font-medium">إجمالي أرباحك الصافية</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">عمولات المنصة المسددة</span>
              <p className="mt-2 text-2xl font-bold text-stone-900">{mockLedger.totalFeesPaid} ج.م</p>
              <p className="text-[11px] text-stone-500 mt-1 font-medium">إجمالي عمولات 10%</p>
            </div>
          </div>
        </div>

        {/* Saved Favorites */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">القطع المحفوظة في المفضلة</h2>
            <span className="text-xs font-bold text-stone-500">{favoriteProducts.length} قطع محفوظة</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {favoriteProducts.map((product) => (
              <div key={product.id} className="rounded-xl border border-stone-200 p-4 hover:border-stone-300 transition flex flex-col justify-between">
                <div>
                  <div className="h-24 w-full rounded-lg overflow-hidden bg-stone-100 mb-3">
                    <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-900">{product.title}</h3>
                  <p className="text-xs text-stone-500 font-medium">{product.category} &bull; {product.condition}</p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-2 border-t border-stone-100">
                  <span className="text-sm font-bold text-stone-900">{product.price} ج.م</span>
                  <Link
                    href={`/product/${product.slug}`}
                    className="rounded-lg bg-stone-900 px-3 py-1 text-xs font-bold text-white hover:bg-stone-800 transition"
                  >
                    شراء الآن
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
