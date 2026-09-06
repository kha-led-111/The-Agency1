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
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-stone-900 text-white py-12 rounded-3xl mb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-red-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/30">
            لوحة الإدارة والمراجعة
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">مركز القيادة والعمليات</h1>
          <p className="mt-1 text-sm text-stone-400 font-medium">
            مراقبة الحجم الإجمالي للتداولات (GMV)، مراجعة الإعلانات المعلّقة، وتدقيق ميزانية المنصة والمندوبين.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* System Overview Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">حجم التداولات الإجمالي (GMV)</span>
            <p className="mt-2 text-3xl font-bold text-stone-900">$184,920</p>
            <p className="mt-1 text-xs text-emerald-600 font-bold">+14.2% مقارنة بالشهر الماضي</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">النقد المعلق لدى المناديب</span>
            <p className="mt-2 text-3xl font-bold text-amber-600">$12,450</p>
            <p className="mt-1 text-xs text-stone-500 font-medium">موزعة على 88 مندوب توصيل نشط</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">إعلانات تنتظر المراجعة</span>
            <p className="mt-2 text-3xl font-bold text-red-600">{moderationItems.length}</p>
            <p className="mt-1 text-xs text-stone-500 font-medium">منتجات معلقة تتطلب التدقيق</p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">المستخدمين المسجلين</span>
            <p className="mt-2 text-3xl font-bold text-stone-900">4,812</p>
            <p className="mt-1 text-xs text-stone-500 font-medium">2,410 بائع / 2,402 مشتري</p>
          </div>
        </div>

        {/* System Ledger Status Banner */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold">فحص مطابقة الدفتر المالي: مطابقة بنسبة 100%. جميع عمولات البائعين والمشترين ورسوم التوصيل دقيقة وفقاً للقوانين.</span>
          </div>
          <span className="font-mono text-emerald-700 font-bold">الحالة: مكتمل بنجاح</span>
        </div>

        {/* Moderation Queue */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">طابور مراجعة المعروضات الجديدة</h2>
              <p className="text-xs text-stone-500 font-medium">التحقق من أصالة المنتجات ومطابقتها للشروط قبل النشر العام</p>
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
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm text-stone-600">
                <thead className="bg-stone-50 text-xs uppercase text-stone-500 border-b border-stone-200">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-bold">الإعلان</th>
                    <th scope="col" className="px-6 py-3 font-bold">البائع</th>
                    <th scope="col" className="px-6 py-3 font-bold">السعر</th>
                    <th scope="col" className="px-6 py-3 font-bold">الحالة</th>
                    <th scope="col" className="px-6 py-3 font-bold text-left">القرار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {moderationItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition">
                      <td className="px-6 py-4 font-bold text-stone-900">
                        <Link href={`/product/${item.slug}`} className="hover:underline">
                          {item.title}
                        </Link>
                        <span className="block text-xs font-normal text-stone-400">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 font-medium">{item.seller}</td>
                      <td className="px-6 py-4 font-bold text-stone-900">${item.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700">
                          {item.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleApprove(item.title)}
                          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                        >
                          موافقة
                        </button>
                        <button
                          onClick={() => handleReject(item.title)}
                          className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
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

        {/* Courier Fleet Monitoring */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">شبكة المناديب والتحصيل النقدي (COD)</h2>
              <p className="text-xs text-stone-500 font-medium">حالة المشتريات الجارية والمبالغ المحصلة بواسطة شبكة التوصيل</p>
            </div>
            <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
              3 مناديب متاحين
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {mockOrders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-900">{order.courierName || "لم يتم التعيين"}</span>
                  <p className="text-stone-500 font-medium">رقم الطلب: {order.orderNumber} &bull; الوجهة: {order.shippingAddress}</p>
                </div>
                <div className="text-left">
                  <span className="font-bold text-emerald-700">${order.totalAmount.toFixed(2)} COD</span>
                  <p className="text-amber-700 font-bold">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
