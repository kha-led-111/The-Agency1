"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getImageUrl } from "@/lib/api";

interface ProductDto {
  id: string;
  title: string;
  slug: string;
  price: number;
  condition: string;
  categoryName?: string;
  imageUrl?: string;
  status: string;
}

interface OrderDto {
  id: string;
  orderNumber: string;
  productTitle: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [sellerListings, setSellerListings] = useState<ProductDto[]>([]);
  const [sellerOrders, setSellerOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch("/api/marketplace?pageSize=50");
        if (res.ok) {
          const data = await res.json();
          setSellerListings(data.items || data || []);
        }
        const ordersRes = await fetch("/api/orders/seller", { credentials: "include" });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setSellerOrders(ordersData || []);
        }
      } catch (err) {
        console.error("Failed to fetch seller listings or orders", err);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  const handleSellerConfirmation = async (orderId: string, orderNumber: string, isAvailable: boolean) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/seller-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAvailable }),
      });
      if (res.ok) {
        setSellerOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: isAvailable ? "Processing" : "Cancelled" } : o))
        );
        setToastMessage(
          isAvailable
            ? `تم تأكيد توفر الطلب ${orderNumber} وجاري التجهيز للشحن.`
            : `تم تسجيل إلغاء الطلب ${orderNumber} وتوثيق نقطة التحذير.`
        );
      } else {
        setToastMessage("حدث خطأ أثناء إجراء التأكيد.");
      }
    } catch {
      setSellerOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: isAvailable ? "Processing" : "Cancelled" } : o))
      );
      setToastMessage(
        isAvailable
          ? `تم تأكيد توفر الطلب ${orderNumber} وجاري التجهيز للشحن.`
          : `تم تسجيل إلغاء الطلب ${orderNumber} وتوثيق نقطة التحذير.`
      );
    } finally {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSellerListings((prev) => prev.filter((item) => item.id !== id));
        setToastMessage(`تم حذف الإعلان "${title}" بنجاح.`);
      } else {
        setToastMessage(`تعذر حذف الإعلان "${title}".`);
      }
    } catch {
      setToastMessage("خطأ في الاتصال بالخادم.");
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
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
                مرحباً بك {user?.firstName ? `يا ${user.firstName}` : ""}! يمكنك إدارة معروضاتك النشطة وتتبع أرباحك الصافية.
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
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">الرصيد المتاح للسحب</p>
            <p className="mt-1.5 text-xl sm:text-3xl font-bold text-stone-900">0.00 ج.م</p>
            <p className="mt-1 text-[10px] sm:text-xs text-emerald-600 font-bold">جاهز للتحويل البنكي</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">النقد المعلق (COD)</p>
            <p className="mt-1.5 text-xl sm:text-3xl font-bold text-amber-600">0.00 ج.م</p>
            <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">قيد التوصيل للعميل</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">الإعلانات النشطة</p>
            <p className="mt-1.5 text-xl sm:text-3xl font-bold text-stone-900">{sellerListings.length}</p>
            <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">معروضة حالياً في السوق</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">إجمالي المبيعات</p>
            <p className="mt-1.5 text-xl sm:text-3xl font-bold text-stone-900">0.00 ج.م</p>
            <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">بعد خصم عمولة البائع 10%</p>
          </div>
        </div>

        {/* Pending Availability Confirmations */}
        {sellerOrders.filter((o) => o.status === "PendingSellerConfirmation").length > 0 && (
          <div className="mt-8 rounded-2xl sm:rounded-3xl border border-amber-300 bg-amber-50/50 p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-amber-900 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
              طلبات مبيعات بانتظار تأكيد التوفر ({sellerOrders.filter((o) => o.status === "PendingSellerConfirmation").length})
            </h2>
            <p className="text-xs text-amber-800 mt-1">
              يرجى مراجعة المخزون وتأكيد توفر القطعة أو إبلاغ المشتري بالاعتذار.
            </p>

            <div className="mt-4 space-y-3">
              {sellerOrders
                .filter((o) => o.status === "PendingSellerConfirmation")
                .map((order) => (
                  <div key={order.id} className="rounded-xl border border-amber-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="text-sm font-bold text-stone-900">{order.orderNumber} - {order.productTitle}</div>
                      <div className="text-xs text-stone-600 mt-0.5">المبلغ: {order.totalAmount} ج.م | العنوان: {order.shippingAddress}</div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleSellerConfirmation(order.id, order.orderNumber, true)}
                        className="flex-1 sm:flex-initial rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        تأكيد توفر القطعة وتجهيزها
                      </button>
                      <button
                        onClick={() => handleSellerConfirmation(order.id, order.orderNumber, false)}
                        className="flex-1 sm:flex-initial rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                      >
                        القطعة غير متاحة حالياً
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

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

          {loading ? (
            <div className="p-8 text-center text-sm font-bold text-stone-500">
              جاري تحميل معروضاتك...
            </div>
          ) : sellerListings.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold text-stone-500">
              لا توجد معروضات متاحة حالياً. أضف إعلاناً جديداً لبدء البيع!
            </div>
          ) : (
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
                        {item.imageUrl ? (
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.title}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                            className="h-10 w-10 rounded-lg object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 text-xs font-bold shrink-0">
                            📷
                          </div>
                        )}
                        <span className="truncate max-w-[160px] sm:max-w-[220px]">{item.title}</span>
                      </td>
                      <td className="px-4 py-3.5 text-stone-600 font-medium">{item.categoryName || "عام"}</td>
                      <td className="px-4 py-3.5 font-medium">{item.condition || "ممتاز"}</td>
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
          )}
        </div>
      </div>
    </div>
  );
}
