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
    location: "دبي مارينا",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const parsedPrice = parseFloat(formData.price) || 0;
  const sellerCommission = parsedPrice * 0.10;
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
      <div className="bg-stone-900 text-white py-10 rounded-3xl mb-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/seller" className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:underline">
            &rarr; العودة لاستوديو البائع
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">إضافة منتج جديد للبيع</h1>
          <p className="mt-1 text-sm text-stone-400 font-medium">
            اعرض منتجك أمام آلاف المشترين المهتمين بدون رسوم إدراج خفية.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white text-2xl font-bold">
              ✓
            </div>
            <h2 className="mt-4 text-2xl font-bold text-emerald-950">تم نشر الإعلان بنجاح!</h2>
            <p className="mt-2 text-sm text-emerald-700 font-medium">
              منتجك &quot;{formData.title}&quot; أصلح متاحاً الآن في سوق الوكالة. جاري توجيهك إلى لوحة التحكم...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Item Details */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">تفاصيل المنتج</h2>
              
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
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    الفئة *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 bg-white transition"
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
                    className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 bg-white transition"
                  >
                    <option value="جديد بالبطاقة">جديد بالبطاقة</option>
                    <option value="كالجديد">كالجديد</option>
                    <option value="ممتاز">ممتاز</option>
                    <option value="جيد جداً">جيد جداً</option>
                    <option value="جيد">جيد</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  وصف المنتج والخصائص *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="اشرح المقاس، نوع القماش، العيوب إن وجدت، وطريقة العناية بالقطعة..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition"
                />
              </div>
            </div>

            {/* Pricing & Fee Transparency */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">التسعير وصافي الأرباح</h2>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  سعر العرض (بالجنية المصري ج.م) *
                </label>
                <div className="relative mt-2">
                  <span className="absolute right-4 top-3 text-sm font-bold text-stone-400">ج.م</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="150"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 pr-12 pl-4 py-3 text-lg font-bold outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition"
                  />
                </div>
              </div>

              {/* Real-time Earnings Breakdown */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>سعر المعروض المقترح</span>
                  <span className="font-bold">{parsedPrice} ج.م</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>عمولة المنصة للبائع (10%)</span>
                  <span className="text-amber-700 font-bold">-{sellerCommission.toFixed(1)} ج.م</span>
                </div>
                <div className="border-t border-amber-200 pt-2 flex justify-between font-bold text-stone-900 text-base">
                  <span>صافي أرباحك المقدرة (تحويل بنكي / COD)</span>
                  <span className="text-emerald-700">{estimatedPayout.toFixed(1)} ج.م</span>
                </div>
              </div>
            </div>

            {/* Photos Upload Mock */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">صور المنتج</h2>
              <div className="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center hover:border-stone-400 transition cursor-pointer bg-stone-50">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-stone-600 font-bold">
                  📷
                </div>
                <p className="mt-3 text-sm font-bold text-stone-800">اسحب الصور وأفلتها هنا أو اضغط للتصفح</p>
                <p className="text-xs text-stone-500 mt-1">صيغ PNG, JPG بحجم أقصى 10 ميجابايت (الصورة الأولى ستكون الغلاف الرئيسية)</p>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link href="/seller" className="rounded-xl border border-stone-300 px-6 py-3 text-sm font-bold text-stone-700 hover:bg-stone-100 transition">
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-stone-900 px-8 py-3 text-sm font-bold text-white transition hover:bg-stone-800 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? "جاري نشر الإعلان..." : "نشر الإعلان الآن"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
