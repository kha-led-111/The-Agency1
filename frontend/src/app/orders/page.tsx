"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { mockOrders, Order } from "@/lib/mock-data";

function OrdersContent() {
  const searchParams = useSearchParams();
  const showSuccessToast = searchParams.get("success") === "true";

  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [activeTab, setActiveTab] = useState<"purchases" | "sales">("purchases");
  const [toast, setToast] = useState<string | null>(showSuccessToast ? "تم تأكيد طلبك بنجاح! جاري التنسيق للتوصيل الأوفلاين." : null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCancelOrder = (id: string, orderNumber: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "Cancelled" } : o))
    );
    setToast(`تم إلغاء الطلب ${orderNumber} بنجاح.`);
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "OutForDelivery":
        return <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 animate-pulse">جاري التوصيل الآن</span>;
      case "Delivered":
        return <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">تم التسليم واستلام النقد</span>;
      case "Processing":
        return <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-200">قيد المعالجة والتغليف</span>;
      case "Paid":
        return <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">تم الدفع والتحصيل</span>;
      case "Cancelled":
        return <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">طلب ملغي</span>;
      default:
        return <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700">في انتظار الدفع</span>;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-white shadow-xl flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-stone-900 text-white py-12 rounded-3xl mb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <span className="inline-block rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            مركز الطلبات
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">طلباتك وسجل المعاملات</h1>
          <p className="mt-1 text-sm text-stone-400 font-medium">
            تتبع الشحنات المباشرة مع مندوب التوصيل، راجع تفاصيل المبالغ، وإدارات المشتريات والمبيعات.
          </p>

          {/* View Mode Tabs */}
          <div className="mt-6 flex gap-2 border-b border-stone-800 pb-px">
            <button
              onClick={() => setActiveTab("purchases")}
              className={`px-4 py-2.5 text-sm font-bold transition border-b-2 ${
                activeTab === "purchases"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              مشترياتي ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-4 py-2.5 text-sm font-bold transition border-b-2 ${
                activeTab === "sales"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              طلبات المبيعات (2)
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-6 hover:border-stone-300 transition">
            {/* Top Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-stone-900">{order.orderNumber}</span>
                  {getStatusBadge(order.status)}
                </div>
                <p className="mt-1 text-xs text-stone-500 font-medium">تاريخ الطلب: {order.createdAt}</p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/orders/${order.id}/tracking`}
                  className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-800 shadow-sm"
                >
                  تتبع التوصيل المباشر ←
                </Link>
              </div>
            </div>

            {/* Content Details */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="md:col-span-7 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">تفاصيل المنتج المطلوبة</p>
                <h3 className="text-lg font-bold text-stone-900">
                  <Link href={`/product/${order.productSlug}`} className="hover:underline">
                    {order.productTitle}
                  </Link>
                </h3>
                <p className="text-xs text-stone-600 font-medium">عنوان التوصيل: {order.shippingAddress}</p>
                {order.courierName && (
                  <p className="text-xs font-bold text-amber-900 bg-amber-50 rounded-lg px-3 py-1.5 inline-block border border-amber-200">
                    مندوب التوصيل: {order.courierName} ({order.courierPhone})
                  </p>
                )}
              </div>

              {/* Price Breakdown Box */}
              <div className="md:col-span-5 rounded-xl bg-stone-50 p-4 border border-stone-200 text-xs space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>سعر المنتج</span>
                  <span className="font-bold text-stone-900">{order.productPrice} ج.م</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>رسوم التوصيل</span>
                  <span className="font-bold text-stone-900">{order.deliveryFee} ج.م</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>رسوم الخدمة</span>
                  <span className="font-bold text-stone-900">{order.buyerFee} ج.م</span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-stone-900 text-sm">
                  <span>المبلغ الكلي الدفع عند الاستلام</span>
                  <span className="text-emerald-700">{order.totalAmount} ج.م</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-400 font-medium">طريقة السداد: {order.paymentMethod}</span>
              {order.status !== "Cancelled" && order.status !== "Delivered" && (
                <button
                  onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                  className="text-xs font-bold text-red-600 hover:text-red-800 transition hover:underline"
                >
                  إلغاء الطلب
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 p-12 text-center text-sm text-stone-500">جاري تحميل الطلبات...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
