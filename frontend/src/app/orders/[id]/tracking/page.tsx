"use client";

import Link from "next/link";
import { mockOrders, mockTrackingLogs } from "@/lib/mock-data";

export default function DeliveryTrackingPage() {
  const order = mockOrders[0];

  const steps = [
    { title: "تم تأكيد الطلب", desc: "تم حجز المنتجات وتأكيد التوصيل", completed: true },
    { title: "تعيين مندوب التوصيل", desc: "تم إسناد الشحنة للمندوب طارق المنصور", completed: true },
    { title: "استلام الشحنة من البائع", desc: "قام المندوب باستلام الشحنة من ميرا ر.", completed: true },
    { title: "الشحنة قيد التوصيل الآن", desc: "المندوب في طريقه إلى عنوان العميل", completed: true, active: true },
    { title: "تم التسليم واستلام النقد (COD)", desc: "تحصيل المبلغ وإغلاق الطلب بنجاح", completed: false },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {/* Top Banner */}
      <div className="bg-stone-900 text-white py-8 sm:py-10 rounded-3xl mb-6 sm:mb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link href="/orders" className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:underline">
            &rarr; العودة إلى الطلبات
          </Link>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">تتبع الشحنة #{order.orderNumber}</h1>
              <p className="mt-1 text-xs sm:text-sm text-stone-400 font-medium">
                المنتج: <span className="text-white font-bold">{order.productTitle}</span> &bull; {order.totalAmount} ج.م
              </p>
            </div>
            <span className="w-fit rounded-full bg-amber-400/20 px-3.5 py-1.5 text-xs font-bold text-amber-300 border border-amber-400/30 animate-pulse">
              ● التوصيل المباشر قيد التقدم
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Step-by-Step Courier Timeline */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual Progress Steps */}
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-6">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">مراحل توصيل الشحنة</h2>

            <div className="relative pr-6 space-y-6 sm:space-y-8 before:absolute before:right-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {steps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-3 sm:gap-4">
                  <div
                    className={`absolute -right-[23px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white ${
                      step.active
                        ? "bg-amber-500 text-white shadow-md animate-bounce"
                        : step.completed
                        ? "bg-stone-900 text-white"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    {step.completed ? "✓" : idx + 1}
                  </div>
                  <div>
                    <h3 className={`text-xs sm:text-sm font-bold ${step.active ? "text-amber-900" : step.completed ? "text-stone-900" : "text-stone-400"}`}>
                      {step.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 font-medium">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Tracking Logs */}
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">سجل تحركات المندوب</h2>
            <div className="divide-y divide-stone-100">
              {mockTrackingLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs gap-2">
                  <div>
                    <span className="font-bold text-stone-900">{log.status}</span>
                    <p className="text-stone-500 mt-0.5 font-medium">{log.note}</p>
                  </div>
                  <span className="font-bold text-stone-400 shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Courier Info Card & Simulated Map */}
        <div className="lg:col-span-5 space-y-6">
          {/* Courier Card */}
          <div className="rounded-2xl sm:rounded-3xl border border-amber-200 bg-amber-50/50 p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800">بيانات مندوب التوصيل المكلف</h2>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-amber-500 font-bold text-stone-950 text-lg sm:text-xl shadow-md shrink-0">
                ط م
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900">{order.courierName}</h3>
                <p className="text-xs text-stone-600 font-medium">المركبة: دراجة نارية هوندا (دبي 884)</p>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">★ 4.98 تقييم ممتاز (412 توصيلة)</p>
              </div>
            </div>

            <a
              href={`tel:${order.courierPhone}`}
              className="block w-full rounded-2xl bg-stone-900 py-3.5 text-center text-xs sm:text-sm font-bold text-white transition hover:bg-stone-800 shadow-md"
            >
              📞 الاتصال بالمندوب ({order.courierPhone})
            </a>
          </div>

          {/* Simulated Map Container */}
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-stone-900 p-4 sm:p-6 shadow-sm text-white space-y-4 relative overflow-hidden min-h-[220px] flex flex-col justify-between">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">مراقب الخريطة المباشر</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                على بعد 2.4 كم
              </span>
            </div>

            <div className="relative z-10 text-center py-4 sm:py-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-lg font-bold ring-8 ring-amber-500/10 animate-pulse">
                🛵
              </div>
              <p className="mt-2.5 text-xs sm:text-sm font-bold text-stone-300">المندوب يقترب من منطقة الصفا 2</p>
              <p className="text-[10px] text-stone-500 mt-0.5 font-medium">الوقت المقدر للوصول: 12-18 دقيقة</p>
            </div>

            <div className="relative z-10 text-[10px] text-stone-400 border-t border-stone-800 pt-2 flex justify-between font-mono">
              <span>عرض: 25.1972° N</span>
              <span>طول: 55.2744° E</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
