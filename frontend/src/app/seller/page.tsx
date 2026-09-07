"use client";

import Link from "next/link";
import { products, mockLedger } from "@/lib/mock-data";
import { useState } from "react";

export default function SellerDashboardPage() {
  const [sellerListings, setSellerListings] = useState(products);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDelete = (id: number, title: string) => {
    setSellerListings((prev) => prev.filter((item) => item.id !== id));
    setToastMessage(`تم حذف الإعلان "${title}" بنجاح.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-50 rounded-2xl bg-stone-900 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-stone-900 text-white py-8 sm:py-12 rounded-3xl mb-6 sm:mb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-block rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                استوديو البائع
              </span>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">لوحة تحكم البائع</h1>
              <p className="mt-1 text-xs sm:text-sm text-stone-400 font-medium">
                إدارة معروضاتك النشطة، تتبع أرباحك الصافية، وإضافة منتجات جديدة للبيع.
              </p>
            </div>
            <Link
              href="/seller/create-listing"
              className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-stone-950 transition hover:bg-amber-400 shadow-md"
            >
              + إضافة إعلان جديد
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Key Metrics Grid (2 cols mobile, 4 desktop) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">الرصيد المتاح للسحب</p>
            <p className="mt-1.5 text-xl sm:text-3xl font-bold text-stone-900">{mockLedger.availableBalance} ج.م</p>
            <p className="mt-1 text-[10px] sm:text-xs text-emerald-600 font-bold">جاهز للتحويل البنكي</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">النقد المعلق (COD)</p>
            <p className="mt-1.5 text-xl sm:text-3xl font-bold text-amber-600">{mockLedger.pendingCashHeld} ج.م</p>
            <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">قيد التوصيل للعميل</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">الإعلانات النشطة</p>
            <p className="mt-1.5 text-xl sm:text-3xl font-bold text-stone-900">{sellerListings.length}</p>
            <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">معروضة حالياً في السوق</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">إجمالي المبيعات</p>
            <p className="mt-1.5 text-xl sm:text-3xl font-bold text-stone-900">{mockLedger.totalEarned} ج.م</p>
            <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">بعد خصم عمولة البائع 10%</p>
          </div>
        </div>

        {/* Listings Management Table Container */}
        <div className="mt-8 sm:mt-10 rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-stone-200 p-4 sm:px-6 sm:py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">معروضاتك في السوق</h2>
              <p className="text-xs text-stone-500 font-medium">قائمة المنتجات النشطة المسجلة باسمك</p>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700">
              {sellerListings.length} قطع
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-right text-xs sm:text-sm text-stone-600 min-w-[600px]">
              <thead className="bg-stone-50 text-[11px] uppercase text-stone-500 border-b border-stone-200">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">المنتج</th>
                  <th scope="col" className="px-4 py-3 font-bold">الفئة</th>
                  <th scope="col" className="px-4 py-3 font-bold">الحالة</th>
                  <th scope="col" className="px-4 py-3 font-bold">السعر</th>
                  <th scope="col" className="px-4 py-3 font-bold">حالة الإعلان</th>
                  <th scope="col" className="px-4 py-3 font-bold text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {sellerListings.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/80 transition">
                    <td className="px-4 py-3.5 font-bold text-stone-900 flex items-center gap-3">
                      <img src={item.imageUrl} alt={item.title} className="h-10 w-10 rounded-lg object-cover border border-stone-200 shrink-0" />
                      <span className="truncate max-w-[160px] sm:max-w-[220px]">{item.title}</span>
                    </td>
                    <td className="px-4 py-3.5 text-stone-600 font-medium">{item.category}</td>
                    <td className="px-4 py-3.5 font-medium">{item.condition}</td>
                    <td className="px-4 py-3.5 font-bold text-stone-900">{item.price} ج.م</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        معروض للبيع
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-left space-x-2 space-x-reverse">
                      <Link
                        href={`/product/${item.slug}`}
                        className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-200 transition"
                      >
                        معاينة
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
