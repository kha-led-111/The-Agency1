"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EGYPTIAN_GOVERNORATES, getCitiesForGovernorate } from "@/lib/cities";
import { useAuth } from "@/lib/auth";
import { getImageUrl } from "@/lib/api";

interface ProductDto {
  id: string;
  sellerId?: string;
  title: string;
  slug: string;
  price: number;
  condition: string;
  categoryName?: string;
  imageUrl?: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemSlug = searchParams.get("slug") || "atelier-trench-coat";

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/marketplace/${encodeURIComponent(itemSlug)}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        }
      } catch (err) {
        console.error("Failed to fetch product for checkout", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [itemSlug]);

  const itemPrice = product?.price || 148;
  const fixedDeliveryFee = 30.0;
  const buyerFee = itemPrice * 0.1;
  const totalAmount = itemPrice + fixedDeliveryFee + buyerFee;

  const isEgyptianPhoneValid = (p: string) => {
    const digitsOnly = (p || "").replace(/\D/g, "");
    return /^01[0125]\d{8}$/.test(digitsOnly);
  };

  const isShippingAddressValid = (gov: string, city: string, street: string, building: string) => {
    return (
      (gov || "").trim().length > 0 &&
      (city || "").trim().length > 0 &&
      (street || "").trim().length >= 3 &&
      (building || "").trim().length >= 1
    );
  };

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    governorate: EGYPTIAN_GOVERNORATES[0].nameAr,
    city: EGYPTIAN_GOVERNORATES[0].cities[0],
    streetName: "",
    buildingFlat: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalPhone, setModalPhone] = useState("");
  const [modalGov, setModalGov] = useState(EGYPTIAN_GOVERNORATES[0].nameAr);
  const [modalCity, setModalCity] = useState(EGYPTIAN_GOVERNORATES[0].cities[0]);
  const [modalStreetName, setModalStreetName] = useState("");
  const [modalBuildingFlat, setModalBuildingFlat] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const { user } = useAuth();
  const isOwner = !!(user?.id && product?.sellerId && user.id.toLowerCase() === product.sellerId.toLowerCase());

  // Auto-fill authenticated buyer profile data while leaving guest buyers with clean empty placeholders
  useEffect(() => {
    if (user) {
      const full = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      setAddress((prev) => ({
        ...prev,
        fullName: full || prev.fullName,
        phone: user.phoneNumber || prev.phone,
      }));
    }
  }, [user]);

  const executeOrderSubmission = async () => {
    if (!product) return;
    setIsSubmitting(true);
    try {
      const fullShippingAddress = `${address.streetName}, ${address.buildingFlat}`.trim();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productIds: [product.id],
          shippingAddress: fullShippingAddress,
          governorate: address.governorate,
          city: address.city,
        }),
      });

      if (res.ok) {
        router.push("/orders?success=true");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || err.message || "تعذر إتمام طلب الشراء. يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      console.error("Failed to submit order", err);
      alert("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOwner || isSubmitting) return;

    const hasValidPhone = isEgyptianPhoneValid(address.phone);
    const hasValidAddress = isShippingAddressValid(address.governorate, address.city, address.streetName, address.buildingFlat);

    if (!hasValidPhone || !hasValidAddress) {
      setModalPhone(address.phone || "");
      setModalGov(address.governorate || EGYPTIAN_GOVERNORATES[0].nameAr);
      setModalCity(address.city || EGYPTIAN_GOVERNORATES[0].cities[0]);
      setModalStreetName(address.streetName || "");
      setModalBuildingFlat(address.buildingFlat || "");
      setModalError(null);
      setShowDetailsModal(true);
      return;
    }

    executeOrderSubmission();
  };

  const handleSaveModalDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEgyptianPhoneValid(modalPhone)) {
      setModalError("يرجى إدخال رقم هاتف مصري صالح مكون من 11 رقم يبدأ بـ 01 (مثال: 01001234567)");
      return;
    }
    if (!isShippingAddressValid(modalGov, modalCity, modalStreetName, modalBuildingFlat)) {
      setModalError("يرجى اختيار المحافظة والمدينة وإدخال اسم الشارع ورقم المبنى بشكل مكتمل.");
      return;
    }

    setAddress((prev) => ({
      ...prev,
      phone: modalPhone,
      governorate: modalGov,
      city: modalCity,
      streetName: modalStreetName,
      buildingFlat: modalBuildingFlat,
    }));
    setShowDetailsModal(false);
    setModalError(null);

    executeOrderSubmission();
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-stone-500 font-bold text-sm">
        جاري تحضير بيانات الشراء...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      <div className="bg-stone-900 text-white py-8 sm:py-10 rounded-3xl mb-6 sm:mb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link
            href={product ? `/product/${product.slug}` : "/browse"}
            className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:underline"
          >
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
                  توصيل مباشر (30 ج.م)
                </span>
              </h2>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="أدخل الاسم الكامل"
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
                    autoComplete="off"
                    placeholder="01012345678"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              {/* Structured Address Selection (Governorate, City, Street Name, Building/Flat Number) */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">المحافظة *</label>
                  <select
                    value={address.governorate}
                    onChange={(e) => {
                      const newGov = e.target.value;
                      const availableCities = getCitiesForGovernorate(newGov);
                      setAddress({
                        ...address,
                        governorate: newGov,
                        city: availableCities[0] || "",
                      });
                    }}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-bold outline-none focus:border-stone-900 bg-white"
                  >
                    {EGYPTIAN_GOVERNORATES.map((g) => (
                      <option key={g.id} value={g.nameAr}>
                        {g.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">المدينة / المنطقة المعتمدة *</label>
                  <select
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-bold outline-none focus:border-stone-900 bg-white"
                  >
                    {getCitiesForGovernorate(address.governorate).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">اسم الشارع *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شارع البحر الرئيسي"
                    value={address.streetName}
                    onChange={(e) => setAddress({ ...address, streetName: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">رقم المبنى / الشقة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: عمارة 12 شقة 4"
                    value={address.buildingFlat}
                    onChange={(e) => setAddress({ ...address, buildingFlat: e.target.value })}
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

              {/* Buyer & Seller Return Policy Warning Banner */}
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
                <span className="text-amber-700 text-lg shrink-0">⚠️</span>
                <div className="text-xs font-bold text-amber-900 leading-relaxed">
                  تنبيه: في حالة رفض الشحنة أو الإرجاع، يتم تحميل كل من البائع والمشتري مبلغ 20 جنيه مصري كرسوم إرجاع وشحن.
                </div>
              </div>
            </div>
          </div>

          {/* Order Financial Breakdown Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sticky top-24">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">ملخص الحساب والشحنة</h2>

              {/* Product Info */}
              {product && (
                <div className="flex gap-3.5 items-center pb-4 border-b border-stone-100">
                  {product.imageUrl ? (
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.title}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="h-16 w-16 rounded-xl object-cover border border-stone-200"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 text-xs font-bold">
                      📷
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-amber-700">{product.categoryName || "عام"}</div>
                    <div className="font-bold text-sm text-stone-900 line-clamp-1">{product.title}</div>
                    <div className="text-xs font-semibold text-stone-500">حالة القطعة: {product.condition || "ممتاز"}</div>
                  </div>
                </div>
              )}

              {/* Server-Authoritative Fee Breakdown */}
              <div className="space-y-2.5 text-xs sm:text-sm font-medium text-stone-600">
                <div className="flex justify-between">
                  <span>سعر السلعة الأصلي</span>
                  <span className="font-bold text-stone-900">{itemPrice.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>رسوم التوصيل الثابتة (المدن المتاحة)</span>
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

              {isOwner ? (
                <div className="space-y-2">
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-800 text-center">
                    ⚠️ لا يمكنك شراء المنتجات التي قمت برفعها بنفسك
                  </div>
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-2xl bg-stone-300 py-4 text-sm font-bold text-stone-500 cursor-not-allowed shadow-none"
                  >
                    تأكيد الطلب غير متاح
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || isOwner}
                  className="w-full rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />
                      <span>جاري تأكيد الشحنة...</span>
                    </>
                  ) : (
                    "تأكيد الطلب الآن"
                  )}
                </button>
              )}

              <p className="text-[11px] text-center text-stone-500 font-medium">
                بضغطك على تأكيد الطلب، أنت توافق على شروط حماية المعاملات وسياسة الإرجاع.
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Missing Phone / Address Checkout Interception Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 text-xl font-bold shrink-0">
                📱
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900">استكمال بيانات التوصيل والتواصل</h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  يلزم وجود رقم هاتف مصري (11 رقم يبدأ بـ 01) وعنوان مكتمل لإتمام الدفع عند الاستلام.
                </p>
              </div>
            </div>

            {modalError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-800">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleSaveModalDetails} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-stone-800 mb-1">رقم الهاتف الخلوي (11 رقم يبدأ بـ 01) *</label>
                <input
                  type="text"
                  required
                  placeholder="01012345678"
                  value={modalPhone}
                  onChange={(e) => {
                    setModalPhone(e.target.value);
                    setModalError(null);
                  }}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-3 font-medium outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">المحافظة *</label>
                  <select
                    value={modalGov}
                    onChange={(e) => {
                      const newGov = e.target.value;
                      const availableCities = getCitiesForGovernorate(newGov);
                      setModalGov(newGov);
                      setModalCity(availableCities[0] || "");
                    }}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-3 font-bold outline-none focus:border-stone-900 bg-white"
                  >
                    {EGYPTIAN_GOVERNORATES.map((g) => (
                      <option key={g.id} value={g.nameAr}>
                        {g.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">المدينة / المنطقة *</label>
                  <select
                    value={modalCity}
                    onChange={(e) => setModalCity(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-3 font-bold outline-none focus:border-stone-900 bg-white"
                  >
                    {getCitiesForGovernorate(modalGov).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">اسم الشارع *</label>
                  <input
                    type="text"
                    required
                    placeholder="شارع البحر الرئيسي"
                    value={modalStreetName}
                    onChange={(e) => {
                      setModalStreetName(e.target.value);
                      setModalError(null);
                    }}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-3 font-medium outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">رقم المبنى / الشقة *</label>
                  <input
                    type="text"
                    required
                    placeholder="عمارة 12 شقة 4"
                    value={modalBuildingFlat}
                    onChange={(e) => {
                      setModalBuildingFlat(e.target.value);
                      setModalError(null);
                    }}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-3 font-medium outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-stone-900 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-stone-800 shadow-md"
                >
                  حفظ وتأكيد الطلب 🚀
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="rounded-2xl border border-stone-300 px-4 py-3.5 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
