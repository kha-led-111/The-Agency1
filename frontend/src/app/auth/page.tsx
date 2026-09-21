"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: authLogin, refreshUser } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      if (mode === "register") {
        const payload = {
          email: email.trim(),
          password: password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phone.trim() || "+20 100 000 0000",
        };

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await refreshUser();
          const redirectTarget = searchParams.get("returnUrl") || searchParams.get("redirect") || (typeof window !== "undefined" ? localStorage.getItem("redirect_after_login") : null);
          if (redirectTarget) {
            await authLogin(payload.email, payload.password);
            if (typeof window !== "undefined") {
              localStorage.removeItem("redirect_after_login");
            }
            router.push(redirectTarget);
            return;
          }
          setRegisteredEmail(payload.email);
        } else {
          const errData = await res.json().catch(() => ({}));
          const extractedErrors: Record<string, string> = {};

          if (errData.errors && typeof errData.errors === "object") {
            Object.keys(errData.errors).forEach((key) => {
              const messages = errData.errors[key];
              const msg = Array.isArray(messages) ? messages.join(" ") : String(messages);
              if (key.toLowerCase().includes("email")) {
                extractedErrors.email = "يرجى إدخال بريد إلكتروني صحيح وغير مسجل سابقاً.";
              } else if (key.toLowerCase().includes("password")) {
                extractedErrors.password = "كلمة المرور غير مطابقة للشروط: 8 أحرف على الأقل، حرف كبير، رقم، ورمز خاص.";
              } else if (key.toLowerCase().includes("firstname")) {
                extractedErrors.firstName = "الاسم الأول مطلوب (100 حرف كأقصى حد).";
              } else if (key.toLowerCase().includes("lastname")) {
                extractedErrors.lastName = "الاسم الأخير مطلوب (100 حرف كأقصى حد).";
              } else {
                extractedErrors[key] = msg;
              }
            });
          }

          setFieldErrors(extractedErrors);
          setErrorMessage(
            errData.detail || errData.title || errData.message || "فشلت عملية التسجيل. يرجى مراجعة الحقول الحمراء أدناه."
          );
        }
      } else {
        const targetEmail = email.toLowerCase().trim();
        const targetPassword = password;

        const result = await authLogin(targetEmail, targetPassword);
        if (result.success) {
          const isAdmin =
            result.user?.role === "Admin" ||
            targetEmail === "khaledgmal644@gmail.com" ||
            targetEmail === "alihesen1967@gmail.com";

          const redirectTarget = searchParams.get("returnUrl") || searchParams.get("redirect") || (typeof window !== "undefined" ? localStorage.getItem("redirect_after_login") : null);
          if (redirectTarget) {
            if (typeof window !== "undefined") {
              localStorage.removeItem("redirect_after_login");
            }
            router.push(redirectTarget);
          } else {
            router.push(isAdmin ? "/admin" : "/profile");
          }
        } else {
          setErrorMessage(result.error || "فشل تسجيل الدخول. يرجى التأكد من كلمة المرور والبريد.");
        }
      }
    } catch {
      setErrorMessage("تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8" dir="rtl">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Decorative branding sidebar */}
        <div className="rounded-[28px] bg-stone-900 p-8 text-white flex flex-col justify-between">
          <div>
            <span className="inline-block rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold text-amber-300">
              سوق الوكالة الموثوق
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl leading-tight sm:leading-snug">
              بناء الثقة والأمان في كل صفقة تجارية.
            </h1>
            <p className="mt-4 text-sm leading-7 text-stone-300 font-medium">
              اشتري وبع بكل سهولة وآمان مع نظام الدفع عند الاستلام بعد الفحص المباشر، وتغطية شاملة لجميع المحافظات عبر مناديب توصيل موثوقين.
            </p>
          </div>

          <div className="mt-8 space-y-3.5 text-xs sm:text-sm text-stone-200">
            {[
              "حسابات موثقة وبائعون معتمدون في المنصة",
              "حماية المشتري ودفع آمن بعد الفحص عند المعاينة",
              "تتبع الشحنة من التسليم وحتى كود الاستلام النهائي",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-stone-900">
                  ✓
                </span>
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auth form area */}
        <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Mode switch button */}
            <div className="inline-flex w-full rounded-full border border-stone-200 bg-white p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setRegisteredEmail(null);
                  setErrorMessage(null);
                  setFieldErrors({});
                }}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                  mode === "login" ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setRegisteredEmail(null);
                  setErrorMessage(null);
                  setFieldErrors({});
                }}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                  mode === "register" ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                حساب جديد
              </button>
            </div>

            {registeredEmail && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">✓</span>
                  <span>تم إنشاء الحساب بنجاح!</span>
                </div>
                <p className="mt-1.5 text-xs sm:text-sm text-emerald-800 leading-relaxed">
                  أهلاً بك في الوكالة! تم تسجيل حسابك ببريد <span className="font-bold">{registeredEmail}</span> وحسابك مفعل وجاهز للاستخدام فوراً.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setRegisteredEmail(null);
                  }}
                  className="mt-3 inline-flex items-center gap-1 font-bold text-emerald-900 underline text-xs hover:text-emerald-950"
                >
                  الانتقال لتسجيل الدخول الان ←
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm font-bold text-rose-800">
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "register" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-stone-700">
                    <span className="mb-2 block font-bold">الاسم الأول *</span>
                    <input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="مثال: أمينة"
                      className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition font-medium ${
                        fieldErrors.firstName ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400" : "border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
                      }`}
                    />
                    {fieldErrors.firstName && <p className="mt-1 text-xs font-bold text-rose-600">{fieldErrors.firstName}</p>}
                  </label>
                  <label className="block text-sm text-stone-700">
                    <span className="mb-2 block font-bold">الاسم الأخير *</span>
                    <input
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="مثال: فاروق"
                      className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition font-medium ${
                        fieldErrors.lastName ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400" : "border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
                      }`}
                    />
                    {fieldErrors.lastName && <p className="mt-1 text-xs font-bold text-rose-600">{fieldErrors.lastName}</p>}
                  </label>
                </div>
              )}

              <label className="block text-sm text-stone-700">
                <span className="mb-2 block font-bold">البريد الإلكتروني *</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition font-medium ${
                    fieldErrors.email ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400" : "border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
                  }`}
                />
                {fieldErrors.email && <p className="mt-1 text-xs font-bold text-rose-600">{fieldErrors.email}</p>}
              </label>

              <label className="block text-sm text-stone-700">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold">كلمة المرور *</span>
                  {mode === "login" && (
                    <Link href="/auth/forgot-password" className="text-xs font-bold text-amber-700 hover:underline">
                      نسيت كلمة المرور؟
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full rounded-2xl border bg-white pl-11 pr-4 py-3 text-sm outline-none transition font-medium ${
                      fieldErrors.password ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400" : "border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                  >
                    {showPassword ? (
                      /* EyeOff Icon */
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.88 9.88a3 3 0 104.24 4.24M10.73 5.08A10.43 10.43 0 0112 5c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 01-3.09-3.09M3 3l18 18" />
                      </svg>
                    ) : (
                      /* Eye Icon */
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p className="mt-1 text-xs font-bold text-rose-600">{fieldErrors.password}</p>
                ) : mode === "register" ? (
                  <p className="mt-1.5 text-[11px] font-medium text-stone-500">
                    💡 يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، تتضمن حرفًا كبيرًا، ورقمًا، ورمزًا خاصًا (!@#$%).
                  </p>
                ) : null}
              </label>

              {mode === "register" && (
                <label className="block text-sm text-stone-700">
                  <span className="mb-2 block font-bold">رقم الهاتف *</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 123 4567"
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-400 focus:ring-1 focus:ring-stone-400 font-medium dir-ltr text-right"
                  />
                </label>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-stone-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 shadow-sm mt-2"
              >
                {isSubmitting
                  ? "جاري المعالجة..."
                  : mode === "login"
                    ? "تسجيل الدخول إلى حسابك"
                    : "إنشاء حساب جديد"}
              </button>
            </form>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs sm:text-sm text-stone-500 font-medium pt-4 border-t border-stone-200">
            <span>{mode === "login" ? "ليس لديك حساب بعد؟" : "لديك حساب بالفعل؟"}</span>
            <button
              type="button"
              className="font-bold text-stone-900 hover:underline"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setRegisteredEmail(null);
                setErrorMessage(null);
                setFieldErrors({});
              }}
            >
              {mode === "login" ? "إنشاء حساب الان" : "تسجيل الدخول"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500 font-medium">جاري التحميل...</div>}>
      <AuthContent />
    </Suspense>
  );
}
