"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface OrderItem {
  id: string;
  orderNumber: string;
  productTitle: string;
  productSlug: string;
  productPrice: number;
  deliveryFee: number;
  buyerFee: number;
  sellerCommission: number;
  totalAmount: number;
  status: "PendingAdminReview" | "PendingSellerConfirmation" | "PendingPayment" | "Paid" | "Processing" | "OutForDelivery" | "Delivered" | "Cancelled" | string;
  paymentMethod: string;
  shippingAddress: string;
  createdAt: string;
  courierName?: string;
  courierPhone?: string;
}

/*const INITIAL_ORDERS: OrderItem[] = [
  {
    id: "ord-8812",
    orderNumber: "AG-881204",
    productTitle: "معطف اتيليه كلاسيكي (Atelier Trench)",
    productSlug: "atelier-trench-coat",
    productPrice: 148,
    deliveryFee: 30,
    buyerFee: 14.8,
    sellerCommission: 14.8,
    totalAmount: 192.8,
    status: "OutForDelivery",
    paymentMethod: "الدفع عند الاستلام (COD)",
    shippingAddress: "شارع البحر، المحلة الكبرى",
    createdAt: "04 سبتمبر 2026 - 10:30 صباحاً",
    courierName: "طارق المنصور",
    courierPhone: "+20 100 123 4567",
  },
  {
    id: "ord-7731",
    orderNumber: "AG-773192",
    productTitle: "حذاء رياضي نيو رانر (Neo Runner)",
    productSlug: "neo-runner-sneaker",
    productPrice: 120,
    deliveryFee: 30,
    buyerFee: 12,
    sellerCommission: 12,
    totalAmount: 162,
    status: "Delivered",
    paymentMethod: "الدفع عند الاستلام (COD)",
    shippingAddress: "شارع النحاس، طنطا",
    createdAt: "03 سبتمبر 2026 - 02:15 مساءً",
    courierName: "حسان علي",
    courierPhone: "+20 111 987 6543",
  },
];*/

function OrdersContent() {
  const searchParams = useSearchParams();
  const showSuccessToast = searchParams.get("success") === "true";

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"purchases" | "sales">("purchases");
  const [toast, setToast] = useState<string | null>(
    showSuccessToast ? "تم تأكيد طلبك بنجاح! جاري التنسيق للتوصيل الأوفلاين." : null
  );

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const endpoint = activeTab === "purchases" ? "/api/orders/buyer" : "/api/orders/seller";
        const res = await fetch(endpoint, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const mapped: OrderItem[] = data.map((dto: any) => {
            const firstItem = dto.items?.[0] || {};
            return {
              id: dto.id,
              orderNumber: dto.orderNumber,
              productTitle: firstItem.productTitle || "منتج الوكالة",
              productSlug: firstItem.productSlug || "product",
              productPrice: dto.itemPrice || firstItem.unitPrice || 0,
              deliveryFee: dto.deliveryFee || 30,
              buyerFee: dto.buyerFee || 0,
              sellerCommission: dto.sellerCommission || 0,
              totalAmount: dto.totalAmount || 0,
              status: dto.status,
              paymentMethod: dto.paymentMethod === "CashOnDelivery" ? "الدفع عند الاستلام (COD)" : dto.paymentMethod,
              shippingAddress: dto.shippingAddress,
              createdAt: new Date(dto.createdAtUtc).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            };
          });
          setOrders(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCancelOrder = async (id: string, orderNumber: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: "Cancelled" } : o))
        );
        setToast(`تم إلغاء الطلب ${orderNumber} بنجاح.`);
      } else {
        const err = await res.json().catch(() => ({}));
        setToast(err.detail || err.error || `تعذر إلغاء الطلب ${orderNumber}.`);
      }
    } catch {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "Cancelled" } : o))
      );
      setToast(`تم إلغاء الطلب ${orderNumber} بنجاح.`);
    }
  };

  const getStatusBadge = (status: OrderItem["status"]) => {
    switch (status) {
      case "PendingAdminReview":
        return <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">قيد مراجعة وتنسيق المسؤول</span>;
      case "PendingSellerConfirmation":
        return <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">قيد تأكيد التوفر من البائع</span>;
      case "OutForDelivery":
        return <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 animate-pulse">جاري التوصيل الآن</span>;
      case "Delivered":
        return <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">تم التسليم واستلام النقد</span>;
      case "Processing":
        return <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-200">قيد المعالجة والتغليف</span>;
      case "Paid":
        return <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">تم الدفع والتحصيل</span>;
      case "Cancelled":
        return <span className="w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">طلب ملغي</span>;
      default:
        return <span className="w-fit rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700">قيد الانتظار</span>;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-50 rounded-2xl bg-stone-900 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-xl flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-stone-900 text-white py-8 sm:py-12 rounded-3xl mb-6 sm:mb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <span className="inline-block rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            مركز الطلبات
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">طلباتك وسجل المعاملات</h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-400 font-medium">
            تتبع الشحنات المباشرة مع مندوب التوصيل، راجع تفاصيل المبالغ، وإدارات المشتريات والمبيعات.
          </p>

          {/* View Mode Tabs */}
          <div className="mt-6 flex gap-2 border-b border-stone-800 pb-px">
            <button
              onClick={() => setActiveTab("purchases")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold transition border-b-2 ${activeTab === "purchases"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-stone-400 hover:text-stone-200"
                }`}
            >
              مشترياتي ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold transition border-b-2 ${activeTab === "sales"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-stone-400 hover:text-stone-200"
                }`}
            >
              طلبات المبيعات (0)
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6 space-y-4 sm:space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6 hover:border-stone-300 transition">
            {/* Top Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="text-sm sm:text-base font-bold text-stone-900">{order.orderNumber}</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="text-xs text-stone-500 mt-1">تاريخ الطلب: {order.createdAt}</div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase">إجمالي التكلفة</div>
                  <div className="text-base sm:text-lg font-bold text-stone-900">{order.totalAmount.toFixed(2)} ج.م</div>
                </div>

                <Link
                  href={`/orders/${order.id}/tracking`}
                  className="rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-800"
                >
                  تتبع الشحنة →
                </Link>
              </div>
            </div>

            {/* Order Product */}
            <div className="flex gap-3 sm:gap-4 items-center rounded-xl bg-stone-50 p-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs sm:text-sm text-stone-900 truncate">{order.productTitle}</div>
                <div className="text-xs text-stone-500 mt-0.5">طريقة الدفع: {order.paymentMethod}</div>
                <div className="text-xs font-bold text-stone-900 mt-1">{order.productPrice.toFixed(2)} ج.م</div>
              </div>
            </div>

            {/* Delivery Address & Status Callouts */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
              <div className="text-stone-600 font-medium">
                📍 <span className="font-bold text-stone-800">عنوان الاستلام:</span> {order.shippingAddress}
              </div>

              {order.status === "OutForDelivery" ? (
                <div className="w-fit text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                  الطلب قيد التوصيل الآن، للإلغاء يرجى التواصل مع الدعم
                </div>
              ) : (order.status === "PendingSellerConfirmation" || order.status === "PendingPayment" || order.status === "Paid" || order.status === "Processing") ? (
                <button
                  onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                  className="w-fit text-xs font-bold text-red-600 hover:text-red-800 hover:underline"
                >
                  إلغاء الطلب
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500 font-medium">جاري تحميل قائمة الطلبات...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
