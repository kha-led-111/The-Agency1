"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EGYPTIAN_GOVERNORATES, getCitiesForGovernorate } from "@/lib/cities";
import { useAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/lib/api";

interface SubcategoryDto {
  id: string;
  name: string;
  slug: string;
}

interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  subcategories?: SubcategoryDto[];
}

interface UploadedImageItem {
  id: string;
  url: string;
  previewUrl: string;
  isUploading: boolean;
  error?: string;
}

export default function CreateListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated, isLoading } = useAuth();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    condition: "Excellent",
    price: "",
    governorate: EGYPTIAN_GOVERNORATES[0].nameAr,
    city: EGYPTIAN_GOVERNORATES[0].cities[0],
    streetAddress: "",
    phone: "",
    description: "",
  });

  // Client Auth Guard - Redirect unauthenticated guest users immediately
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth?returnUrl=/seller/create-listing");
    }
  }, [isLoading, isAuthenticated, router]);

  // Auto-fill contact phone number from verified user profile data (no guest cache)
  useEffect(() => {
    if (user?.phoneNumber) {
      setFormData((prev) => ({ ...prev, phone: user.phoneNumber || "" }));
    }
  }, [user]);

  // Multi-image upload state (strictly empty initially - NO unsplash fallbacks!)
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [isPhotoAcknowledged, setIsPhotoAcknowledged] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasContactInfo = (text: string) => {
    if (!text) return false;
    const phonePattern = /(?:\+?20|0020|0)?1[0125][\s.-]?\d{3,4}[\s.-]?\d{4}/;
    const linkPattern = /(?:facebook\.com|fb\.com|fb\.me|instagram\.com|instagr\.am|wa\.me|whatsapp\.com|t\.me|telegram|viber|tiktok\.com|https?:\/\/|www\.|[a-zA-Z0-9-]+\.(?:com|net|org|me|link|site))/i;
    const keywordPattern = /(?:واتساب|واتس|فيس|فيسبوك|انستجرام|أنستجرام|تليجرام|تيك توك)/i;

    if (phonePattern.test(text) || linkPattern.test(text)) return true;
    if (keywordPattern.test(text) && (/\d{5,}/.test(text) || /@[\w_]+/.test(text))) return true;

    return false;
  };

  const contactInfoDetected = hasContactInfo(formData.title) || hasContactInfo(formData.description);

  const isEgyptianPhone = (phone: string) => /^01[0125][0-9]{8}$/.test(phone.trim());

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/marketplace/categories");
        if (res.ok) {
          const data: CategoryDto[] = await res.json();
          setCategories(data || []);
          if (data && data.length > 0) {
            const firstId = data[0].subcategories && data[0].subcategories.length > 0
              ? data[0].subcategories[0].id
              : data[0].id;
            setSelectedCategoryId(firstId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    fetchCategories();
  }, []);

  // Auto-clear image error banner once user uploads at least 2 valid images
  useEffect(() => {
    const validCount = uploadedImages.filter((img) => !img.error && !img.isUploading && img.url).length;
    if (validCount >= 2 && imageError) {
      setImageError(null);
    }
  }, [uploadedImages, imageError]);

  const compressAndConvertToJpeg = (file: File, maxDimension = 1920, quality = 0.85): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/") || typeof window === "undefined") {
        return resolve(file);
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return resolve(file);
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
            const compressedFile = new File([blob], `${baseName}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    });
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (uploadedImages.length + fileArray.length > 5) {
      setImageError("الحد الأقصى المسموح به هو 5 صور لكل منتج.");
      return;
    }

    setImageError(null);
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".heic"];
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];

    for (const rawFile of fileArray) {
      const ext = rawFile.name.includes(".") ? rawFile.name.slice(rawFile.name.lastIndexOf(".")).toLowerCase() : "";

      if (!allowedExtensions.includes(ext)) {
        setImageError("صيغة الملف غير مدعومة. يسمح فقط بصور من نوع (JPG, JPEG, PNG, WebP).");
        continue;
      }

      if (rawFile.type && !allowedMimeTypes.includes(rawFile.type.toLowerCase())) {
        setImageError("نوع الملف (MIME type) غير مدعوم. يسمح فقط بصور من نوع (JPG, JPEG, PNG, WebP).");
        continue;
      }

      if (rawFile.size > 10 * 1024 * 1024) {
        setImageError("حجم الصورة يتجاوز الحد الأقصى المسموح به (10 ميجابايت).");
        continue;
      }

      // Perform client-side compression/conversion to JPEG
      const file = await compressAndConvertToJpeg(rawFile);

      const tempId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const previewUrl = URL.createObjectURL(file);

      const newItem: UploadedImageItem = {
        id: tempId,
        url: previewUrl,
        previewUrl,
        isUploading: true,
      };

      setUploadedImages((prev) => [...prev, newItem]);

      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const res = await fetchWithAuth("/api/products/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (res.ok) {
          const data = await res.json();
          const serverUrl = data.imageUrl || data.url;
          if (serverUrl) {
            setUploadedImages((prev) =>
              prev.map((item) =>
                item.id === tempId
                  ? { ...item, url: serverUrl, isUploading: false }
                  : item
              )
            );
          }
        } else {
          if (res.status === 401) {
            const expiredMsg = "انتهت جلسة التسجيل، يرجى إعادة تسجيل الدخول لمتابعة إضافة الإعلان";
            setUploadedImages((prev) =>
              prev.map((item) =>
                item.id === tempId ? { ...item, isUploading: false, error: expiredMsg } : item
              )
            );
            setImageError(expiredMsg);
            setTimeout(() => {
              router.push("/auth?message=" + encodeURIComponent(expiredMsg));
            }, 2000);
            return;
          }

          const err = await res.json().catch(() => ({}));
          let errorMsg = err.error || err.detail || err.title || err.message;
          if (!errorMsg) {
            if (res.status === 413) {
              errorMsg = "حجم الصورة كبير جداً للسيرفر (الحد الأقصى 10 ميجابايت).";
            } else if (res.status === 415) {
              errorMsg = "صيغة الملف غير مدعومة من السيرفر.";
            } else {
              errorMsg = `فشل رفع الصورة إلى السيرفر (رمز الخطأ: ${res.status}).`;
            }
          }
          setUploadedImages((prev) =>
            prev.map((item) =>
              item.id === tempId ? { ...item, isUploading: false, error: errorMsg } : item
            )
          );
          setImageError(errorMsg);
        }
      } catch {
        setUploadedImages((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? { ...item, isUploading: false, error: "خطأ في الاتصال أثناء رفع الصورة." }
              : item
          )
        );
        setImageError("خطأ في الاتصال بالخادم أثناء رفع الصورة.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleSetPrimaryCover = (id: string) => {
    setUploadedImages((prev) => {
      const targetIndex = prev.findIndex((item) => item.id === id);
      if (targetIndex <= 0) return prev;
      const targetItem = prev[targetIndex];
      const rest = prev.filter((item) => item.id !== id);
      return [targetItem, ...rest];
    });
  };

  const handleDeleteImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((item) => item.id !== id));
  };

  const parsedPrice = parseFloat(formData.price) || 0;
  const sellerCommission = parsedPrice * 0.1;
  const estimatedPayout = Math.max(0, parsedPrice - sellerCommission);

  const isAnyUploading = uploadedImages.some((img) => img.isUploading);
  const primaryCoverImage = uploadedImages[0]?.url || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      setImageError("يرجى اختيار الفئة المطلوبة للمنتج.");
      return;
    }
    if (uploadedImages.length < 2 || !primaryCoverImage) {
      setImageError("يرجى رفع صورتين حقيقيتين على الأقل للقطعة المعروضة.");
      return;
    }
    if (!isPhotoAcknowledged) {
      setImageError("يرجى الإقرار بأن الصور المرفقة هي تصوير حقيقي للقطعة المعروضة.");
      return;
    }
    if (!formData.phone || !isEgyptianPhone(formData.phone)) {
      setImageError("يرجى إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015).");
      return;
    }

    setIsSubmitting(true);
    setImageError(null);

    // Auto-save phone number to user profile for future listings
    try {
      await fetchWithAuth("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: formData.phone.trim() }),
      });
    } catch (err) {
      console.error("Failed to update user profile phone number", err);
    }

    try {
      const res = await fetchWithAuth("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: `${formData.description}\nالموقع: ${formData.governorate} - ${formData.city} - ${formData.streetAddress}`,
          price: parsedPrice,
          condition: formData.condition,
          categoryId: selectedCategoryId,
          imageUrl: primaryCoverImage,
          imageUrls: uploadedImages.map((img) => img.url).filter((url) => url && !url.startsWith("blob:")),
          governorate: formData.governorate,
          city: formData.city,
          location: `${formData.governorate} - ${formData.city}`,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/seller");
        }, 1500);
      } else {
        if (res.status === 401) {
          const expiredMsg = "انتهت جلسة التسجيل، يرجى إعادة تسجيل الدخول لمتابعة إضافة الإعلان";
          setImageError(expiredMsg);
          setTimeout(() => {
            router.push("/auth?message=" + encodeURIComponent(expiredMsg));
          }, 2000);
          return;
        }

        const err = await res.json().catch(() => ({ message: "فشل إضافة الإعلان" }));
        setImageError(err.message || err.detail || "تعذر إضافة الإعلان. تأكد من إدخال جميع البيانات.");
      }
    } catch {
      setImageError("خطأ في الاتصال بالخادم.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16" dir="rtl">
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
            {/* Interactive Drag & Drop File Upload Zone */}
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">صور المنتج (2 إلى 5 صور) *</h2>
                  <p className="text-xs text-stone-500 font-medium">
                    اسحب وأسقط صور المنتج هنا، أو انقر للاختيار من جهازك (JPG, PNG, WebP) - مطلوب صورتين على الأقل
                  </p>
                </div>
                <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                  {uploadedImages.length} / 5 صور
                </span>
              </div>

              {/* Inline Used Item Condition Warning Prompt Callout */}
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs font-bold text-amber-900 flex items-start gap-2.5 shadow-sm">
                <span className="text-base leading-none shrink-0">⚠️</span>
                <span>برجاء تصوير القطعة الحقيقية بوضوح وإظهار أي عيوب إن وجدت لضمان قبول الإعلان وعدم استرجاعه</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFilesUpload(e.target.files);
                  }
                }}
                className="hidden"
              />

              {/* Drag & Drop Zone */}
              {uploadedImages.length < 5 && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition ${isDragging
                    ? "border-stone-900 bg-stone-100"
                    : "border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100/50"
                    }`}
                >
                  <div className="py-4 space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-2xl font-bold">
                      📷
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">اسحب وأسقط صور المنتج هنا أو انقر للرفع</p>
                      <p className="text-xs text-stone-400 mt-1">يسمح برفع من 2 إلى 5 صور (الحد الأقصى 5 ميجابايت للصورة)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Preview Thumbnail Cards */}
              {uploadedImages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-stone-700">معاينة الصور المرفوعة (الصورة الأولى هي الغلاف الأساسي):</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {uploadedImages.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`relative rounded-2xl border overflow-hidden bg-stone-100 flex flex-col justify-between p-1.5 transition ${idx === 0 ? "border-amber-400 ring-2 ring-amber-400/40" : "border-stone-200"
                          }`}
                      >
                        <div className="relative h-28 w-full overflow-hidden rounded-xl bg-stone-200">
                          <img
                            src={img.url}
                            alt={`معاينة ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {idx === 0 && (
                            <span className="absolute top-1 right-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                              ★ غلاف أساسي
                            </span>
                          )}
                          {img.isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span>جاري الرفع...</span>
                            </div>
                          )}
                        </div>

                        {/* Card Controls */}
                        <div className="mt-1.5 flex items-center justify-between gap-1">
                          {idx !== 0 ? (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryCover(img.id)}
                              className="text-[10px] font-bold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 rounded-md px-1.5 py-0.5"
                            >
                              جعله الغلاف
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 px-1 py-0.5">الغلاف</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-white border border-rose-100 rounded-md px-1.5 py-0.5"
                          >
                            حذف 🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Realness Mandatory Checkbox */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="photoAck"
                  checked={isPhotoAcknowledged}
                  onChange={(e) => setIsPhotoAcknowledged(e.target.checked)}
                  className="h-5 w-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer accent-stone-900"
                />
                <label htmlFor="photoAck" className="text-xs sm:text-sm font-bold text-stone-900 cursor-pointer select-none">
                  أقر بأن الصور المرفقة هي تصوير حقيقي للقطعة المعروضة.
                </label>
              </div>

              {/* Error Callout */}
              {imageError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  ⚠️ {imageError}
                </div>
              )}

              {/* Disabled upload requirement hint */}
              {uploadedImages.length < 2 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                  ⚠️ يرجى رفع صورتين حقيقيتين على الأقل للقطعة المعروضة.
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
                  autoComplete="off"
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
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900 bg-white transition"
                  >
                    {categories.map((c) =>
                      c.subcategories && c.subcategories.length > 0 ? (
                        <optgroup key={c.id} label={c.name}>
                          <option value={c.id}>الكل في {c.name}</option>
                          {c.subcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              └ {sub.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      )
                    )}
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
                    <option value="LikeNew">كالجديد (استعمال خفيف)</option>
                    <option value="New">جديد بالكامل</option>
                    <option value="Excellent">ممتاز</option>
                    <option value="Good">جيد</option>
                  </select>
                </div>
              </div>

              {/* Location & Contact Info */}
              <div className="space-y-4 border-t border-stone-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    بيانات الاتصال وموقع الاستلام *
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ربط تلقائي بالملف الشخصي
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    رقم هاتف التواصل والتسليم (مطلوب) *
                  </label>
                  <input
                    type="tel"
                    required
                    autoComplete="off"
                    placeholder="مثال: 01012345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-bold outline-none focus:border-stone-900 transition"
                  />
                  {formData.phone && !isEgyptianPhone(formData.phone) && (
                    <p className="mt-1 text-xs font-bold text-rose-600">
                      ⚠️ يرجى إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015).
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">المحافظة المعتمدة *</label>
                    <select
                      value={formData.governorate}
                      onChange={(e) => {
                        const newGov = e.target.value;
                        const availableCities = getCitiesForGovernorate(newGov);
                        setFormData({
                          ...formData,
                          governorate: newGov,
                          city: availableCities[0] || "",
                        });
                      }}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-bold outline-none focus:border-stone-900 bg-white transition"
                    >
                      {EGYPTIAN_GOVERNORATES.map((g) => (
                        <option key={g.id} value={g.nameAr}>
                          {g.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">المدينة / المركز *</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-bold outline-none focus:border-stone-900 bg-white transition"
                    >
                      {getCitiesForGovernorate(formData.governorate).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">العنوان التفصيلي للاستلام *</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="اسم الشارع، الحي، رقم العمارة أو المَعلم الشهير"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-3 text-sm font-medium outline-none focus:border-stone-900 transition"
                  />
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

            {/* Anti-Bypass Contact Info Detection Warning */}
            {contactInfoDetected && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs sm:text-sm font-bold text-rose-800 flex items-center gap-3">
                <span className="text-xl shrink-0">⚠️</span>
                <span>يُمنع كتابة أرقام الهواتف أو الروابط الخارجية لضمان أمان المعاملات.</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || isAnyUploading || uploadedImages.length < 2 || !isPhotoAcknowledged || !formData.phone || !isEgyptianPhone(formData.phone) || contactInfoDetected}
              className="w-full rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isSubmitting
                ? "جاري نشر الإعلان..."
                : isAnyUploading
                  ? "جاري رفع الصور..."
                  : uploadedImages.length < 2
                    ? "يرجى رفع صورتين حقيقيتين على الأقل للقطعة المعروضة"
                    : !isPhotoAcknowledged
                      ? "يرجى الإقرار بصحة وواقعية الصور المرفقة لإعادة النشر"
                      : !formData.phone || !isEgyptianPhone(formData.phone)
                        ? "يرجى إدخال رقم هاتف مصري صحيح للتواصل"
                        : contactInfoDetected
                          ? "يُمنع كتابة أرقام الهواتف أو الروابط الخارجية لضمان أمان المعاملات"
                          : "نشر الإعلان الآن"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
