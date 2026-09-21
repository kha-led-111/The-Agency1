"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getImageUrl } from "@/lib/api";

interface AdminProductReview {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  categoryId: string;
  categoryName: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  imageUrl?: string;
  isApproved: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
}

export default function AdminProductReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();

  const [product, setProduct] = useState<AdminProductReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Rejection Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Delete Confirmation Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    async function fetchReviewDetails() {
      try {
        const res = await fetch(`/api/admin/products/${productId}/review`, {
          credentials: "include",
        });
        if (res.ok) {
          const data: AdminProductReview = await res.json();
          setProduct(data);
        } else {
          // Fallback demo product if API response is not ready
          setProduct({
            id: productId,
            sellerId: "09c619b5-3357-4053-8b98-cd744dd8b804",
            sellerName: "خالد جمال",
            sellerEmail: "khaledgmal644@gmail.com",
            sellerPhone: "+20 100 123 4567",
            categoryId: "11111111-1111-1111-1111-111111111111",
            categoryName: "إلكترونيات",
            title: "iPhone 15 Pro Max 256GB - Natural Titanium",
            slug: "iphone-15-pro-max-256gb",
            description:
              "حالة ممتازة كالجديد تماماً، علبة غير مفتوحة بالكامل. ضمان عام كامل مع جميع الملحقات الأصلية في العلبة.",
            price: 1199.99,
            condition: "LikeNew",
            status: "Draft",
            imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569",
            isApproved: false,
            createdAtUtc: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Error fetching review details:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) {
      fetchReviewDetails();
    }
  }, [isAdmin, productId]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/approve`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const updated = await res.json().catch(() => null);
        setProduct((prev) => (prev ? { ...prev, isApproved: true, status: "Published", ...(updated || {}) } : null));
        showToast("تمت الموافقة على الإعلان ونشره بنجاح في المتجر الإلكتروني!");
      } else {
        showToast("تعذر إجراء الموافقة. يرجى المحاولة لاحقاً.", "error");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!product) return;
    const reasonText = rejectionReason.trim() || "عدم استيفاء الشروط أو المواصفات المطلوب.";
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/products/${product.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: reasonText }),
      });

      if (res.ok) {
        const updated = await res.json().catch(() => null);
        setProduct((prev) => (prev ? { ...prev, isApproved: false, status: "Rejected", ...(updated || {}) } : null));
        setRejectModalOpen(false);
        setRejectionReason("");
        showToast("تم رفض الإعلان وإشعار البائع بالسبب بنجاح.");
      } else {
        showToast("تعذر تنفيذ قرار الرفض.", "error");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!product) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setDeleteModalOpen(false);
        showToast("تم حذف الإعلان نهائياً من قاعدة البيانات.");
        setTimeout(() => router.push("/admin"), 1200);
      } else {
        showToast("تعذر حذف الإعلان.", "error");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-stone-500 font-bold text-sm">
        جاري تحميل بيانات مراجعة الإعلان...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 border border-red-200 text-red-600 text-3xl mb-6">
          🔒
        </div>
        <h1 className="text-2xl font-bold text-stone-900">وصول محظور — إداري فقط</h1>
        <p className="mt-2 text-stone-500 text-sm">لا تملك صلاحيات كافية لاستعراض صفحة مراجعة الإعلان.</p>
        <Link href="/" className="mt-6 rounded-full bg-stone-900 px-6 py-3 text-xs font-bold text-white">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-xl font-bold text-stone-900">الإعلان غير موجود</h2>
        <p className="mt-2 text-stone-500 text-sm">لم نتمكن من العثور على الإعلان المطلوب للمراجعة.</p>
        <Link href="/admin" className="mt-4 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-bold text-white">
          العودة للوحة التحكم
        </Link>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (product.isApproved || product.status === "Published") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          معتمد ومباشر في المنصة
        </span>
      );
    }
    if (product.status === "Rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-3.5 py-1 text-xs font-bold text-rose-800">
          <span className="h-2 w-2 rounded-full bg-rose-600" />
          مرفوض من المراجعة
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-900">
        <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
        معلق ينتظر القرار
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {/* Toast alert */}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-50 rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-2xl transition ${
            toast.type === "error" ? "bg-rose-900" : "bg-stone-900"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 font-semibold mb-1">
            <Link href="/admin" className="hover:text-stone-900 transition">
              لوحة التحكم
            </Link>
            <span>/</span>
            <span>مراجعة الإعلان</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            تدقيق ومراجعة الإعلان: {product.title}
          </h1>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 transition shadow-sm"
        >
          ← العودة لطابور المراجعة
        </Link>
      </div>

      {/* Main Review Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column: Product Gallery & Specs */}
        <div className="space-y-6">
          {/* Main High-Res Image Gallery */}
          <div className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="relative aspect-video sm:aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-100 border border-stone-200">
              {product.imageUrl ? (
                <img
                  src={getImageUrl(product.imageUrl)}
                  alt={product.title}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-stone-400 text-sm font-bold">
                  <span>📷 لا توجد صورة متوفرة</span>
                </div>
              )}
              <div className="absolute top-3 right-3">{getStatusBadge()}</div>
            </div>

            {/* Title & Metadata Header */}
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700">
                  فئة: {product.categoryName || "عام"}
                </span>
                <span className="text-xs font-bold text-stone-400">
                  تاريخ التقديم: {new Date(product.createdAtUtc).toLocaleDateString("ar-EG")}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">{product.title}</h2>
              <p className="text-2xl font-extrabold text-amber-900">{product.price} ج.م</p>
            </div>
          </div>

          {/* Detailed Specifications & Description */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3">وصف الإعلان والمواصفات</h3>

            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm bg-stone-50 p-4 rounded-2xl border border-stone-200/70">
              <div>
                <span className="text-stone-500 font-medium block">الحالة المستعملة:</span>
                <span className="font-bold text-stone-900">{product.condition}</span>
              </div>
              <div>
                <span className="text-stone-500 font-medium block">الموقع المرجعي (Slug):</span>
                <span className="font-mono text-xs font-bold text-stone-700">{product.slug}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-stone-500 block mb-2">الوصف الكامل من البائع:</span>
              <p className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200/60 whitespace-pre-line">
                {product.description || "لا يوجد وصف إضافي مقدم من البائع."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Seller Profile & Action Controls */}
        <div className="space-y-6">
          {/* Action Control Panel Card */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
              لوحة قرار المراجعة والتحكم
            </h3>

            <div className="space-y-3 pt-1">
              {/* Approve Button */}
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading || product.isApproved}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>✓ موافقة ونشر الإعلان</span>
              </button>

              {/* Reject Button */}
              <button
                type="button"
                onClick={() => setRejectModalOpen(true)}
                disabled={actionLoading || product.status === "Rejected"}
                className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-bold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>✕ رفض الإعلان وتوضيح السبب</span>
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                disabled={actionLoading}
                className="w-full rounded-2xl border border-stone-200 bg-stone-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-stone-800 flex items-center justify-center gap-2"
              >
                <span>🗑 حذف الإعلان نهائياً</span>
              </button>
            </div>
          </div>

          {/* Seller Contact & Profile Details Card */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">بيانات وتواصل البائع</h3>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 text-[10px] font-bold text-amber-900">
                بائع معتمد
              </span>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-sm font-bold text-amber-300">
                  {product.sellerName ? product.sellerName[0] : "ب"}
                </div>
                <div>
                  <span className="block font-bold text-stone-900">{product.sellerName || "بائع المنصة"}</span>
                  <span className="text-xs text-stone-400 font-medium">معرف البائع: {product.sellerId.slice(0, 8)}...</span>
                </div>
              </div>

              <div className="rounded-2xl bg-stone-50 p-3.5 border border-stone-200/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">البريد الإلكتروني:</span>
                  <span className="font-bold text-stone-900 dir-ltr">{product.sellerEmail || "غير محدد"}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-stone-200/50">
                  <span className="text-stone-500 font-medium">رقم التواصل:</span>
                  <span className="font-bold text-stone-900 dir-ltr">{product.sellerPhone || "+20 100 000 0000"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-bold text-stone-900">سبب رفض الإعلان</h3>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500 font-medium leading-relaxed">
              يرجى كتابة سبب رفض نشر هذا الإعلان لإرسال تنبيه وتوضيح للبائع في حسابه:
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: الصور غير واضحة، تفاصيل السعر غير مطابقة للشروط، أو مواصفات المنتج غير المكتملة..."
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs sm:text-sm font-medium outline-none focus:border-stone-400 focus:bg-white transition"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="flex-1 rounded-2xl bg-rose-600 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-rose-700 shadow-sm"
              >
                تأكيد الرفض والإرسال
              </button>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4" dir="rtl">
            <h3 className="text-lg font-bold text-stone-900">تأكيد حذف الإعلان</h3>
            <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
              هل أنت أثق من رغبتك في حذف الإعلان <span className="font-bold text-stone-900">&quot;{product.title}&quot;</span> نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex-1 rounded-2xl bg-stone-900 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-stone-800 shadow-sm"
              >
                تأكيد الحذف النهائيات
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
