"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/mock-data";

export default function CreateListingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    category: "ملابس نسائية",
    condition: "ممتاز",
    price: "",
    location: "القاهرة — التجمع الخامس",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const parsedPrice = parseFloat(formData.price) || 0;
  const sellerCommission = parsedPrice * 0.1;
  const estimatedPayout = Math.max(0, parsedPrice - sellerCommission);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/seller");
      }, 1500);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      <div className="bg-stone-900 text-white py-8 sm:py-10 rounded-3xl mb-6 sm:mb-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/seller" className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:underline">
            &rarr; العودة لاستوديو البائع
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">إضافة منتج جديد للبيع</h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-400 font-medium">
            اعرض منتجك أمام آلاف المشترين المهتمين بدون رسوم إدراج خفية.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-3 sm:px-6">
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white text-xl font-bold">
              ✓
            </div>
            <h2 className="mt-4 text-xl sm:text-2xl font-bold text-emerald-950">تم نشر الإعلان بنجاح!</h2>
            <p className="mt-2 text-xs sm:text-sm text-emerald-700 font-medium">
              منتجك &quot;{formData.title}&quot; أصلح متاحاً الآن في سوق الوكالة. جاري توجيهك إلى لوحة التحكم...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Item Details */}
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">تفاصيل المنتج</h2>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  عنوان المنتج *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: معطف صوف كلاسيكي ممتاز"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900 transition"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    الفئة *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900 bg-white transition"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    حالة القطعة *
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900 bg-white transition"
                  >
                    <option value="كالجديد">كالجديد (استعمال خفيف)</option>
                    <option value="ممتاز">ممتاز</option>
                    <option value="جيد جداً">جيد جداً</option>
                    <option value="جيد">جيد</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  وصف تفصيلي للقطعة
                </label>
                <textarea
                  rows={3}
                  placeholder="اذكر المقاس، الخامة، أسباب البيع، وأي عيوب إن وجدت..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-stone-900 transition"
                />
              </div>
            </div>

            {/* Pricing & Fee Transparency */}
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">التسعير وعمولة المنصة</h2>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  السعر المطلوب (ج.م) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-base font-bold outline-none focus:border-stone-900 transition"
                />
              </div>

              {parsedPrice > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between font-medium text-stone-700">
                    <span>السعر الإجمالي المعلن:</span>
                    <span className="font-bold text-stone-900">{parsedPrice.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between font-medium text-amber-900">
                    <span>عمولة منصة الوكالة (10%):</span>
                    <span className="font-bold">-{sellerCommission.toFixed(2)} ج.م</span>
                  </div>
                  <div className="border-t border-amber-200 pt-2 flex justify-between font-bold text-stone-950 text-sm sm:text-base">
                    <span>صافي أرباح البائع المقدرة:</span>
                    <span className="text-emerald-700">{estimatedPayout.toFixed(2)} ج.م</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 shadow-md"
            >
              {isSubmitting ? "جاري نشر الإعلان..." : "نشر الإعلان الآن"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
