"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  unitPrice: number;
}

export interface BuyerInfo {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
}

export interface CourierAssignedOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  itemPrice: number;
  deliveryFee: number;
  buyerFee: number;
  sellerCommission: number;
  courierEarnings: number;
  platformEarnings: number;
  totalAmount: number;
  returnFee: number;
  shippingAddress: string;
  status: string;
  paymentMethod: string;
  createdAtUtc: string;
  items: OrderItem[];
  buyer?: BuyerInfo | null;
}

function CourierMyOrdersContent() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isCourier, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<CourierAssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  const fetchAssignedOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/courier/orders/assigned", {
        credentials: "include",
      });
      if (res.ok) {
        const data: CourierAssignedOrder[] = await res.json();
        setOrders(data || []);
      } else {
        const fallbackRes = await fetch("/api/courier/my-orders", { credentials: "include" });
        if (fallbackRes.ok) {
          const fallbackData: CourierAssignedOrder[] = await fallbackRes.json();
          setOrders(fallbackData || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch courier assigned orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAssignedOrders();

      // Real-time polling every 4 seconds for instant updates
      const interval = setInterval(fetchAssignedOrders, 4000);
      return () => clearInterval(interval);
    }
  }, [authLoading, isAuthenticated, fetchAssignedOrders]);

  // Handle Confirm Delivery ("تم التوصيل")
  const handleConfirmDelivery = async (order: CourierAssignedOrder) => {
    if (!confirm(`هل أنت متاكد من تأكيد تسليم الطلب #${order.orderNumber} وتحصيل المبلغ COD (${order.totalAmount.toFixed(2)} ج.م)؟`)) {
      return;
    }

    setActionLoadingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Delivered" }),
      });

      if (res.ok) {
        showToast(`✅ تم تأكيد تسليم الطلب #${order.orderNumber} وتحصيل المبلغ بنجاح! تم تحديث محفظتك.`);
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: "Delivered" } : o))
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || err.detail || "تعذر تأكيد تسليم الطلب.");
      }
    } catch (err) {
      console.error("Delivery confirmation error", err);
      showToast("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Mark as Returned ("تم الإرجاع / مرتجع")
  const handleMarkAsReturned = async (order: CourierAssignedOrder) => {
    if (
      !confirm(
        `تأكيد إرجاع الشحنة للطلب #${order.orderNumber}: سيتم خصم 20 ج.م رسوم إرجاع وشحن من المشتري والبائع وإضافتها لحسابك، وإشعار الإدارة فوراً. هل تريد المتابعة؟`
      )
    ) {
      return;
    }

    setActionLoadingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Returned" }),
      });

      if (res.ok) {
        showToast(`🔄 تم تسجيل إرجاع الشحنة للطلب #${order.orderNumber} وإضافة أجر الإرجاع (20 ج.م) لرصيدك وتنبيه الإدارة!`);
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: "Returned" } : o))
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || err.detail || "تعذر تسجيل إرجاع الطلب.");
      }
    } catch (err) {
      console.error("Return order error", err);
      showToast("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Authorization Check Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-stone-600 font-bold">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-amber-500 animate-ping" />
          جاري التحقق من صلاحيات المندوب...
        </div>
      </div>
    );
  }

  const userRole = user?.role || "";
  const canAccess = isCourier || isAdmin || userRole.toLowerCase().includes("courier") || userRole.includes("مندوب");

  if (!isAuthenticated || !canAccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-4 shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 text-3xl font-bold">
            🔒
          </div>
          <h1 className="text-xl font-bold text-stone-900">غير مصرح بالوصول</h1>
          <p className="text-xs text-stone-600 leading-relaxed font-medium">
            صفحة المهام والشحنات المسندة مخصصة حصرياً لمناديب التوصيل المعتمدين لدى منصة الوكالة.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-2xl bg-stone-900 py-3 text-xs font-bold text-white transition hover:bg-stone-800 shadow-md"
          >
            تسجيل الدخول كـ مندوب توصيل
          </button>
        </div>
      </div>
    );
  }

  // Filter Active vs Completed/Returned
  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Returned" && o.status !== "Cancelled"
  );
  const historyOrders = orders.filter(
    (o) => o.status === "Delivered" || o.status === "Returned" || o.status === "Cancelled"
  );

  const currentList = activeTab === "active" ? activeOrders : historyOrders;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AssignedToDelivery":
        return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">مكلف بالتوصيل 🚚</span>;
      case "OutForDelivery":
        return <span className="rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold border border-amber-600 animate-pulse">قيد التوصيل الآن 🛵</span>;
      case "Processing":
        return <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800 border border-sky-300">جاري المعاينة والتغليف 📦</span>;
      case "Delivered":
        return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">تم التسليم واستلام COD ✅</span>;
      case "Returned":
        return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 border border-red-300">مرتجع (رسوم 20 ج.م) 🔄</span>;
      case "Cancelled":
        return <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-700">طلب ملغي ❌</span>;
      default:
        return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-6 sm:right-auto z-50 rounded-2xl bg-stone-900 px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200 border border-stone-700">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-stone-900 text-white py-8 sm:py-12 rounded-3xl mb-6 sm:mb-8 shadow-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-400/30">
                لوحة المندوب الميداني 🛵
              </span>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">الشحنات والطلبات المسندة إليك</h1>
              <p className="mt-1 text-xs sm:text-sm text-stone-400 font-medium">
                إدارة التوصيل المباشر، التواصل مع المشتري، وتأكيد الاستلام أو الإرجاع بنقرة واحدة.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-300 bg-stone-800 px-3.5 py-2 rounded-2xl border border-stone-700">
                إجمالي الطلبات: <span className="text-amber-400 font-extrabold">{orders.length}</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex gap-2 border-b border-stone-800 pb-px">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-5 py-2.5 text-xs sm:text-sm font-bold transition border-b-2 ${
                activeTab === "active"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              الطلبات النشطة للتوصيل ({activeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-5 py-2.5 text-xs sm:text-sm font-bold transition border-b-2 ${
                activeTab === "history"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              سجل الشحنات السابقة ({historyOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-5xl px-3 sm:px-6 space-y-4 sm:space-y-6">
        {loading ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center text-stone-500 font-bold">
            جاري تحميل الشحنات والطلبات...
          </div>
        ) : currentList.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center space-y-3 shadow-sm">
            <div className="text-4xl">📦</div>
            <h3 className="text-base font-bold text-stone-800">
              {activeTab === "active" ? "لا توجد شحنات نشطة حالياً" : "لا يوجد سجل شحنات سابقة"}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto font-medium">
              {activeTab === "active"
                ? "عند إسناد طلبات جديدة إليك من قِبل إدارة منصة الوكالة ستظهر هنا فوراً للتوصيل."
                : "جميع الشحنات المكتملة أو المرتجعة ستظهر في هذه القائمة لتتبع الأرشيف."}
            </p>
          </div>
        ) : (
          currentList.map((order) => {
            const buyerName = order.buyer?.name || "المشتري";
            const buyerPhone = order.buyer?.phoneNumber || "";
            const firstItem = order.items?.[0];
            const productTitle = firstItem?.productTitle || "منتج الوكالة";
            const isLoadingThisOrder = actionLoadingId === order.id;

            return (
              <div
                key={order.id}
                className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-5 sm:p-7 shadow-sm space-y-5 hover:border-stone-300 transition"
              >
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base font-extrabold text-stone-900">{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      تاريخ الطلب:{" "}
                      {new Date(order.createdAtUtc).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase">
                        المبلغ المطلوب عند التسليم (COD)
                      </div>
                      <div className="text-lg sm:text-xl font-black text-emerald-700">
                        {order.totalAmount.toFixed(2)} ج.م
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buyer Information Section */}
                <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                      👤 بيانات المشتري
                    </div>
                    <div className="text-sm font-bold text-stone-900">{buyerName}</div>
                    {buyerPhone ? (
                      <div className="text-xs text-stone-700 font-medium dir-ltr text-right">
                        {buyerPhone}
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400 font-medium">رقم الهاتف غير مسجل</div>
                    )}
                  </div>

                  <div className="space-y-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                        📍 عنوان التسليم
                      </div>
                      <div className="text-xs font-bold text-stone-800 leading-relaxed">
                        {order.shippingAddress}
                      </div>
                    </div>

                    {buyerPhone && (
                      <div className="pt-2">
                        <a
                          href={`tel:${buyerPhone}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-stone-800 transition shadow-sm"
                        >
                          📞 الاتصال بالمشتري مباشرة
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Item Details */}
                <div className="flex gap-3 items-center rounded-xl bg-stone-50 p-3.5 border border-stone-100">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center shrink-0">
                    🛍️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-stone-900 truncate">{productTitle}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      طريقة الدفع:{" "}
                      <span className="font-bold text-stone-800">
                        {order.paymentMethod === "CashOnDelivery" ? "الدفع عند الاستلام (COD)" : order.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-stone-900">{order.itemPrice.toFixed(2)} ج.م</div>
                </div>

                {/* Direct Tracking Link */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <Link
                    href={`/orders/${order.id}/tracking`}
                    className="text-amber-800 hover:text-amber-950 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    عرض صفحة التتبع المباشر للشحنة &larr;
                  </Link>
                </div>

                {/* Quick One-Click Action Buttons for Active Orders */}
                {order.status !== "Delivered" && order.status !== "Returned" && order.status !== "Cancelled" && (
                  <div className="border-t border-stone-200 pt-4 space-y-3">
                    <div className="text-xs font-bold text-stone-800">
                      ⚡ إجراءات المندوب الفورية للتنفيذ:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isLoadingThisOrder}
                        onClick={() => handleConfirmDelivery(order)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-emerald-700 shadow-md disabled:opacity-50"
                      >
                        {isLoadingThisOrder ? (
                          "جاري التحديث..."
                        ) : (
                          <>
                            <span>✅ تأكيد التوصيل</span>
                            <span className="text-[11px] font-normal opacity-90">(تأكيد استلام نقد COD)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isLoadingThisOrder}
                        onClick={() => handleMarkAsReturned(order)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-red-700 shadow-md disabled:opacity-50"
                      >
                        {isLoadingThisOrder ? (
                          "جاري التحديث..."
                        ) : (
                          <>
                            <span>🔄 تم الإرجاع / مرتجع</span>
                            <span className="text-[11px] font-normal opacity-90">(رسوم إرجاع 20 ج.م)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function CourierMyOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-stone-600 font-bold">
          جاري تحميل لوحة المندوب...
        </div>
      }
    >
      <CourierMyOrdersContent />
    </Suspense>
  );
}
