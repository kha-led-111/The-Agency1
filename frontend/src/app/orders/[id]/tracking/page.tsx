"use client";

import Link from "next/link";
import { mockOrders, mockTrackingLogs } from "@/lib/mock-data";

export default function DeliveryTrackingPage() {
  const order = mockOrders[0]; // Active out-for-delivery order

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
      <div className="bg-stone-900 text-white py-10 rounded-3xl mb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link href="/orders" className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:underline">
            &rarr; العودة إلى الطلبات
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">تتبع الشحنة المباشر #{order.orderNumber}</h1>
              <p className="mt-1 text-sm text-stone-400 font-medium">
                المنتج: <span className="text-white font-bold">{order.productTitle}</span> &bull; طريقة السداد: {order.paymentMethod} ({order.totalAmount} ج.م)
              </p>
            </div>
            <span className="rounded-full bg-amber-400/20 px-4 py-1.5 text-xs font-bold text-amber-300 border border-amber-400/30 animate-pulse">
              ● التوصيل المباشر قيد التقدم
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Step-by-Step Courier Timeline (Right 7 Cols in RTL) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual Progress Steps */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">مراحل توصيل الشحنة</h2>
            
            <div className="relative pr-6 space-y-8 before:absolute before:right-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {steps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
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
                    <h3 className={`text-sm font-bold ${step.active ? "text-amber-900" : step.completed ? "text-stone-900" : "text-stone-400"}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5 font-medium">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Tracking Logs */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">سجل تحركات المندوب التفصيلي</h2>
            <div className="divide-y divide-stone-100">
              {mockTrackingLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{log.status}</span>
                    <p className="text-stone-500 mt-0.5 font-medium">{log.note}</p>
                  </div>
                  <span className="font-bold text-stone-400">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Courier Info Card & Simulated Map (Left 5 Cols in RTL) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Courier Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800">بيانات مندوب التوصيل المكلف</h2>
            
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 font-bold text-stone-950 text-xl shadow-md flex-shrink-0">
                ط م
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">{order.courierName}</h3>
                <p className="text-xs text-stone-600 font-medium">المركبة: دراجة نارية هوندا (دبي 884)</p>
                <p className="text-xs font-bold text-emerald-700 mt-1">★ 4.98 تقييم ممتاز (412 توصيلة)</p>
              </div>
            </div>

            <a
              href={`tel:${order.courierPhone}`}
              className="block w-full rounded-xl bg-stone-900 py-3 text-center text-xs font-bold text-white transition hover:bg-stone-800 shadow-md"
            >
              📞 الاتصال بالمندوب ({order.courierPhone})
            </a>
          </div>

          {/* Simulated Map Container */}
          <div className="rounded-2xl border border-stone-200 bg-stone-900 p-6 shadow-sm text-white space-y-4 relative overflow-hidden min-h-[220px] flex flex-col justify-between">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">مراقب الخريطة المباشر</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                على بعد 2.4 كم
              </span>
            </div>

            <div className="relative z-10 text-center py-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xl font-bold ring-8 ring-amber-500/10 animate-pulse">
                🛵
              </div>
              <p className="mt-3 text-xs font-bold text-stone-300">المندوب يقترب من منطقة الصفا 2</p>
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
