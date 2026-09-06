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
    <main className="mx-auto max-w-md rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-white">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">Forgot your password?</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Enter your registered email address and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      {status === "submitted" ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
          <p className="font-semibold text-lg">Check your inbox</p>
          <p className="mt-2 text-sm text-emerald-800">
            If an account exists for <span className="font-medium">{email}</span>, password reset instructions have been sent.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/auth/reset-password"
              className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              Have a Reset Token? Reset Now →
            </Link>
            <Link href="/auth" className="text-xs font-medium text-stone-600 hover:text-stone-900">
              ← Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm text-stone-700">
            <span className="mb-2 block font-medium">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@agency.com"
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white"
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
          >
            {status === "loading" ? "Sending reset link..." : "Send Reset Instructions"}
          </button>
        </form>
      )}

      <div className="mt-8 text-center text-xs text-stone-500">
        Remember your password?{" "}
        <Link href="/auth" className="font-medium text-stone-900 hover:underline">
          Log in
        </Link>
      </div>
    </main>
  );
}
