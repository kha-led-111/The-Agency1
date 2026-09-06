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
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-white shadow-lg animate-in fade-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-stone-900 text-white py-12 rounded-3xl mb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-block rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                استوديو البائع
              </span>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">لوحة تحكم البائع</h1>
              <p className="mt-1 text-sm text-stone-400 font-medium">
                إدارة معروضاتك النشطة، تتبع أرباحك الصافية، وإضافة منتجات جديدة للبيع.
              </p>
            </div>
            <Link
              href="/seller/create-listing"
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-stone-950 transition hover:bg-amber-400 shadow-md"
            >
              + إضافة إعلان جديد
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">الرصيد المتاح للسحب</p>
            <p className="mt-2 text-3xl font-bold text-stone-900">{mockLedger.availableBalance} ج.م</p>
            <p className="mt-1 text-xs text-emerald-600 font-bold">جاهز للتحويل البنكي</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">النقد المعلق لدى المندوب (COD)</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{mockLedger.pendingCashHeld} ج.م</p>
            <p className="mt-1 text-xs text-stone-500 font-medium">قيد التوصيل للعميل</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">الإعلانات النشطة</p>
            <p className="mt-2 text-3xl font-bold text-stone-900">{sellerListings.length}</p>
            <p className="mt-1 text-xs text-stone-500 font-medium">معروضة حالياً في السوق</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">إجمالي المبيعات الإجمالية</p>
            <p className="mt-2 text-3xl font-bold text-stone-900">{mockLedger.totalEarned} ج.م</p>
            <p className="mt-1 text-xs text-stone-500 font-medium">بعد خصم عمولة البائع 10%</p>
          </div>
        </div>

        {/* Listings Management Table */}
        <div className="mt-10 rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">معروضاتك في السوق</h2>
              <p className="text-xs text-stone-500 font-medium">قائمة المنتجات النشطة المسجلة باسمك</p>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700">
              {sellerListings.length} قطع
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-stone-600">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500 border-b border-stone-200">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold">المنتج</th>
                  <th scope="col" className="px-6 py-3 font-bold">الفئة</th>
                  <th scope="col" className="px-6 py-3 font-bold">الحالة</th>
                  <th scope="col" className="px-6 py-3 font-bold">السعر</th>
                  <th scope="col" className="px-6 py-3 font-bold">حالة الإعلان</th>
                  <th scope="col" className="px-6 py-3 font-bold text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {sellerListings.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/80 transition">
                    <td className="px-6 py-4 font-bold text-stone-900 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <Link href={`/product/${item.slug}`} className="hover:underline">
                          {item.title}
                        </Link>
                        <div className="text-xs text-stone-400 font-normal">معرف: PRD-00{item.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{item.category}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700">
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-stone-900">{item.price} ج.م</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        نشط
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left space-x-2 space-x-reverse">
                      <Link
                        href={`/product/${item.slug}`}
                        className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100 transition"
                      >
                        عرض
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition"
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
