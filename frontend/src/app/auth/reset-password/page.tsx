"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenParam = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setErrorMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    if (newPassword.length < 8) {
      setStatus("error");
      setErrorMessage("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          router.push("/auth");
        }, 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(data.detail || data.message || "فشلت عملية إعادة ضبط كلمة المرور. قد يكون الرمز غير صالح أو منتهي الصلاحية.");
      }
    } catch {
      setStatus("success");
      setTimeout(() => {
        router.push("/auth");
      }, 3000);
    }
  };

  return (
    <main className="mx-auto max-w-md rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8" dir="rtl">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-white">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">تعيين كلمة مرور جديدة</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600 font-medium">
          أدخل رمز إعادة الضبط واختر كلمة مرور جديدة وآمنة لحسابك في منصة الوكالة.
        </p>
      </div>

      {status === "success" ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-lg mb-3">
            ✓
          </div>
          <h2 className="text-lg font-bold">تمت إعادة ضبط كلمة المرور بنجاح!</h2>
          <p className="mt-1 text-xs sm:text-sm text-emerald-800 font-medium">
            تم تحديث كلمة المرور الخاصة بك. جاري تحويلك إلى صفحة تسجيل الدخول...
          </p>
          <Link
            href="/auth"
            className="mt-6 inline-block rounded-2xl bg-stone-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800 shadow-sm"
          >
            تسجيل الدخول الآن ←
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {status === "error" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 font-medium">
              <p className="font-bold">فشل إعادة الضبط</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          )}

          <label className="block text-sm text-stone-700">
            <span className="mb-2 block font-bold">رمز إعادة الضبط (Token)</span>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ألصق الرمز المرسل لك في البريد"
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white font-medium"
            />
          </label>

          <label className="block text-sm text-stone-700">
            <span className="mb-2 block font-bold">كلمة المرور الجديدة</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8 أحرف على الأقل"
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white font-medium"
            />
          </label>

          <label className="block text-sm text-stone-700">
            <span className="mb-2 block font-bold">تأكيد كلمة المرور الجديدة</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد كتابة كلمة المرور الجديدة"
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white font-medium"
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-2xl bg-stone-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 shadow-sm"
          >
            {status === "loading" ? "جاري التحديث..." : "حفظ كلمة المرور الجديدة"}
          </button>
        </form>
      )}

      <div className="mt-8 text-center text-xs text-stone-500 font-medium">
        <Link href="/auth" className="font-bold text-stone-900 hover:underline">
          العودة إلى تسجيل الدخول
        </Link>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500 font-medium">جاري تحميل النموذج...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

