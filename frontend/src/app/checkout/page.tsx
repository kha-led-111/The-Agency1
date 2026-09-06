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
  const fixedDeliveryFee = 30.00;
  const buyerFee = itemPrice * 0.10;
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
      <div className="bg-stone-900 text-white py-10 rounded-3xl mb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link href={`/product/${product.slug}`} className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:underline">
            &rarr; العودة للمنتج
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">إتمام طلب الشراء</h1>
          <p className="mt-1 text-sm text-stone-400 font-medium">
            الدفع نقداً عند الاستلام (COD) بعد المعاينة المباشرة مع المندوب.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Shipping Address & Payment Selection */}
          <div className="lg:col-span-7 space-y-6">
            {/* Delivery Address Box */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-3 flex items-center justify-between">
                <span>عنوان التوصيل</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  منطقة مغطاة بالتوصيل السريع (30 ج.م)
                </span>
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">رقم الهاتف للتواصل *</label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">الحي / المنطقة *</label>
                  <input
                    type="text"
                    required
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">اسم المبنى والشارع *</label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">ملاحظات التوصيل</label>
                <input
                  type="text"
                  value={address.notes}
                  onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">طريقة الدفع</h2>
              
              <div className="rounded-xl border-2 border-stone-900 bg-stone-50 p-4 flex items-center gap-4">
                <div className="h-5 w-5 rounded-full bg-stone-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-stone-900">الدفع نقداً عند الاستلام (COD)</p>
                  <p className="text-xs text-stone-500 font-medium">ادفع المبلغ نقداً للمندوب فور الاستلام والمعاينة.</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
                  دفع أوفلاين
                </span>
              </div>
            </div>

            {/* Return Policy Notice Note */}
            <div className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-4 text-xs text-amber-900 font-medium space-y-1">
              <div className="font-bold text-sm flex items-center gap-2 text-amber-950">
                <span>💡</span>
                <span>تنبيه وسياسة الإرجاع</span>
              </div>
              <p className="leading-5">
                في حالة إرجاع الطلب بعد المعاينة، يتحمل كل من البائع والمشتري رسوم إرجاع بقيمة <strong>20 ج.م</strong> لكل منهما.
              </p>
            </div>
          </div>

          {/* Order Summary & Pricing Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">ملخص الحساب والرسوم</h2>

              {/* Product Card */}
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${product.accent} flex items-center justify-center font-bold text-stone-800 text-lg shadow-inner flex-shrink-0`}>
                  {product.title.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-stone-900 truncate">{product.title}</h3>
                  <p className="text-xs text-stone-500">البائع: {product.seller}</p>
                  <p className="text-xs font-bold text-stone-700 mt-1">الحالة: {product.condition}</p>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3 text-sm border-t border-stone-200 pt-4">
                <div className="flex justify-between text-stone-600">
                  <span>سعر المنتج الأصل</span>
                  <span className="font-bold text-stone-900">{itemPrice} ج.م</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>رسوم التوصيل الثابتة</span>
                  <span className="font-bold text-stone-900">{fixedDeliveryFee} ج.م</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>رسوم خدمة المشتري (10%)</span>
                  <span className="font-bold text-stone-900">{buyerFee.toFixed(1)} ج.م</span>
                </div>

                <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline">
                  <span className="text-base font-bold text-stone-900">المبلغ الإجمالي المطلق للمندوب</span>
                  <span className="text-2xl font-bold text-emerald-700">{totalAmount.toFixed(1)} ج.م</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isPlacing}
                className="w-full rounded-xl bg-stone-900 py-4 text-center text-sm font-bold text-white transition hover:bg-stone-800 shadow-md disabled:opacity-50"
              >
                {isPlacing ? "جاري تأكيد الطلب..." : "تأكيد الطلب والدفع عند الاستلام"}
              </button>

              <p className="text-center text-[11px] text-stone-400 font-medium">
                بتأكيد هذا الطلب، فأنت توافق على معاينة القطعة مع المندوب ودفع المبلغ المحدد بالكامل نقداً.
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
    <Suspense fallback={<div className="min-h-screen bg-stone-50 p-12 text-center text-sm text-stone-500">جاري تحميل صفحة الشراء...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
