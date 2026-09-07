"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { products } from "@/lib/mock-data";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemSlug = searchParams.get("slug") || "atelier-trench-coat";

  const product = products.find((p) => p.slug === itemSlug) || products[0];

  const itemPrice = product.price;
  const fixedDeliveryFee = 30.0;
  const buyerFee = itemPrice * 0.1;
  const totalAmount = itemPrice + fixedDeliveryFee + buyerFee;

  const [address, setAddress] = useState({
    fullName: "عمر المنصور",
    phone: "+20 100 987 6543",
    district: "التجمع الخامس",
    street: "فيلا 14، شارع التسعين",
    notes: "يرجى الاتصال قبل الوصول للتسليم.",
  });

  const [isPlacing, setIsPlacing] = useState(false);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlacing(true);
    setTimeout(() => {
      setIsPlacing(false);
      router.push("/orders?success=true");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      <div className="bg-stone-900 text-white py-8 sm:py-10 rounded-3xl mb-6 sm:mb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link href={`/product/${product.slug}`} className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:underline">
            &rarr; العودة للمنتج
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">إتمام طلب الشراء</h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-400 font-medium">
            الدفع نقداً عند الاستلام (COD) بعد المعاينة المباشرة مع المندوب.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6">
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Shipping Address & Payment Selection */}
          <div className="lg:col-span-7 space-y-6">
            {/* Delivery Address Box */}
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 border-b border-stone-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>عنوان التوصيل</span>
                <span className="w-fit text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  منطقة مغطاة بالتوصيل السريع (30 ج.م)
                </span>
              </h2>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">رقم الهاتف للتواصل *</label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">الحي / المنطقة *</label>
                  <input
                    type="text"
                    required
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">العنوان التفصيلي *</label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">ملاحظات للمندوب</label>
                <textarea
                  rows={2}
                  value={address.notes}
                  onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-stone-900"
                />
              </div>
            </div>

            {/* Payment Method Option */}
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">طريقة الدفع المصرح بها</h2>
              <div className="rounded-2xl border-2 border-stone-900 bg-stone-50 p-4 flex items-start gap-3">
                <input type="radio" checked readOnly className="mt-1 h-4 w-4 accent-stone-900" />
                <div>
                  <div className="font-bold text-sm text-stone-900">الدفع نقداً عند الاستلام (COD)</div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    تدفع القيمة الكلية للمندوب مباشرة بعد معاينة وتأكيد سلامة الشحنة.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Financial Breakdown Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sticky top-24">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">ملخص الحساب والشحنة</h2>

              {/* Product Info */}
              <div className="flex gap-3.5 items-center pb-4 border-b border-stone-100">
                <img src={product.imageUrl} alt={product.title} className="h-16 w-16 rounded-xl object-cover border border-stone-200" />
                <div>
                  <div className="text-xs font-bold text-amber-700">{product.category}</div>
                  <div className="font-bold text-sm text-stone-900 line-clamp-1">{product.title}</div>
                  <div className="text-xs font-semibold text-stone-500">حالة القطعة: {product.condition}</div>
                </div>
              </div>

              {/* Server-Authoritative Fee Breakdown */}
              <div className="space-y-2.5 text-xs sm:text-sm font-medium text-stone-600">
                <div className="flex justify-between">
                  <span>سعر السلعة الأصلي</span>
                  <span className="font-bold text-stone-900">{itemPrice.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>رسوم التوصيل الثابتة (داخل القاهرة والجيزة)</span>
                  <span className="font-bold text-stone-900">{fixedDeliveryFee.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>رسوم حماية المشتري والأمان (10%)</span>
                  <span className="font-bold text-stone-900">{buyerFee.toFixed(2)} ج.م</span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between text-base font-bold text-stone-900">
                  <span>الإجمالي عند التسليم</span>
                  <span className="text-xl text-stone-950 font-bold">{totalAmount.toFixed(2)} ج.م</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPlacing}
                className="w-full rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 shadow-md"
              >
                {isPlacing ? "جاري تأكيد الشحنة..." : "تأكيد الطلب الآن"}
              </button>

              <p className="text-[11px] text-center text-stone-500 font-medium">
                بضغطك على تأكيد الطلب، أنت توافق على شروط حماية المعاملات وسياسة الإرجاع.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500 font-medium">جاري تحضير صفحة الدفع...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
