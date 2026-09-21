"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface CourierData {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
}

interface OrderItemData {
  productId: string;
  productTitle?: string;
  unitPrice: number;
}

interface OrderTrackingData {
  id: string;
  orderNumber: string;
  itemPrice: number;
  deliveryFee: number;
  buyerFee: number;
  totalAmount: number;
  shippingAddress: string;
  status: string;
  paymentMethod: string;
  createdAtUtc: string;
  items: OrderItemData[];
  courier?: CourierData | null;
}

const getInitials = (name?: string) => {
  if (!name) return "م ت";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]} ${parts[1][0]}`;
  return parts[0] ? parts[0].slice(0, 2) : "م ت";
};

export default function DeliveryTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleConfirmDelivery = async () => {
    if (!confirm("هل أنت متاكد من تأكيد تسليم الشحنة واستلام القيمة المالية بنجاح؟")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Delivered" }),
      });
      if (res.ok) {
        showToast("تم تأكيد التسليم بنجاح وتحديث حسابات النظام!");
        setOrder((prev) => (prev ? { ...prev, status: "Delivered" } : prev));
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || err.detail || "تعذر تغيير حالة الشحنة إلى تم التسليم.");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsReturned = async () => {
    if (!confirm("تأكيد إرجاع الشحنة: سيتم خصم 20 ج.م رسوم إرجاع وشحن من كل من البائع والمشتري وإضافتها لرصيد المندوب. هل تريد المتابعة؟")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Returned" }),
      });
      if (res.ok) {
        showToast("تم إرجاع الشحنة وتطبيق رسوم الإرجاع (20 ج.م) وإشعار الإدارة بنجاح!");
        setOrder((prev) => (prev ? { ...prev, status: "Returned" } : prev));
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || err.detail || "تعذر إرجاع الشحنة.");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم.");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchOrderDetails() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { credentials: "include" });
        if (res.ok) {
          const data: OrderTrackingData = await res.json();
          if (isMounted) {
            setOrder(data);
            setLastRefreshed(new Date());
          }
        }
      } catch (err) {
        console.error("Failed to fetch order tracking data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrderDetails();

    // Real-time polling every 4 seconds for instant courier reassignment sync
    const interval = setInterval(fetchOrderDetails, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-stone-600 font-bold">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-amber-500 animate-ping" />
          جاري تحميل بيانات تتبع الشحنة...
        </div>
      </div>
    );
  }

  const currentStatus = order?.status || "PendingAdminReview";
  const hasCourier = !!order?.courier && !!order.courier.name;
  const courierName = order?.courier?.name || "في انتظار تعيين المندوب";
  const courierPhone = order?.courier?.phoneNumber || "";
  const courierInitials = getInitials(order?.courier?.name);

  // Status progression mapping
  const isCancelled = currentStatus === "Cancelled";
  const isDelivered = currentStatus === "Delivered";
  const isOutForDelivery = currentStatus === "OutForDelivery";
  const isAssigned = currentStatus === "AssignedToDelivery" || currentStatus === "Processing" || isOutForDelivery || isDelivered;

  const createdTimeFormatted = order?.createdAtUtc
    ? new Date(order.createdAtUtc).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    : "10:30 صباحاً";

  const steps = [
    {
      title: "تم تأكيد الطلب",
      desc: "تم حجز المنتجات وتأكيد التوصيل في النظام",
      timestamp: createdTimeFormatted,
      completed: true,
      active: currentStatus === "PendingAdminReview" || currentStatus === "PendingSellerConfirmation",
    },
    {
      title: "تم تعيين مندوب التوصيل",
      desc: hasCourier ? `تم إسناد الشحنة إلى الكابتن ${courierName}` : "جاري تعيين أفضل مندوب توصيل متاح قريب من منطقتك",
      timestamp: isAssigned ? "مُحدث مؤخراً" : "في الانتظار",
      completed: isAssigned,
      active: currentStatus === "PendingAdminReview" && !hasCourier,
    },
    {
      title: "تم استلام الشحنة من البائع",
      desc: "قام المندوب باستلام الشحنة وتغليفها وتدقيق المعاينة",
      timestamp: isOutForDelivery || isDelivered ? "مكتمل" : "في الانتظار",
      completed: isOutForDelivery || isDelivered,
      active: currentStatus === "Processing" || (isAssigned && !isOutForDelivery && !isDelivered),
    },
    {
      title: "الشحنة قيد التوصيل الآن",
      desc: "المندوب في طريقه المباشر نحو عنوان الاستلام الخاص بك",
      timestamp: isOutForDelivery ? "الآن" : isDelivered ? "تم الوصول" : "قريباً",
      completed: isDelivered,
      active: isOutForDelivery,
    },
    {
      title: "تم التسليم واستلام النقد (COD)",
      desc: "تمت المعاينة والاستلام ودفع المبلغ وتصفية المعاملة",
      timestamp: isDelivered ? "تم التسليم" : "الخطوة النهائية",
      completed: isDelivered,
      active: isDelivered,
    },
  ];

  const productTitle = order?.items?.[0]?.productTitle || "معطف اتيليه كلاسيكي";
  const totalAmount = order?.totalAmount || 192.8;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {/* Top Banner */}
      <div className="bg-stone-900 text-white py-8 sm:py-10 rounded-3xl mb-6 sm:mb-8 shadow-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link href="/orders" className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:underline inline-flex items-center gap-1">
            &rarr; العودة إلى قائمة الطلبات
          </Link>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  تتبع الشحنة #{order?.orderNumber || "AG-881204"}
                </h1>
                <span className="text-[11px] font-bold text-stone-400 bg-stone-800 px-2.5 py-1 rounded-full border border-stone-700">
                  مزامنة لحظية 🟢
                </span>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-400 font-medium">
                المنتج: <span className="text-white font-bold">{productTitle}</span> &bull; {totalAmount} ج.م &bull; عنوان الاستلام: <span className="text-stone-300 font-bold">{order?.shippingAddress || "شارع البحر، المحلة الكبرى"}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`w-fit rounded-full px-4 py-2 text-xs font-bold border shadow-sm ${isDelivered
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : isCancelled
                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                      : "bg-amber-400/20 text-amber-300 border-amber-400/30 animate-pulse"
                  }`}
              >
                ● {isDelivered ? "تم التسليم بنجاح" : isCancelled ? "الطلب ملغي" : "التوصيل المباشر قيد التقدم"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Stepper Timeline & Route Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Consolidated Visual Progress Steps with Integrated Timestamps */}
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-5 sm:p-7 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-stone-900">مراحل توصيل الشحنة</h2>
              <span className="text-[11px] font-bold text-stone-500">
                آخر تحديث: {lastRefreshed.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>

            {/* Stepper with explicit layout bounds to prevent clipping */}
            <div className="relative pr-8 space-y-8 before:absolute before:right-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
              {steps.map((step, idx) => (
                <div key={idx} className="relative flex items-start justify-between gap-4">
                  {/* Step Node Icon */}
                  <div
                    className={`absolute -right-[34px] top-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white shadow-sm shrink-0 transition-all ${step.active
                        ? "bg-amber-500 text-white shadow-amber-200 animate-bounce"
                        : step.completed
                          ? "bg-stone-900 text-white"
                          : "bg-stone-200 text-stone-500"
                      }`}
                  >
                    {step.completed ? "✓" : idx + 1}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm sm:text-base font-bold leading-tight ${step.active ? "text-amber-900 font-extrabold" : step.completed ? "text-stone-900" : "text-stone-400"
                          }`}
                      >
                        {step.title}
                      </h3>
                      <span className="text-[11px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md shrink-0">
                        {step.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Route Map Container */}
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                مراقبة الخريطة المباشرة والمسار
              </span>

            </div>

            {/* Styled Visual Interactive Map Display */}
            <div className="relative rounded-2xl bg-stone-900 p-6 text-white min-h-[260px] flex flex-col justify-between overflow-hidden shadow-inner border border-stone-800">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:18px_18px]" />

              {/* Dynamic Path Line */}
              <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-stone-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 w-3/4 animate-pulse" />
              </div>

              {/* Route Markers */}
              <div className="relative z-10 flex justify-between items-center my-auto">
                {/* Merchant Origin Marker */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-10 w-10 rounded-2xl bg-stone-800 border border-stone-600 flex items-center justify-center text-lg shadow-lg">
                    🏪
                  </div>
                  <span className="text-[11px] font-bold text-stone-300">موقع البائع</span>
                  <span className="text-[9px] text-stone-500">المحلة الكبرى</span>
                </div>

                {/* Courier Live Moving Marker */}
                <div className="flex flex-col items-center gap-1.5 animate-pulse">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-xl shadow-xl ring-8 ring-amber-500/20">
                    🛵
                  </div>
                  <span className="text-xs font-extrabold text-amber-300">{courierName}</span>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/30">
                    في الطريق الرئيسي
                  </span>
                </div>

                {/* Buyer Destination Marker */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center text-lg shadow-lg">
                    📍
                  </div>
                  <span className="text-[11px] font-bold text-stone-300">عنوانك</span>
                  <span className="text-[9px] text-stone-500 max-w-[100px] truncate text-center">{order?.shippingAddress || "الوجهة الأخيرة"}</span>
                </div>
              </div>

              {/* Coordinates Footer */}
              <div className="relative z-10 text-[10px] text-stone-400 border-t border-stone-800/80 pt-3 flex justify-between font-mono">
                <span>إحداثيات الشحنة: 30.9753° N, 31.1676° E</span>
                <span className="text-amber-400 font-bold">تحديث تلقائي</span>
              </div>
            </div>
          </div>
        </div>

        {/* Courier Info Card & Prominent Support Action */}
        <div className="lg:col-span-5 space-y-6">
          {toast && (
            <div className="rounded-2xl bg-stone-900 p-4 text-xs sm:text-sm font-bold text-white shadow-xl animate-in fade-in duration-200">
              {toast}
            </div>
          )}

          {/* Courier Processing Actions Card */}
          {currentStatus !== "Delivered" && currentStatus !== "Returned" && currentStatus !== "Cancelled" && (
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">إجراءات المندوب لتنفيذ الطلب</h2>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  تحديث فوري
                </span>
              </div>

              <p className="text-xs text-stone-600 font-medium leading-relaxed">
                يرجى تحديد النتيجة المباشرة لتأكيد التسليم واستلام المبلغ أو تسجيل رفض الشحنة وإرجاعها:
              </p>

              <div className="grid grid-cols-1 gap-3 pt-1">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmDelivery}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-emerald-700 shadow-md disabled:opacity-50"
                >
                  {actionLoading ? "جاري المعالجة..." : "✅ تم التسليم (تأكيد الاستلام ونقد COD)"}
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleMarkAsReturned}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-red-700 shadow-md disabled:opacity-50"
                >
                  {actionLoading ? "جاري المعالجة..." : "🔄 تم الإرجاع / مرتجع (تطبيق رسوم 20 ج.م)"}
                </button>
              </div>
            </div>
          )}

          {/* Buyer Rating & Review Prompt Card upon Delivery */}
          {currentStatus === "Delivered" && (
            <div className="rounded-2xl sm:rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                  <span>⭐</span> تقييم خدمة التوصيل والمنتج
                </h2>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-full">
                  تم التسليم بنجاح
                </span>
              </div>

              <p className="text-xs text-stone-700 font-medium leading-relaxed">
                نهنئك باستلام شحنتك! يرجى تقييم تجربة التوصيل مع الكابتن {courierName} والمنتج لمساعدة مجتمع منصة الوكالة:
              </p>

              <div className="bg-white rounded-2xl p-4 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">تقييم المندوب والسرعة:</span>
                  <div className="flex gap-1 text-amber-400 text-lg cursor-pointer">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i} className="hover:scale-125 transition-transform">
                        {star}
                      </span>
                    ))}
                  </div>
                </div>

                <textarea
                  placeholder="أكتب ملاحظاتك أو انطباعك عن المعاينة والتسليم (اختياري)..."
                  rows={2}
                  className="w-full rounded-xl border border-stone-200 p-3 text-xs focus:border-emerald-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => showToast("⭐ شكراً لك! تم حفظ تقييمك بنجاح وتعزيز نقاط ثقة المندوب في المنصة.")}
                  className="w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-sm"
                >
                  إرسال التقييم والمراجعة
                </button>
              </div>
            </div>
          )}

          {/* Support Action Button */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
            <div className="text-xs sm:text-sm font-bold text-stone-800 leading-relaxed text-center">
              هل لديك أي استفسار أو ترغب في التعديل على طلبك؟
            </div>
            <a
              href="https://wa.me/201035846884?text=%D0%A3%D1%81%D0%BB%D0%B0%D0%BC%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D8%A8%D8%AE%D8%B5%D9%88%D8%B5%20%D8%A7%D9%84%D8%B7%D9%84%D8%A8%20"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-4 text-xs sm:text-sm font-bold text-white transition hover:bg-emerald-700 shadow-md"
            >
              💬 التواصل المباشر مع فريق الدعم الفني
            </a>
          </div>

          {/* Dynamic Courier Card */}
          <div className="rounded-2xl sm:rounded-3xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">بيانات مندوب التوصيل المكلف</h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {hasCourier ? "نشط ومكلف" : "جاري البحث"}
              </span>
            </div>

            {hasCourier ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 font-extrabold text-stone-950 text-xl shadow-md shrink-0">
                    {courierInitials}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">{courierName}</h3>
                    <p className="text-xs text-stone-600 font-medium mt-0.5">مندوب توصيل موثق لدى منصة الوكالة</p>
                    <p className="text-xs font-bold text-emerald-700 mt-1">★ 4.98 تقييم ممتاز (412 توصيلة ناجحة)</p>
                  </div>
                </div>

                {courierPhone ? (
                  <a
                    href={`tel:${courierPhone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-stone-800 shadow-md"
                  >
                    📞 الاتصال بالمندوب ({courierPhone})
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-2xl bg-stone-300 py-3 text-xs font-bold text-stone-600 cursor-not-allowed"
                  >
                    رقم الهاتف غير متوفر حالياً
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 text-2xl font-bold">
                  ⌛
                </div>
                <h3 className="text-sm font-bold text-stone-800">في انتظار تعيين مندوب التوصيل</h3>
                <p className="text-xs text-stone-600 font-medium">
                  يقوم فريق إدارة المنصة بتعيين أقرب مندوب متاح في منطقتك. سيتم تحديث الصفحة تلقائياً فور التعيين.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
