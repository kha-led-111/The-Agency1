"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setStatus("submitted");
    } catch {
      setStatus("submitted");
    }
  };

  return (
    <main className="mx-auto max-w-md rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8" dir="rtl">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-white">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">نسيت كلمة المرور؟</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600 font-medium">
          أدخل عنوان بريدك الإلكتروني المسجل وسنرسل لك تعليمات ورمز إعادة ضبط كلمة المرور.
        </p>
      </div>

      {status === "submitted" ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
          <p className="font-bold text-lg">تحقق من بريدك الإلكتروني</p>
          <p className="mt-2 text-xs sm:text-sm text-emerald-800 leading-relaxed font-medium">
            إذا كان هناك حساب مرتبط بـ <span className="font-bold">{email}</span>، فقد تم إرسال تعليمات إعادة الضبط بنجاح.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/auth/reset-password"
              className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-stone-800 shadow-sm"
            >
              لديك رمز إعادة الضبط؟ اضغط هنا للتعيين ←
            </Link>
            <Link href="/auth" className="text-xs font-bold text-stone-600 hover:text-stone-900">
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm text-stone-700">
            <span className="mb-2 block font-bold">البريد الإلكتروني</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white font-medium"
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-2xl bg-stone-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 shadow-sm"
          >
            {status === "loading" ? "جاري إرسال الرابط..." : "إرسال تعليمات إعادة الضبط"}
          </button>
        </form>
      )}

      <div className="mt-8 text-center text-xs text-stone-500 font-medium">
        تذكرت كلمة المرور؟{" "}
        <Link href="/auth" className="font-bold text-stone-900 hover:underline">
          تسجيل الدخول
        </Link>
      </div>
    </main>
  );
}

