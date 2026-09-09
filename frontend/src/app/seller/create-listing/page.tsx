"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/mock-data";
import { ALLOWED_CITIES } from "@/lib/cities";

export default function CreateListingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    category: "ملابس نسائية",
    condition: "ممتاز",
    price: "",
    city: ALLOWED_CITIES[0].nameAr,
    streetAddress: "",
    description: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const parsedPrice = parseFloat(formData.price) || 0;
  const sellerCommission = parsedPrice * 0.1;
  const estimatedPayout = Math.max(0, parsedPrice - sellerCommission);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    const maxFiles = 5;

    if (images.length + files.length > maxFiles) {
      setImageError(`الحد الأقصى للصور هو ${maxFiles} صور فقط.`);
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setImageError("يرجى اختيار ملفات صور صالحة فقط (JPG, PNG, WebP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError("حجم الصورة يجب ألا يتجاوز 5 ميجابايت.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setImageError("يرجى إرفاق صورة واحدة على الأقل للمنتج لضمان قبول الإعلان.");
      return;
    }
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
            {/* Product Photos Upload Section */}
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
              <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">صور المنتج *</h2>
                  <p className="text-xs text-stone-500 font-medium">
                    أضف حتى 5 صور واضحة توضح حالة القطعة والتفاصيل الأساسية
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  مطلوب صورة واحدة على الأقل
                </span>
              </div>

              {/* Upload Drop Zone & Input */}
              <div className="relative border-2 border-dashed border-stone-300 hover:border-stone-900 rounded-2xl p-6 text-center transition bg-stone-50/50">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-700 text-xl font-bold">
                    📷
                  </div>
                  <div className="text-sm font-bold text-stone-900">
                    اضغط هنا لاختيار صور المنتج أو اسحب الصور وانسقها هنا
                  </div>
                  <div className="text-xs text-stone-500 font-medium">
                    الصيغ المدعومة: JPG, PNG, WebP (بحد أقصى 5 ميجابايت لكل صورة)
                  </div>
                </div>
              </div>

              {imageError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  ⚠️ {imageError}
                </div>
              )}

              {/* Image Previews Grid */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-700">الصور المرفوعة ({images.length}/5):</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {images.map((imgUrl, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-square bg-stone-100">
                        <img src={imgUrl} alt={`معاينة الصورة ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shadow hover:bg-rose-700 transition"
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 right-1 left-1 bg-stone-900/80 text-white text-[10px] font-bold text-center py-0.5 rounded">
                            الصورة الرئيسية
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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

              {/* Location & City Dropdown Selection */}
              <div className="space-y-3 border-t border-stone-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    موقع الاستلام والمدينة *
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    نطاق خدمة التسليم المباشر
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">المدينة المعتمدة *</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-bold outline-none focus:border-stone-900 bg-white transition"
                    >
                      {ALLOWED_CITIES.map((city) => (
                        <option key={city.id} value={city.nameAr}>
                          {city.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">العنوان التفصيلي للاستلام *</label>
                    <input
                      type="text"
                      required
                      placeholder="اسم الشارع، الحي، رقم العمارة أو المَعلم الشهير"
                      value={formData.streetAddress}
                      onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900 transition"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  ℹ️ خدمات الاستلام والتوصيل مقتصرة حالياً على المدن التالية فقط:{" "}
                  <strong className="text-stone-900">المحلة الكبرى، طنطا، شبين الكوم، المنصورة</strong>.
                </p>
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

