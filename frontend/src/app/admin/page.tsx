"use client";

import { useState } from "react";
import Link from "next/link";
import { products, mockOrders } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  const [moderationItems, setModerationItems] = useState(products.slice(0, 4));
  const [toast, setToast] = useState<string | null>(null);

  const handleApprove = (title: string) => {
    setToast(`تمت الموافقة على نشر إعلان "${title}".`);
    setModerationItems((prev) => prev.filter((i) => i.title !== title));
    setTimeout(() => setToast(null), 3000);
  };

  const handleReject = (title: string) => {
    setToast(`تم رفض إعلان "${title}".`);
    setModerationItems((prev) => prev.filter((i) => i.title !== title));
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-50 rounded-2xl bg-stone-900 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-stone-900 text-white py-8 sm:py-12 rounded-3xl mb-6 sm:mb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-red-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/30">
            لوحة الإدارة والمراجعة
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">مركز القيادة والعمليات</h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-400 font-medium">
            مراقبة الحجم الإجمالي للتداولات (GMV)، مراجعة الإعلانات المعلّقة، وتدقيق ميزانية المنصة والمندوبين.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* System Overview Metrics Grid (2 cols mobile, 4 desktop) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">حجم التداولات (GMV)</span>
            <p className="mt-1.5 text-lg sm:text-3xl font-bold text-stone-900">184,920 ج.م</p>
            <p className="mt-1 text-[10px] sm:text-xs text-emerald-600 font-bold">+14.2% هذا الشهر</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">النقد المعلق لدى المناديب</span>
            <p className="mt-1.5 text-lg sm:text-3xl font-bold text-amber-600">12,450 ج.م</p>
            <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">88 مندوب نشط</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">إعلانات تنتظر المراجعة</span>
            <p className="mt-1.5 text-lg sm:text-3xl font-bold text-red-600">{moderationItems.length}</p>
            <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">تتطلب التدقيق</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">المستخدمين المسجلين</span>
            <p className="mt-1.5 text-lg sm:text-3xl font-bold text-stone-900">4,812</p>
            <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">2,410 بائع / 2,402 مشتري</p>
          </div>
        </div>

        {/* System Ledger Status Banner */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-emerald-950 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 shrink-0 animate-ping" />
            <span className="font-bold">فحص مطابقة الدفتر المالي: مطابقة بنسبة 100%. جميع عمولات البائعين والمشترين ورسوم التوصيل دقيقة.</span>
          </div>
          <span className="font-mono text-emerald-700 font-bold shrink-0">الحالة: مكتمل بنجاح</span>
        </div>

        {/* Moderation Queue Table Container */}
        <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-stone-200 p-4 sm:px-6 sm:py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">طابور مراجعة المعروضات الجديدة</h2>
              <p className="text-xs text-stone-500 font-medium">التحقق من أصالة المنتجات ومطابقتها للشروط قبل النشر</p>
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              {moderationItems.length} ينتظر القرار
            </span>
          </div>

          {moderationItems.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold text-stone-500">
              ✓ طابور المراجعة فارغ! تم البت في جميع الإعلانات.
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-right text-xs sm:text-sm text-stone-600 min-w-[620px]">
                <thead className="bg-stone-50 text-[11px] uppercase text-stone-500 border-b border-stone-200">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">الإعلان والمنتج</th>
                    <th scope="col" className="px-4 py-3 font-bold">البائع</th>
                    <th scope="col" className="px-4 py-3 font-bold">الفئة</th>
                    <th scope="col" className="px-4 py-3 font-bold">السعر</th>
                    <th scope="col" className="px-4 py-3 font-bold text-left">قرار المراجعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {moderationItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition">
                      <td className="px-4 py-3.5 font-bold text-stone-900 flex items-center gap-3">
                        <img src={item.imageUrl} alt={item.title} className="h-10 w-10 rounded-lg object-cover border border-stone-200 shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-[220px]">{item.title}</span>
                      </td>
                      <td className="px-4 py-3.5 font-medium">{item.seller}</td>
                      <td className="px-4 py-3.5 text-stone-600 font-medium">{item.category}</td>
                      <td className="px-4 py-3.5 font-bold text-stone-900">{item.price} ج.م</td>
                      <td className="px-4 py-3.5 text-left space-x-2 space-x-reverse">
                        <button
                          type="button"
                          onClick={() => handleApprove(item.title)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                        >
                          موافقة ونشر
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(item.title)}
                          className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                        >
                          رفض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
